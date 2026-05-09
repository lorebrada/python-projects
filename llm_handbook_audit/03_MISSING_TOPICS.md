# 03 — Missing Topics for Edition IX

These are topics that, in the public 2026 inference engineering literature, are first-class concerns but are absent or under-treated in Edition VIII. Each section gives (i) why the topic matters, (ii) what the chapter should contain, and (iii) the canonical primary sources. With these added, the manual graduates from a strong synthesis into the canonical reference.

---

## M-1. MXFP4 microscaling and the OCP standard format

**Why it matters.** Edition VIII mentions FP4 as "Blackwell's bet" and notes it is "FP4 + scale" but does not name the standard, does not describe block size, does not contrast it with NVFP4, and does not explain why **MX** (microscaling) is materially different from "block-quantized FP4." In production on Blackwell, MXFP4 is the actually-shipping format with concrete properties:

- **Format:** MXFP4 = E2M1 (4-bit FP) with one shared E8M0 scale factor per block of **32** elements. (Blackwell hardware variant; the OCP MX spec also defines MXFP6 and MXFP8 with the same 32-element block size.)
- **Why E8M0 for the scale:** the scale is a power-of-two, so dequantization is a simple bit-shift — eliminating the arithmetic cost of per-block scale multiplication.
- **Hardware path:** Blackwell tensor cores natively consume MXFP4-formatted tensors and apply the E8M0 scale at no additional FLOP cost (the scale is *bypassed* into the accumulator). This is why FP4 hits 2× FP8 throughput.
- **NVFP4** is a minor NVIDIA variant with FP scale (E4M3) instead of E8M0; the OCP standard is MXFP4.
- **Accuracy implications:** the 32-element block size matters. Block-quantization at granularity 32 is strictly more accurate than per-tile (e.g., 128) because outliers are confined to fewer elements. The E2M1 format covers ±6 with 4 mantissa codes per sign × 2 exponents = 12 distinct values; the dynamic range relies entirely on the per-block scale.

**Edition IX chapter outline:**

