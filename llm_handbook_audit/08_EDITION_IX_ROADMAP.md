# 08 — Edition IX Roadmap

A concrete table of contents for Edition IX, mapping every audit finding to a specific change. Items inherited unchanged from VIII are unmarked; items that change are marked **CHANGE**; items that are new in IX are marked **NEW**.

The total scope is significant but well-circumscribed. Each chapter of the manual is, on average, 2–4 pages of dense prose; at this density, ~30 pages of new content cover the additions in `03_MISSING_TOPICS.md`, plus ~10 pages of corrections, additions, and re-derivations distributed across existing chapters. We do not propose calendar-time estimates (this is an autonomous-agent friendly project); we instead annotate complexity.

Complexity legend: **(L)** light edit (≤1 hour); **(M)** moderate (≤1 day); **(H)** heavy (multi-day, requires running benchmarks or new figures).

## Front matter

- Cover, copyright, "For the Reader" — minor updates to mention SSM/Mamba, MTP, and the new chapters.

- "About this Manual" — update reading paths to include the new chapters. (L)

- "A Note on Accuracy and Provenance" — unchanged.

- **NEW:** A one-page "Field Operational Rules" index. (M)

## I. Foundations

- **CHANGE Ch. 1** — add OS-level analogy table. (L)

- **CHANGE Ch. 2** — replace decode-intensity formula with the full roofline including KV reads; cite Pope et al. and add an extended-roofline figure showing MLA, GQA, MHA, FP8 as parallel lines. (M)

- **CHANGE Ch. 3** — add explicit `O(L²d + Ld²)` vs `O(d² + nd)` derivation. (L)

## II. GPU-Level Inference Mechanics

- **CHANGE Ch. 4** — fix MUFU/SFU PTX terminology; add Flash-Decoding section (split-K decode); add Ampere/Hopper FA-2 utilization comparison. (M)

- **CHANGE Ch. 5** — minor clarification on MQA/MLA inline. (L)

- **CHANGE Ch. 6** — drop or pin the 71× claim; add CLA / YOCO subsection. (M)

- **CHANGE Ch. 7** — quantitative CUDA Graph reduction figures; persistent-kernel paragraph. (L)

- **CHANGE Ch. 8** — quantitative NCCL bus-bandwidth η table replacing the "2× either direction" hedge. (M)

## III. Engine Core

- Ch. 9 — minor: include vAttention paragraph. (L)

- Ch. 10 — synthesis paragraph tying scheduler to chunked prefill and prefix caching. (L)

- **CHANGE Ch. 11** — fix Sarathi-Serve "5.6–6.9×" range (two baselines, not range). (L)

- **CHANGE Ch. 12** — fix vLLM "flat hash table" terminology. (L)

## IV. Distributed Inference

- **CHANGE Ch. 13** — add layer-by-layer KV-streaming overlap; describe NIXL transport semantics. (M)

- **CHANGE Ch. 14** — add tree-verification kernel structure; add MTP-as-speculation; add explicit verifier-cost-aware speedup formula. (H)

- **CHANGE Ch. 15** — add MXFP4 / NVFP4 / OCP MX section; clarify W8A8 / W4A16 nomenclature. (M)

## V. Production & Failure Modes

- **CHANGE Ch. 16** — fix Pollaczek–Khinchine formula; add quantitative tail-percentile model. (M)

- **CHANGE Ch. 17** — add worked example with concrete DCGM numbers. (L)

- **CHANGE Ch. 18** — add GH200 / GB200 NVL72 architectures (especially relevant for thinking-model serving). (M)

## VI. Advanced Topics

- **CHANGE Ch. 19** — fix DeepSeek-V3 dense-FFN attribution and "1,354 activated experts"; add quantitative all-to-all volume; describe DeepEP. (H)

- **CHANGE Ch. 20** — add ZigZag / Stripe Ring layout details with diagrams. (M)

- **CHANGE Ch. 21** — fix bitmask byte calculation (1 MB not 8 MB). (L)

- **CHANGE Ch. 22 — Benchmarking** — incorporate the protocol from `04_BENCHMARK_PROTOCOL.md`. Provide the runnable harness. (H)

## VII. Production Anatomy

- Ch. 23 — pin file paths to commit SHA + line ranges. (L)

- **CHANGE Ch. 24** — add OpenTelemetry / OTLP tracing paragraph. (L)

- **CHANGE Ch. 25** — add a "thinking model" subsection (or refer to new Ch. 38). (M)

- **CHANGE Ch. 26** — minor: tiktoken caching strategy; HF tokenizers crate. (L)

- **CHANGE Ch. 27** — add typical decoding, η-sampling, DRY repetition penalty. (L)

- **CHANGE Ch. 28** — add NVIDIA Dynamo and llm-d as first-class engines. (L)

## VIII. Adapters, Storage, & Streaming

- Ch. 29 — unchanged.

- **CHANGE Ch. 30** — add NIXL semantics, GPUDirect Storage, CXL.mem. (M)

- **CHANGE Ch. 31** — add WebTransport (HTTP/3). (L)

## IX. Applied Systems

- Ch. 32 — unchanged.

- **CHANGE Ch. 33** — add ZeroBubble and DualPipe schedules. (M)

- **CHANGE Ch. 34** — quote pricing as "Q1 2026"; convert to methodology rather than fixed numbers. (L)

- **CHANGE Ch. 35** — keep the chat case study; *add* a second case study (long-context document analysis or thinking-model agent). (H)

## X. NEW Section — State Spaces, Hybrids, and Reasoning

- **NEW Ch. 36 — SSMs and hybrids: serving Mamba, Jamba, Griffin** (see `03_MISSING_TOPICS.md` M-4). (H)

- **NEW Ch. 37 — Cross-layer KV strategies** (CLA, YOCO, MiniCache; see M-5). (M)

- **NEW Ch. 38 — Thinking models: serving extended-reasoning workloads** (see M-11). (H)

## Appendices

- Appendix A — Glossary (update for new terms). (L)

- Appendix B — Further reading (sync with corrected reference list). (L)

- **NEW Appendix C — Common derivations cheat sheet**. (M)

- **NEW Appendix D — Runnable `fieldmanual.derive` module**. (M)

- **NEW Appendix E — Benchmark protocol harness**. (H)

## Bibliography

Replace with the corrected reference list from `05_REFERENCES_CORRECTED.md`. (M)

## Companion repository

A separate GitHub repository, `field-manual-companion`, hosting:

- `derive.py` — runnable formulas.
- `benchmark/` — the harness from `04_BENCHMARK_PROTOCOL.md`.
- `prompts/` — the 10K-prompt benchmark corpus.
- `errata/` — issue tracker for Edition IX errata, feeding into Edition X.

Apache-2 license.

---

## Effort summary

The complete Edition IX program above contains:

- **3 [A] critical errors** to correct (`01_CRITICAL_ERRORS.md` E-1, E-2, E-3).
- **6 [B] significant corrections** to apply.
- **5 [C] minor edits** distributed across chapters.
- **3 new chapters** to draft (Ch. 36, 37, 38) — each ~3–6 pages.
- **9 substantial additions** to existing chapters (MXFP4, Flash-Decoding, MTP-as-spec, tree verification, ZeroBubble/DualPipe, NIXL/CXL, etc.).
- **2 new appendices** (cheat sheet + runnable module) and ~21 new bibliography entries.

This is the work program. Each item is small enough to verify in isolation; together they constitute the change from "the strongest open synthesis of LLM inference systems" to "the canonical reference of the field."

— end roadmap —
