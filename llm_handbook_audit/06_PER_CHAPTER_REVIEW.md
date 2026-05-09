# 06 — Per-Chapter Review

A chapter-by-chapter analytic pass through Edition VIII. For each chapter we record: (i) what is correct and load-bearing, (ii) what is wrong, ambiguous, or out of date, and (iii) a recommended edit. We use the same severity legend as `01_CRITICAL_ERRORS.md`: [A] load-bearing, [B] significant, [C] minor.

## Front matter (pp. 1–10) — "For the Reader," "About this Manual," "A Note on Accuracy and Provenance," "Contents," "The Thesis."

**Correct and load-bearing:** the framing claim that "a single request is not a discrete event" and that "the unit of work is a step, not a request." The H100 SXM5 numbers (989 TFLOP/s dense BF16, 3.35 TB/s HBM3, 900 GB/s NVLink-4). The B200 numbers (8 TB/s, 2.25 PFLOP/s dense BF16). All verified against the H100 datasheet and Blackwell whitepaper.

**Recommendations:**
- The line "the GPU is not an accelerator — it is the runtime" is the single best one-line summary in the manuscript. Lead Edition IX with this in display type.
- Add to "What this is not": this manual does not yet cover SSM/Mamba inference. (See `03_MISSING_TOPICS.md` M-4.)

---

## Ch. 1 — The inference workload as a new computational class

**Correct.** The taxonomy of three failure modes (request as scheduling unit; admit without memory accounting; request-level isolation) is precise and useful. The "real-time operating system" analogy is the right one and the manuscript draws the right correspondences (virtual memory, page tables, swap policy).

**[B] Recommendation:** the chapter could explicitly call out the OS-level analogy more concretely: paged attention ↔ paged virtual memory; continuous batching ↔ multitasking time-slicing; recompute preemption ↔ cooperative scheduling with restartable computations; admission control ↔ work conservation. A short table mapping each idea to its OS counterpart would be worth a page.

---

## Ch. 2 — The roofline of inference

**Correct.** Roofline derivation, ridge-intensity calculation (295 FLOP/byte for H100 BF16), the qualitative argument that batching slides the operating point right.

**[A] Critical:** The decode arithmetic-intensity formula `2 / dtype_bytes` ignores attention's KV-cache reads. See `01_CRITICAL_ERRORS.md` E-3 and `02_PHYSICS_REDERIVED.md` §A. This is the most consequential omission in the manuscript.

**[C] Recommendation:** add a side-bar comparing achievable peak under realistic configurations: B=1 BF16 ≈ 1 FLOP/byte, B=64 BF16 GQA-8 ≈ 64 FLOP/byte (linear) + 8 FLOP/byte (attention), B=64 FP8 GQA-8 ≈ 128 FLOP/byte (linear) + 16 FLOP/byte (attention).

---

## Ch. 3 — The prefill–decode asymmetry

**Correct.** The shape table (prefill GEMM `[L,d]·[d,d]` vs decode GEMV `[1,d]·[d,d]`) is exactly right. The phase-transition characterization is correct.

**[C] Recommendation:** add the per-token vs per-step distinction explicitly. Prefill cost scales as `O(L²·d + L·d²)`; decode step cost scales as `O(d² + n·d)`. The manuscript notes this implicitly; an explicit derivation would help.

---

## Ch. 4 — Attention internals: from FA-2 to FA-3

**Correct.** Online-softmax identity, FA-3's three innovations (warp specialization, GEMM/softmax interleaving, block FP8). MUFU/SFU clarification mostly correct. FA-3 numbers verified against the published paper.

**[B] Edit:** see `01_CRITICAL_ERRORS.md` E-7 (PTX vs SASS terminology for MUFU).

**[C] Add:** Flash-Decoding (split-K decode) is missing — a significant omission given the chapter covers FA-3 in depth. See `03_MISSING_TOPICS.md` M-3.

**[C] Add:** A note that on Ampere (A100), FA-2 reaches ~70% of peak, vs Hopper's ~35%. The ~35% is a Hopper-specific issue caused by FA-2 not using async Hopper features.

---

## Ch. 5 — KV cache: layout, sizing, cost of a token

