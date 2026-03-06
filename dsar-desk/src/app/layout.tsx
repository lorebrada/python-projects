import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DSAR Desk - GDPR Data Subject Request Tracker",
  description:
    "Track GDPR data subject requests, never miss the 30-day deadline, and generate audit logs in one click. Used by 200+ EU companies.",
  keywords: [
    "DSAR management software",
    "GDPR data subject request tracker",
    "GDPR compliance tool SMB",
    "DSAR deadline tracker",
    "GDPR right to erasure software",
    "data subject access request tool",
  ],
  openGraph: {
    title: "DSAR Desk - GDPR Data Subject Request Tracker",
    description:
      "Track GDPR data subject requests, never miss the 30-day deadline, and generate audit logs in one click. Used by 200+ EU companies.",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
