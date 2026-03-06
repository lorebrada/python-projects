-- ============================================
-- DSAR DESK - COMPLETE SCHEMA
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  dpo_email TEXT,
  dpo_name TEXT,
  country TEXT DEFAULT 'IT',
  intake_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  intake_enabled BOOLEAN DEFAULT TRUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'solo' CHECK (plan IN ('solo', 'team', 'agency')),
  stripe_customer_id TEXT UNIQUE,
  current_company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.company_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE TABLE public.requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_ip TEXT,
  right_type TEXT NOT NULL CHECK (
    right_type IN ('access', 'erasure', 'portability', 'rectification', 'restriction', 'objection')
  ),
  description TEXT,
  internal_notes TEXT,
  status TEXT DEFAULT 'open' CHECK (
    status IN (
      'open',
      'in_progress',
      'awaiting_verification',
      'completed',
      'extended',
      'refused',
      'overdue'
    )
  ),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  extended_deadline_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'intake_form', 'email')),
  identity_verified BOOLEAN DEFAULT FALSE,
  identity_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.audit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  event_type TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  right_type TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requests_company ON public.requests(company_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_deadline ON public.requests(deadline_at);
CREATE INDEX idx_audit_request ON public.audit_events(request_id);
CREATE INDEX idx_audit_company ON public.audit_events(company_id);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_companies" ON public.companies FOR ALL USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1
    FROM public.company_members m
    WHERE m.company_id = companies.id
      AND m.user_id = auth.uid()
  )
);

CREATE POLICY "own_profile" ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "member_requests" ON public.requests FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.companies c
    LEFT JOIN public.company_members m ON m.company_id = c.id
    WHERE c.id = requests.company_id
      AND (c.owner_id = auth.uid() OR m.user_id = auth.uid())
  )
);

CREATE POLICY "member_audit" ON public.audit_events FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.companies c
    LEFT JOIN public.company_members m ON m.company_id = c.id
    WHERE c.id = audit_events.company_id
      AND (c.owner_id = auth.uid() OR m.user_id = auth.uid())
  )
);

CREATE POLICY "member_templates" ON public.templates FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.companies c
    LEFT JOIN public.company_members m ON m.company_id = c.id
    WHERE c.id = templates.company_id
      AND (c.owner_id = auth.uid() OR m.user_id = auth.uid())
  )
);

CREATE POLICY "own_sub" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_upd
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_requests_upd
BEFORE UPDATE ON public.requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