**Correct.** Per-token KV formula. Llama-3-70B worked example numbers (327,680 B/token, 1.34 GB at 4K). Capacity arithmetic for H100 80GB / H200 141GB / B200 192GB.

**[C] Recommendation:** add a footnote about MQA/MLA sizing so the chapter is self-contained, instead of forwarding to Ch. 6.

---

## Ch. 6 — MLA: when KV compression beats GQA

**Correct.** MLA structural description (cached `c_KV` plus separate RoPE component), reduction calculation, V3 scale numbers.

**[B] Edit:** see `01_CRITICAL_ERRORS.md` E-4 — drop the "71× per-layer reduction relative to a naïve MLA implementation" claim or pin its source. Replace with the cleanly-derived comparison vs MHA at equivalent total head dimension.

**[C] Add:** mention CLA / YOCO as alternative cross-layer KV reduction strategies. See `03_MISSING_TOPICS.md` M-5.

---

## Ch. 7 — Kernel fusion, CUDA Graphs, and the launch tax

**Correct.** Launch-overhead arithmetic, fusion patterns (QKV fusion, RMSNorm + residual, SwiGLU), shape-stability problem. `captured_graphs` pattern matches vLLM's actual implementation.

**[C] Edit:** the per-launch overhead figure should be presented as a range (graph capture reduces it from ~2 µs to ~0.5 µs in benchmarks). See `01_CRITICAL_ERRORS.md` E-8.

**[C] Add:** persistent kernels — Hazy Research's "megakernel" approach for Llama-1B-class models is mentioned in passing; an explicit treatment of when megakernels apply would be valuable.

---

## Ch. 8 — Tensor parallelism and the collective tax

**Correct.** Megatron column/row partitioning, NCCL ring cost model, message-size calculation for Llama-3-70B at TP=4. The hedge about NCCL algorithm/protocol selection is appropriate.

**[C] Edit:** the 4.5 ms estimate at TP=4 uses peak NVLink bandwidth (900 GB/s); realistic NCCL bus bandwidth is ~30–35% of peak link, giving 12–15 ms. The hedge already covers this but could be quantitative. See `02_PHYSICS_REDERIVED.md` §C.

---

## Ch. 9 — Paged attention and the vLLM allocator

**Correct.** Block-table indirection mechanism, the `BlockManager` Python sketch, refcount-based prefix sharing. The `vAttention` hedge is appropriate.

**[C] Recommendation:** include a brief note on the vAttention proposal's results: it argues that PagedAttention's indirection costs more than commonly assumed (up to 2.8× kernel slowdown vs FA-2 in some configurations). The Field Manual mentions this in a hedge but a 1-paragraph treatment of the actual claim would help readers evaluate the trade-off.

---

## Ch. 10 — Continuous batching and iteration-level scheduling

**Correct.** The vLLM V1 step loop pseudocode is faithful to commit `42172ad`. Three-property analysis (flattened batch, token budget, recompute preemption) is right.

**[C] Recommendation:** add a paragraph on how the scheduler interacts with chunked prefill and prefix caching — currently they're discussed in separate chapters with no synthesis chapter that ties them together.

---

## Ch. 11 — Chunked prefill and Sarathi-style stall-free batching

**Correct.** P:D ratio formula, chunk-size trade-off, tile-quantization explanation.

**[B] Edit:** see `01_CRITICAL_ERRORS.md` E-6 — "5.6–6.9× for Falcon-180B" is two different baselines, not a range.

---

## Ch. 12 — Prefix caching and the radix-tree KV index

**Correct.** Hash-chain construction, longest-prefix lookup, cache-poisoning pitfall.

**[C] Edit:** see `01_CRITICAL_ERRORS.md` E-12 — vLLM's prefix-cache implementation is hash-chain based (more like a tree than a flat dict, as of v0.7+).

---

## Ch. 13 — Disaggregated prefill / decode

**Correct.** Bandwidth-budget table (NVLink, IB NDR, IB HDR, 25 Gb / 10 Gb Ethernet). The "<0.1% of total request time on 175B with 25 Gb/s links" claim is faithful to the DistServe paper.

