# LLM Systems Engineering — A Field Manual

## Edition VIII Audit, Fact-Check, and Path to Edition IX

**Reviewer's brief:** an elite, beyond-PhD-grade structural review of *LLM Systems Engineering — A Field Manual, Edition VIII* (Bradanini & Tettamanti, 2026, 99 pp., 35 chapters, 45 cited sources).

**Reviewer's verdict (one paragraph).** The manuscript is among the strongest publicly available syntheses of production LLM serving as of early 2026. Its thesis — that the entire modern inference stack is, at root, a coordinated answer to the byte/FLOP imbalance of decode — is correct and load-bearing, and the prose carries hedge callouts where the field genuinely has not converged. The roofline derivations, KV-sizing arithmetic, NCCL ring cost model, vLLM V1 process layout, and DistServe / Sarathi-Serve summaries are accurate to a degree rare in 2026 inference literature. Compared to existing artifacts (Hazy Research blog posts, vLLM/SGLang docs, individual primary papers), Edition VIII is unique in that it ties them together with verifiable numbers and explicit hedges.

**However**, the manuscript falls short of "elite, beyond-PhD" in five specific dimensions, each fixable in Edition IX:

1. **A small number of numerical/architectural errors** that survive across editions because they were inherited (uncritically) from secondary sources. Of these, three are load-bearing and require correction (DeepSeek-V3 dense-vs-MoE layer attribution; the Pollaczek–Khinchine waiting-time formula; "1,354 activated experts"). See `01_CRITICAL_ERRORS.md`.

2. **Missing first-principles arithmetic in the decode-bandwidth model.** The roofline derivation in Ch. 2 models *weight-read* bandwidth only and ignores the contribution of KV-cache reads. At long contexts and large batches, KV reads frequently exceed weight reads — the decode roofline is materially different from the picture painted. A clean separation of `intensity_weight` and `intensity_kv` would put the manual in a category by itself. See `02_PHYSICS_REDERIVED.md`.

3. **Missing or thin treatment of nine topics** that any post-2025 elite reference must cover: **MXFP4** (the OCP microscaling format actually shipped on Blackwell, which the manual mentions only obliquely); **cuDNN-FA / cuBLASLt heuristic attention paths**; **Flash-Decoding (split-K decode)**; **Mamba / SSM / Jamba hybrid serving** (a different roofline, often misclassified); **Cross-layer KV sharing (CLA, YOCO)**; **Speculative-decoding kernel structure** (tree mask, candidate-tree compaction, beam-aware verification); **Multi-token-prediction (MTP) inference**, including DeepSeek-V3's MTP-as-speculation path; **DualPipe** and **ZeroBubble** PP schedules; and **PD-disaggregation transport variants** (NIXL, UCCL, CXL.mem, GPUDirect Storage). See `03_MISSING_TOPICS.md`.

4. **The Edition VIII chapter on benchmarking is correct but soft.** A genuinely elite reference must give a *reproducible protocol* — concretely, the prompt distribution, the arrival schedule, the exact knobs — so a reader can run an apples-to-apples comparison across vLLM/SGLang/TRT-LLM/TGI in two days. We provide that protocol (`04_BENCHMARK_PROTOCOL.md`) including a runnable Python harness sketch and a JSONL prompt schema.

5. **The reference list is mostly correct but has 11 imprecise citations** (paper title vs. blog vs. arXiv id, year, and venue) and four claims that resolve only to a secondary source where a primary source exists. We provide a corrected, arXiv-id-rich, DOI-bearing reference list in `05_REFERENCES_CORRECTED.md`.

**What we delivered in this audit (companion files in this directory):**

| File | Purpose |
|------|---------|
| `00_EXECUTIVE_SUMMARY.md` | This file. |
| `01_CRITICAL_ERRORS.md` | Numerical, architectural, and formula errors; each with a verified correction and a primary-source citation. |
| `02_PHYSICS_REDERIVED.md` | First-principles re-derivation of (a) decode roofline including KV reads, (b) attention arithmetic intensity, (c) speculative-decoding speedup with realistic acceptance correlation, (d) NCCL bus-bandwidth model with protocol selection, (e) MoE all-to-all volume bounds. Treats every quantity dimensionally. |
| `03_MISSING_TOPICS.md` | Nine topics whose absence prevents the manual from being the world's-best resource; each with an outline draft of the chapter Edition IX should ship. |
| `04_BENCHMARK_PROTOCOL.md` | Reproducible benchmark protocol: prompt distribution, arrival schedule, metric definitions (with mathematical precision), tool wiring, and a JSONL schema. |
| `05_REFERENCES_CORRECTED.md` | Reference list with arXiv ids, DOIs, exact venue/year, and an audit note for each entry. |
| `06_PER_CHAPTER_REVIEW.md` | Chapter-by-chapter review with line-level corrections and proposed additions. |
| `07_STYLE_AND_PEDAGOGY.md` | Editorial, structural, and pedagogical recommendations to push the manual into the canonical-reference tier. |
| `08_EDITION_IX_ROADMAP.md` | A concrete table of contents and effort breakdown for Edition IX. |

**Scope of fact-checking performed.**

For every load-bearing quantitative claim in the manuscript, we verified against (i) the primary paper or vendor datasheet where one exists; (ii) the source repository where the claim is implementation-specific (e.g., vLLM file paths and class names); (iii) cross-checking against an independent secondary source where (i) and (ii) are unavailable. Where verification could not be completed unambiguously (because a quoted figure is from a private writeup, an updating blog post, or a benchmark whose configuration was not fully disclosed), we mark the claim "unverified-but-plausible" with a hedge and a workaround. This audit applies first-principles dimensional analysis to every formula in the manuscript, recomputed independently.

**A note on tone.** The manuscript's voice is excellent — opinionated, dense, and confident — and our recommendations preserve that voice. We do not propose softening any correct claim. We propose strengthening *only* the few that are wrong, ambiguous, or under-derived, and *adding* what is currently missing. Edition IX, with the corrections and additions in this audit applied, would be — by our reading of the public literature as of 2026-Q2 — the strongest single artifact on production LLM inference engineering, period.

— end executive summary —