1. The Open Compute Project Microscaling spec (OCP MX, 2023): MXFP4, MXFP6, MXFP8.
2. Bit layouts and decode arithmetic.
3. Why E8M0 scaling is hardware-friendly.
4. Outlier handling: rotation tricks, Hadamard preconditioning (used by FA-3 and by NVIDIA's TransformerEngine).
5. Per-tile vs per-block: when to use 32 vs 128.
6. The accuracy ladder (BF16 > FP8 E4M3 > MXFP6 > MXFP4) on a frontier reasoning eval suite (GSM8K, MATH-500, MMLU-Pro, HumanEval+, SWE-Bench Verified).

**Sources.** OCP Microscaling Formats Specification v1.0 (Sept 2023); NVIDIA Blackwell Architecture Whitepaper §3 (Transformer Engine 2nd Gen); Rouhani et al. *Microscaling Data Formats for Deep Learning*, arXiv:2310.10537.

---

## M-2. cuDNN-FA, cuBLASLt, and FlashInfer's dispatch heuristic

**Why it matters.** Edition VIII names FlashInfer as the kernel router but doesn't actually describe *what* it routes among. In practice, on Hopper-class hardware, four distinct attention kernel families compete:

1. **FA-3** (CUTLASS-based, Tri Dao et al.).
2. **cuDNN flash attention** (NVIDIA's heuristic-driven attention path; cuDNN ≥ 9 wraps FA-style kernels with NVIDIA's autotuner). Often the fastest path for non-standard head dims and long contexts on Blackwell.
3. **cuBLASLt-attention** (legacy GEMM-based path; rarely competitive for prefill but used as fallback).
4. **TensorRT-LLM kernels** (formerly XQA / sliced-attention variants; now upstreamed into FlashInfer).

FlashInfer (Ye et al., MLSys 2025) routes among these based on (a) head dimension, (b) sequence length, (c) batch shape, (d) KV layout (paged vs contiguous), (e) capability detection. Edition IX would benefit from a table listing which family wins on which workload, with a paragraph each.

**Sources.** NVIDIA cuDNN 9 release notes; FlashInfer paper (arXiv:2501.01005); NVIDIA TRT-LLM source `tensorrt_llm/_torch/attention_backend/`.

---

## M-3. Flash-Decoding and split-K decode kernels

**Why it matters.** Decode at long context is bandwidth-bound by KV reads, but the *parallelism* of the FA kernel is set by Q-row tiling — and at decode B=1, there is exactly one Q row per request. This leaves SMs idle even though HBM is saturated. Flash-Decoding (Dao et al., 2023, blog post and FA repo `flash_decoding` path) splits the K dimension across SMs, computing partial softmax outputs per split and reducing them via a second-pass reduction kernel. The result is full SM utilization at decode B=1, recovering ~2–4× decode throughput on long contexts.

**This is missing from Edition VIII.** It belongs in Ch. 4 (FA internals) or as a standalone section in Ch. 5/9.

**Sources.** Tri Dao, *Flash-Decoding for long-context inference*, FlashAttention repo / blog (October 2023); Hong et al. *FlashDecoding++*, arXiv:2311.01282.

---

## M-4. State-space hybrids: Mamba, Jamba, RecurrentGemma; their inference roofline

**Why it matters.** The Field Manual is implicitly transformer-only. Production deployments increasingly mix transformer and SSM (state-space model) blocks (e.g., Jamba 1.5, Mamba-2, RecurrentGemma, Mistral's "Codestral Mamba"). SSM blocks have a *fixed-size* hidden state per token (independent of sequence length), giving an entirely different inference roofline:

- **No KV cache that grows with context.** The "cache" is the SSM state, of size `state_dim` per layer, irrespective of n.
- **Decode is even more bandwidth-bound** than transformer decode at short context, because the state size is small and parallelism is constrained.
- **Specialized kernels:** Mamba-2's selective-scan kernel, RecurrentGemma's Griffin block.

Production engines (vLLM ≥ 0.7, llama.cpp) ship hybrid Mamba-Transformer support but the operational characteristics differ enough that conflating the two leads to bad sizing decisions.

**Edition IX outline:**
1. SSM block algebra and the "selective scan" kernel.
2. Inference roofline for an SSM layer.
3. Hybrid model serving: Jamba 1.5 (4× transformer + 4× SSM × 7 blocks), and what changes about the scheduler.
4. Why prefix caching is *different* for SSMs (the state must be replayed sequentially for new tokens; you cannot directly "share" SSM state from a different request).

**Sources.** Gu & Dao, *Mamba: Linear-Time Sequence Modeling with Selective State Spaces*, COLM 2024 (arXiv:2312.00752); Mamba-2 (arXiv:2405.21060); Jamba 1.5 technical report.

---

## M-5. Cross-layer KV sharing: CLA, YOCO, MiniCache

**Why it matters.** Beyond GQA and MLA, recent work shares KV across layers, not within layers. CLA (Brandon et al., 2024), YOCO (Sun et al., 2024), MiniCache, and DeepSeek's V3.1 explorations all reduce KV by `L_share / L_total` factors. This is currently *not* discussed in Ch. 6, which only treats GQA and MLA.

A production-tier reference must take a position: when does cross-layer sharing pay, when does it degrade quality, and what does the scheduler need to know about it?

**Edition IX outline:**
1. CLA: K, V from layer i shared with layers i+1, …, i+s; reduces KV by 1/(s+1).
2. YOCO: a more aggressive variant where the entire decoder shares one KV pool fed by an early "encoder."
3. Quality cliff: at what `s` does perplexity break? On Llama-2/3 it is roughly s=2 (50% reduction) cleanly; s=3 is borderline.
4. Implications for paged attention layout: the block table must be aware that multiple layers share the same physical block.

**Sources.** Brandon et al., *Reducing Transformer Key-Value Cache Size with Cross-Layer Attention*, arXiv:2405.12981. Sun et al., *You Only Cache Once*, arXiv:2405.05254. Liu et al., *MiniCache*, arXiv:2405.14366.

---

## M-6. Speculative-decoding kernel structure: tree masks, candidate compaction, beam-aware verification

**Why it matters.** Edition VIII covers the math of speculative decoding but glosses over the verifier kernel, which is structurally non-trivial. The verifier:

1. Receives a tree of drafted candidates (not a sequence).
2. Constructs a custom attention mask such that each tree node attends only to its ancestors in the tree.
3. Emits logits for each tree node in one forward pass.
4. The acceptance walker traces the longest accepted path through the tree.

This is a much richer kernel-and-control-flow problem than "verify k tokens in sequence." EAGLE-2 / EAGLE-3 use static trees; Sequoia / SpecExec use dynamic trees. The cost of a verifier kernel scales with *total tree-node count*, not the longest path length.

**Edition IX outline:**
1. Tree mask construction; the "ancestor mask" formalism.
2. Candidate compaction: pruning unlikely branches before verification.
3. Beam-aware verification: when sampling temperature > 0.
4. Memory layout: a flat candidate list with a parent-pointer field.
5. Numerical considerations: the residual distribution `max(0, p − q)` requires careful handling at FP8.

**Sources.** Li et al., *EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees*, arXiv:2406.16858. Chen et al., *Sequoia: Scalable, Robust, and Hardware-aware Speculative Decoding*, arXiv:2402.12374.

---

## M-7. Multi-token prediction (MTP) as an inference-time accelerator

**Why it matters.** DeepSeek-V3 uses MTP during *training*, but the trained MTP heads can be used at inference time as a drafter (the V3 paper §2.2 mentions this option, and DeepSeek's deployment uses it in some configurations). MTP-as-speculation is structurally different from a separate draft model:

- **No distribution mismatch:** the MTP head is trained jointly with the target on the same data, so α is high (typically 0.9+ for one-step lookahead).
- **No drafter footprint:** MTP heads share embeddings and output head with the main model.
- **Lower cost than EAGLE:** MTP heads are usually a single TRM block; EAGLE-3's drafter is multi-step.

Yet Edition VIII does not mention this option in Ch. 14.

**Edition IX outline:**
1. MTP module structure (per the V3 report eq. 21–25).
2. Inference-time use: discard MTP modules vs use them for speculation.
3. Acceptance-rate measurement on V3 production traffic (where public).
4. Comparison: MTP vs Medusa vs EAGLE-3 — not just *speed* but *integration cost*.

**Sources.** DeepSeek-V3 Technical Report §2.2; Gloeckle et al., *Better & Faster Large Language Models via Multi-token Prediction*, arXiv:2404.19737.

---

## M-8. DualPipe and ZeroBubble pipeline schedules

**Why it matters.** Edition VIII covers 1F1B and Interleaved-1F1B, but the production state of the art for large MoE models is **DualPipe** (DeepSeek-V3) and **ZeroBubble** (Qi et al., NeurIPS 2024). DualPipe overlaps compute with all-to-all comms; ZeroBubble achieves zero-bubble training pipelines via fine-grained scheduling. For inference, ZeroBubble's principles (compute-comm overlap at fine granularity) carry over and are how DeepSeek-V3's prefill is tuned.

**Edition IX outline:**
1. The DualPipe schedule: forward-backward overlapping with all-to-all dispatch/combine.
2. ZeroBubble's chunk scheduling.
3. How these apply to inference (forward-only): the "forward-only ZeroBubble" recipe.
4. Why this matters for MoE serving on multi-node deployments specifically.

**Sources.** DeepSeek-V3 Technical Report §3.2 (DualPipe). Qi et al., *Zero Bubble Pipeline Parallelism*, ICLR 2024 (arXiv:2401.10241).

---

## M-9. KV transport: NIXL, UCCL, GPUDirect Storage, CXL.mem

**Why it matters.** Edition VIII names NIXL, CXL, NVMe-oF in passing, but does not describe their semantics or when each is the right transport. This is the next frontier of inference systems.

**Edition IX outline:**
1. **NIXL** (NVIDIA Inference Xfer Library): GPU-direct RDMA primitive, integrated with Dynamo. API surface; backpressure; failure semantics.
2. **UCCL** (UCX-based collective comms): an alternative to NCCL with explicit support for one-sided KV transfer.
3. **GPUDirect Storage**: NVMe-to-HBM bypassing CPU. Latency profile.
4. **CXL.mem** for KV pooling across hosts (still emerging in 2026).
5. **DeepEP**: SGLang/DeepSeek's all-to-all primitive, structurally distinct from NCCL all-to-all.

**Sources.** NVIDIA Dynamo documentation (2025); NIXL repository; OpenUCX/UCCL project docs; CXL 3.1 spec.

---

## M-10 (bonus). The economics of FP4 quality regression

**Why it matters.** A practical question every team will face on Blackwell: does FP4 hold quality on *my* eval set? Edition VIII's hedge ("treat published FP4 quality numbers as preliminary") is correct but unhelpful. A more elite reference would provide a *protocol* for evaluating quality regression at lower precision:

1. Sample 1,000–10,000 prompts from production traffic.
2. Generate with BF16 (golden) and FP4 (candidate) at temperature=0 (deterministic).
3. Compute (a) exact-match rate, (b) longest-common-prefix, (c) downstream task metric (e.g., HumanEval pass@1 on a fixed seed).
4. Sequential probability ratio test (SPRT) to determine, with statistical confidence, whether FP4 regresses by more than X% on this distribution.

This is a one-page recipe Edition IX could include and would single-handedly elevate the "Quantization" chapter.

---

## M-11 (bonus). Recurrent reasoning and looped inference

**Why it matters.** As of 2025–2026, "thinking" models (OpenAI o1/o3, DeepSeek-R1, Anthropic's extended thinking, Gemini 2 Thinking) reason via long internal chains. Inference systems that serve these workloads have substantially different characteristics:

- **Output lengths are extreme** (10K–100K thinking tokens per request).
- **Cancellation latency matters** (users may abort mid-think).
- **Throughput dominated by decode**, not TTFT.
- **KV grows during the reasoning** to amounts that strain the pool even at moderate concurrency.

A chapter on serving thinking models would be a unique contribution.

**Edition IX outline:**
1. Thinking models' decode roofline (structurally identical to long-output decode but at scale).
2. KV admission for unbounded-output requests: a sigh-and-pray problem.
3. Mid-think cancellation, partial result emission.
4. Tool-call interleaving for thinking + tool-using agents (Cursor's Composer, Claude Code).
5. The serving stack changes: Anthropic's "long-output mode" and OpenAI's o-series serving practices (where public).

---

## Summary

The nine load-bearing additions (M-1 through M-9) plus two optional bonus chapters (M-10, M-11) would transform Edition IX from "the strongest open synthesis" into "the canonical reference." The total scope is sizable (each chapter is 3–6 pages in the manual's current density) but each topic is well-circumscribed and has an established primary literature.

— end missing topics —