**[B] Add:** the "stream KV layer-by-layer" overlap pattern (used by NVIDIA Dynamo and MoonCake) is missing. See `02_PHYSICS_REDERIVED.md` §E.

---

## Ch. 14 — Speculative decoding

**Correct.** Acceptance rule, distributional-exactness theorem, expected-accepted-tokens formula, EAGLE-3 vs Medusa vs draft-model trade-off table.

**[C] Add:** explicit speedup formula including verifier cost; correlation correction. See `02_PHYSICS_REDERIVED.md` §B.

**[B] Add:** MTP-as-speculation (DeepSeek-V3's MTP heads usable as drafters at inference). See `03_MISSING_TOPICS.md` M-7.

**[C] Add:** tree-based verification kernel structure. See `03_MISSING_TOPICS.md` M-6.

---

## Ch. 15 — Quantization

**Correct.** AWQ/GPTQ summaries, FP8 E4M3/E5M2 distinction, FP4 hedge, KV-INT8/INT4.

**[A] Add:** MXFP4 standard description (this is *the* shipping FP4 format on Blackwell). See `03_MISSING_TOPICS.md` M-1.

**[C] Edit:** the W8A8/W8A16 nomenclature is used in the table but not explained. Add a one-sentence definition: "W8A8 = 8-bit weights, 8-bit activations; W4A16 = 4-bit weights, 16-bit activations."

---

## Ch. 16 — Tail-latency collapse and admission control

**[A] Critical:** Pollaczek–Khinchine formula has a missing E[S] factor. See `01_CRITICAL_ERRORS.md` E-2.

**[B] Add:** quantitative model for tail-percentile (not just mean) under M/G/1. See `02_PHYSICS_REDERIVED.md` §F.

---

## Ch. 17 — The GPU underutilization paradox

**Correct.** DCGM metrics table, the explanation of why `nvidia-smi` "GPU-Util" misleads on memory-bound workloads.

**[C] Add:** a worked example showing the paradox concretely — "Here is a 92% nvidia-smi reading with 12% achieved bandwidth on H100 BF16 decode." The metric in question is `DCGM_FI_PROF_DRAM_ACTIVE` ÷ `DCGM_FI_PROF_SM_ACTIVE`.

---

## Ch. 18 — Hardware co-design: H100 → B200

**Correct.** The four consequences of B200 (TP=4 → TP=2, NVLink-5 doubling, FP4 economics, bandwidth-not-FLOP scaling).

**[C] Edit:** the "ridge ~206 FLOP/B" for H200 is a back-of-envelope (989/4.8 ≈ 206); should be confirmed against the H200 datasheet which lists FP16 dense at 989 TFLOP/s same as H100.

**[C] Add:** GH200 (Grace+Hopper superchip) and GB200 NVL72 architectures — for reasoning-model serving where 72-GPU NVLink domains change the parallelism map.

---

## Ch. 19 — MoE serving and expert parallelism

**[A] Critical:** DeepSeek-V3 first-3-layers attribution and "1,354 activated experts" arithmetic. See `01_CRITICAL_ERRORS.md` E-1.

**[B] Add:** quantitative all-to-all volume formula. See `02_PHYSICS_REDERIVED.md` §D.

**[B] Add:** DeepEP description (it is named but not described).

---

## Ch. 20 — Sequence parallelism and ring attention

**Correct.** Ring Attention algorithm, communication volume `O(L)`, DeepSpeed Ulysses comparison.

**[C] Add:** ZigZag and Stripe variants for load-balancing under causal masks. The current text mentions them in passing but does not show why the natural layout has the last rank computing nothing.

---

## Ch. 21 — Structured decoding and constrained generation

**Correct.** XGrammar, Outlines, LLGuidance comparison; CUDA-Graph incompatibility; speculative decoding interaction.

**[C] Edit:** see `01_CRITICAL_ERRORS.md` E-5 — "8 MB of masks" is 1 MB if bitmasks are used.

---

## Ch. 22 — Benchmarking inference

**[A] Add:** an actual reproducible benchmark protocol. See `04_BENCHMARK_PROTOCOL.md`.

The current chapter's checklist is correct but normative rather than operational; a runnable harness would be a unique contribution.

---

## Ch. 23 — vLLM V1 process model

**Correct.** Process count formula, file paths, IPC layer description. Faithful to the actual codebase.

---

## Ch. 24 — Production observability

**Correct.** Metric hierarchy, vLLM Prometheus surface, DCGM fields, three useful PromQL queries.

**[C] Add:** OpenTelemetry / OTLP traces — the inference-engine community is converging on OTLP for distributed tracing across the API server / engine core / worker boundaries; a paragraph on instrumentation would round out the chapter.

---

## Ch. 25 — Agentic and multi-turn workloads

**Correct.** Conversation-affine routing, prefix-cache bandwidth math, the three pathologies (cache thrash, tool-result poisoning, retry storms).

**[C] Add:** the rise of "thinking" / extended-reasoning models (o1/o3, R1, Claude with extended thinking). See `03_MISSING_TOPICS.md` M-11.

---

## Ch. 26 — The tokenizer hot path

**Correct.** Tokenizer-throughput table, GIL interaction, async-tokenization pattern, batch detokenization.

**[C] Add:** tiktoken's caching strategy (which exploits the fact that BPE merges are deterministic) and how HuggingFace's `tokenizers` Rust crate compares structurally.

---

## Ch. 27 — Sampling: from logits to tokens

**Correct.** The 8-step sampling stack, top-k/top-p/min-p semantics, the "T=0 + constrained" correctness pitfall.

**[C] Add:** typical decoding (Meister et al., 2023), η-sampling, and DRY repetition penalty (Quesnelle, 2024) — all increasingly common in production sampler stacks.

---

## Ch. 28 — The engine ecosystem

**Correct.** vLLM / SGLang / TRT-LLM / TGI / llama.cpp comparison.

**[C] Add:** explicit mention of NVIDIA Dynamo (which the manual references but does not categorize), and llm-d (Red Hat / IBM); both are first-class production frameworks as of 2026 and the chapter omits them.

---

## Ch. 29 — Multi-LoRA serving

**Correct.** BGMV kernel pattern, S-LoRA / Punica explanation, the bandwidth-math example.

---

## Ch. 30 — KV cache offloading and the storage hierarchy

**Correct.** Tier table, transfer-cost ledger, LMCache / MoonCake / NVIDIA Dynamo descriptions.

**[B] Add:** GPUDirect Storage and NIXL semantics; CXL.mem prospects. See `03_MISSING_TOPICS.md` M-9.

---

## Ch. 31 — Streaming protocols

**Correct.** SSE / WebSocket / gRPC trade-offs, buffering pitfalls, configuration audit.

**[C] Add:** WebTransport (HTTP/3) — emerging in 2025–2026 for low-latency streaming with bidirectional streams.

---

## Ch. 32 — Security and multi-tenancy

**Correct.** Four leakage vectors. The cache-side timing-leak observation is correctly attributed and the remediation table is right.

---

## Ch. 33 — Pipeline parallelism

**Correct.** Bubble formula, 1F1B / Interleaved-1F1B, when PP wins over TP.

**[B] Add:** ZeroBubble and DualPipe schedules. See `03_MISSING_TOPICS.md` M-8.

---

## Ch. 34 — Vendor APIs vs self-hosted: the real TCO

**Correct.** Break-even arithmetic, the "60–80% sustained utilization" threshold, hidden costs (engineering time, capacity-planning risk, model-upgrade cost).

**[C] Edit:** managed-API pricing changes quarterly; cite the prices as "as of Q1 2026" and provide a methodology rather than fixed numbers.

---

## Ch. 35 — Case study: Llama-3-70B to 1,000 users

**Correct.** Walks through capacity sizing, parallelism choice, scheduler config, routing, observability, and cost. Each step references the relevant chapter — a good pedagogical model.

**[C] Recommendation:** Edition IX could include a *second* case study for a structurally different workload — e.g., a long-context document-summarization service, or a thinking-model agent platform. The first case study is chat-shaped; a different shape would test the architecture differently.

---

## Glossary and Further Reading

**Correct and well-organized.** No corrections needed. The further-reading appendix is well-curated; the bibliography corrections in `05_REFERENCES_CORRECTED.md` apply only to the main reference list.

— end per-chapter review —
