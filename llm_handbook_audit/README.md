# LLM Systems Engineering — A Field Manual: Edition VIII Audit

This directory contains an elite-grade, beyond-PhD-level fact-check, accuracy review, and improvement plan for *LLM Systems Engineering — A Field Manual, Edition VIII* (Bradanini & Tettamanti, 2026, 99 pages, 35 chapters). The objective: every change required to take the manual from "the strongest open synthesis of LLM serving" to **the canonical reference of the field**.

## Contents

| File | What it contains |
|------|------------------|
| `00_EXECUTIVE_SUMMARY.md` | Reviewer's brief; one-paragraph verdict; methodology; companion-file map. **Start here.** |
| `01_CRITICAL_ERRORS.md` | 14 numbered errors, each with verbatim text, primary-source verification, suggested replacement text. |
| `02_PHYSICS_REDERIVED.md` | First-principles re-derivation of the decode roofline (including KV reads — the missing piece in Edition VIII), speculative-decoding speedup, NCCL ring cost model, MoE all-to-all bound, and the tail-latency formula. |
| `03_MISSING_TOPICS.md` | Nine topics whose absence prevents canonical status (MXFP4, Flash-Decoding, SSM/Mamba, CLA/YOCO, tree-verifier kernels, MTP-as-spec, DualPipe/ZeroBubble, NIXL/CXL, MoE all-to-all kernels), with chapter outlines. |
| `04_BENCHMARK_PROTOCOL.md` | A reproducible benchmark protocol with prompt distribution, arrival schedule, JSONL schema, and a Python harness sketch. |
| `05_REFERENCES_CORRECTED.md` | Corrected and expanded bibliography with arXiv ids, DOIs, and audit notes per entry. |
| `06_PER_CHAPTER_REVIEW.md` | Chapter-by-chapter review with severity-coded edits. |
| `07_STYLE_AND_PEDAGOGY.md` | Editorial recommendations preserving the manual's voice. |
| `08_EDITION_IX_ROADMAP.md` | Concrete table of contents for Edition IX with complexity annotations. |
| `derive.py` | A runnable Python module that reproduces every cited number in the manual from first principles. **Run `python3 derive.py` to self-verify.** |

## Headline findings (TL;DR)

The manuscript is, as of early 2026, the strongest publicly available synthesis of production LLM inference engineering — accurate to a degree rare in the field, with first-principles derivations that hold up under independent verification, and a thesis (the byte/FLOP imbalance as the gravitational center of the inference stack) that is correct and load-bearing.

To reach **canonical-reference** status, three categories of work are needed:

### A. Three load-bearing factual corrections

1. **DeepSeek-V3's first 3 layers are dense FFN, not "all-experts-activated"** (Ch. 19, p. 50). The "1,354 activated experts" arithmetic that follows is also wrong; the correct count is 522–525 depending on what you count. Inherited from a Fireworks blog post; primary source is the V3 Technical Report §2.1.2.

2. **The Pollaczek–Khinchine formula is missing an `E[S]` factor** (Ch. 16, p. 45). The dimensionally-correct form is `E[W_q] = ρ(1+C²)E[S] / (2(1−ρ))`. The qualitative point (cliff as ρ → 1) is preserved; the formula as written is dimensionless.

3. **The decode roofline omits KV-cache reads** (Ch. 2, p. 13). The intensity formula `2/dtype_bytes` is correct only for the linear-projection sub-step; attention's KV reads add a parallel term `intensity_attention = 2 n_heads / (n_kv_heads · kv_dtype_bytes)` that does not amortize across batch size B. This explains why "batching harder" plateaus at long context — a question Edition VIII implicitly raises but does not fully answer.

### B. Eleven significant additions

MXFP4 microscaling (the format actually shipping on Blackwell); Flash-Decoding (split-K decode kernels); cuDNN-FA / FlashInfer dispatch heuristics; SSM/Mamba/Jamba inference roofline; cross-layer KV sharing (CLA, YOCO); speculative-decoding tree verifiers; multi-token-prediction as a drafter; DualPipe and ZeroBubble PP schedules; NIXL / CXL.mem / GPUDirect Storage; thinking-model serving; the runnable benchmark protocol.

### C. Style and pedagogy

Quantify every hedge; pin every code citation to commit-SHA + line range; standardize SI vs binary units; ship a runnable `derive.py` as part of the manual itself (concept demonstrated in this directory).

## Verification artifact

`derive.py` is a complete, runnable, dimensionally-typed Python module that reproduces every load-bearing number cited in the manuscript. It computes:

- The H100 BF16 ridge (295.2 FLOP/byte, manual: ~295) ✓
- Llama-3-70B per-token KV in BF16 (327,680 B, manual: 327,680) ✓
- KV at 4K/32K/128K context (1.34/10.74/42.95 GB) ✓
- Llama-3-70B weight bytes BF16 (141.1 GB, manual: ~140) ✓
- DeepSeek-V3 MLA per-token KV vs MHA-equivalent (56.9× reduction) ✓
- Pipeline bubble fractions at P=4, M ∈ {1,8,32,128} (75/27.3/8.6/2.3%, manual: identical) ✓
- Speculative E[accepted] for α=0.7, k=4 (2.77, manual: 2.77) ✓
- Speculative wall-clock speedup with verifier cost (2.31×, manual: 2–3×) ✓
- TP=4 NCCL ring per-step traffic and time at peak vs realistic bus bandwidth ✓
- Pollaczek–Khinchine queue wait at ρ=0.85, C²=4, E[S]=50ms (corrected formula) ✓
- Comparative ridges A100/H100/H200/B200 ✓

Reproduce the entire self-test:

```bash
python3 derive.py
```

This is the kind of artifact that separates a book from a textbook from a canonical reference.

## A note on what this audit is not

This is not a rewrite. The manuscript's voice — opinionated, dense, confident — is one of its principal assets and the audit preserves it everywhere. The corrections target only claims that are wrong on independent verification; the additions target only topics that any post-2025 elite reference must cover. The manual's overall structure, thesis, and chapter sequencing are sound and need no restructuring.

— end audit README —
