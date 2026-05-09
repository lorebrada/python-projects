# 01 — Critical Errors and Required Corrections

This file lists every claim in Edition VIII that, on independent verification against primary sources, is *wrong* (as opposed to merely under-specified or hedged). Items are ranked by how load-bearing the claim is. For each, we give (a) the verbatim manuscript text or its essence, (b) the corrected statement, (c) the primary-source citation that establishes the correction, and (d) a suggested edit ready for paste into the source.

Severity legend: **[A] load-bearing**, will mislead a reader implementing or sizing a deployment; **[B] significant**, an expert reader will notice and discount the manual; **[C] minor**, technically wrong but does not change conclusions.

---

## E-1 [A] — DeepSeek-V3 layer composition: the first 3 layers are *dense FFN*, not "all-experts-activated"

**Where:** Ch. 19, p. 50, paragraph beginning "Two reductions are at play, and they're often conflated…":

> "DeepSeek-V3 has 3 layers where all 257 experts activate plus 58 layers with the routed top-8 + shared pattern, giving 1,354 activated experts per forward pass — the source of the 37.96B activated-parameter count in the technical report."

**Why it is wrong.** The DeepSeek-V3 Technical Report (arXiv:2412.19437, §2.1.2 and §4.2 architecture table) states that DeepSeek-V3 *replaces all FFNs with MoE FFNs except the first three layers*. The first three layers carry **a single ordinary dense SwiGLU FFN** — they are dense FFN layers, not "all 257 experts activated." Calling them "all-experts-activated" is a category error: those layers contain *no experts at all*; they contain one ordinary FFN with a (large) intermediate width.

The Fireworks blog post the manual cites (`[DeepSeek-arch]`) phrases this loosely as "v3 increases the all-experts-activated layer from 1 to 3", which is what the manual inherited; that phrasing is itself a misreading of DeepSeek-V2's structure (where the first 1 layer is also dense, not all-experts-activated). The DeepSeek-V2 paper (arXiv:2405.04434, §3.1) also says "we substitute all FFNs except for the first layer with MoE layers." Same pattern, also dense.

**The 1,354 figure.** Even taking Fireworks' (incorrect) interpretation, the arithmetic does not check out: by their own structural account `(61−3)·9 + 3·257 = 522 + 771 = 1,293`, not 1,354. The manual reproduced the bad arithmetic. The correct count of "FFN-component-applications per token per forward pass" is `58·9 + 3·1 = 525` (522 expert FFN applications across MoE layers, plus 3 dense FFN applications across dense layers). If you instead want to count *parameter-distinct expert tensors visited per token per forward pass*, it is `58·9 = 522` for routed/shared experts, plus 3 for the dense-FFN tensors — depending on how you count, between 522 and 525.

**The 37.96B activated parameters figure** is independent of the "1,354" miscount and *is* approximately correct (the Technical Report quotes 37B activated; appendix tables give 37.96B as the more precise activated-parameter count). It comes from: (3 dense FFN layers + 58 MoE layers' active experts) FFN parameters + attention (MLA) parameters across all 61 layers + embeddings + output head, summed per-token.

**Replacement text (suggested):**

> DeepSeek-V3 has **3 dense-FFN layers** at the beginning of the stack and **58 MoE layers** afterward. Each MoE layer contains 1 shared expert plus 256 routed experts, with top-8 routed experts activated per token (so 9 expert FFNs per MoE layer per token). Per-token FFN-component activations per forward pass are therefore `3 (dense FFNs) + 58 × 9 (MoE FFNs) = 525`. The 37.96B activated parameter count reported in the Technical Report (DeepSeek-AI, 2024) decomposes as ≈ 24B from the 522 active routed/shared expert FFNs, ≈ 1.2B from the 3 dense FFNs, ≈ 12B from MLA attention across all 61 layers, plus embeddings and output head.

**Citation:** DeepSeek-AI. *DeepSeek-V3 Technical Report.* arXiv:2412.19437v2, §2.1.2 ("DeepSeekMoE") and §4.2 ("Architecture") with the per-layer parameter table. Cross-check: DeepSeek-AI, *DeepSeek-V2 Technical Report*, arXiv:2405.04434, §3.1.

---

## E-2 [A] — Pollaczek–Khinchine waiting-time formula has a missing factor of E[S]

**Where:** Ch. 16, p. 45:

> "the Pollaczek–Khinchine formula gives mean wait time W = ρ²(1+C²)/(2(1−ρ))"

**Why it is wrong.** The standard Pollaczek–Khinchine mean *waiting-in-queue* time for an M/G/1 queue (Kleinrock vol. 1, eq. 5.69; Gross & Harris, *Fundamentals of Queueing Theory*, 4e, eq. 5.79) is

```
E[W_q] = (λ · E[S²]) / (2 · (1 − ρ))            (1, raw form)
       = (ρ · (1 + C²) · E[S]) / (2 · (1 − ρ))  (2, in terms of ρ, C, E[S])
```

where ρ = λE[S] is utilization, C² = Var(S)/E[S]² is the squared coefficient of variation of service time, and E[S] is the mean service time. Dimensionally E[W_q] must have units of time; the manuscript's `ρ²(1+C²)/(2(1−ρ))` is dimensionless. The error is the omission of the E[S] factor and the spurious squaring of ρ. (Possibly the writer collapsed `ρ · E[S] = λ · E[S]²` and then mis-typeset.)

**Replacement text (suggested):**

> "the Pollaczek–Khinchine formula gives mean queue-waiting time `E[W_q] = (ρ (1 + C²) E[S]) / (2 (1 − ρ))`, where ρ is utilization, C² is the squared coefficient of variation of service time, and E[S] is mean service time. As ρ → 1, E[W_q] grows without bound, and Var(W_q) ~ 1/(1−ρ)². For an LLM serving system the inputs to this formula are awkward — service time itself is correlated with load (preemptions extend it) — so this is a directional model, not a quantitative one. It explains the *shape* of the tail-latency cliff, not its position."

**Citation:** Kleinrock, L. *Queueing Systems Volume I: Theory*, Wiley 1975, eq. 5.69. Or Gross & Harris, *Fundamentals of Queueing Theory*, Wiley, 4th ed. 2008, eq. 5.79. (Either is canonical.)

---

## E-3 [B] — Decode arithmetic intensity formula ignores activation reads/writes and KV-cache reads

**Where:** Ch. 2, p. 13:

> "intensity (decode, B=1) = 2d² FLOPs / (d² × dtype_bytes) = 2 / dtype_bytes FLOP/byte"

and the corresponding plot annotation `1 FLOP/byte` for BF16 batch-1 decode.

**Why it is incomplete.** The formula is correct *for the linear projection's weight read in isolation*, but it omits two contributions that change the decode roofline at long context:

1. **Activation reads/writes are negligible at small d** but become non-negligible at long sequences for prefill, and for decode they affect FlashAttention-style kernels in subtle ways (the residual stream is read/written by every layer's projections).

2. **KV-cache reads dominate the attention sub-step** at long contexts. For a single decode step at sequence length n, with n_kv_heads × head_dim total cached width and dtype_bytes per element, the bytes read per layer per query head are `2 · n · head_dim · dtype_bytes` (K + V), and the FLOPs are `4 · n · head_dim` (one Q·K dot product and one P·V product per cached position, each `2 · head_dim` FLOPs). The arithmetic intensity of the attention sub-step is therefore

   ```
   intensity_attention(decode, B=1) = (4 · n · head_dim) / (2 · n · head_dim · dtype_bytes)
                                    = 2 / dtype_bytes  FLOP/byte
   ```

   — i.e., **the same** 1 FLOP/byte at BF16. So at batch=1 the attention sub-step has the *same* intensity as the linear sub-step, and both are equally bandwidth-bound.

3. **Batching helps the linear-projection sub-step but does not help the attention sub-step**, because attention is per-sequence — the KV cache is not shared across requests. This is the root cause of why "batching helps decode" is asymptotically capped: as B grows, weight reads amortize but KV reads do not.

   ```
   intensity_attention(decode, B>1) = 2 / dtype_bytes   ← unchanged in B
   intensity_linear(decode, B)      = 2B / dtype_bytes  ← scales with B
   ```

   The total decode arithmetic intensity is therefore a *weighted* combination, with the weights set by relative bytes-per-step (which depends on n and B). At long contexts, the attention sub-step's bytes dominate; the GPU stays bandwidth-bound *no matter how large B* is, because adding more requests adds more KV-cache traffic at the same rate as it adds more useful FLOPs.

**This is a substantive omission**, because every reader who tries to "just batch harder" to escape the bandwidth wall will be confused by why their throughput plateaus instead of climbing. The plateau is set by the KV-cache read rate, which Chapter 2's roofline does not model.

**Suggested replacement text (concise):**

> "The intensity formula above models the linear projections only. Attention's KV-cache reads add a second bandwidth term that does *not* amortize across the batch: at long n, KV reads dominate. We treat this fully in `02_PHYSICS_REDERIVED.md` Appendix A; for now, note that `intensity_attention(decode, B) = 2 / dtype_bytes` regardless of B. Batching slides the *linear* sub-step toward compute-bound, but the *attention* sub-step stays bandwidth-bound. This is why long-context decode does not benefit from batching as cleanly as short-context decode."

(Full re-derivation in `02_PHYSICS_REDERIVED.md` §A.)

**Citation:** Pope et al., *Efficiently Scaling Transformer Inference*, arXiv:2211.05102 (2022), §3.2 — derives the same separation. Their Tables 2–3 also show that this changes the optimal sharding strategy as a function of context length, which the Field Manual currently does not say.

---

## E-4 [B] — "MLA: ~98% reduction in absorb mode (71× per-layer)" is mis-cited

**Where:** Ch. 6, p. 23:

> "In the 'absorb' mode (where W_UV is fused into downstream ops so the cached latent is consumed without intermediate decompression), DeepSeek-V3 reports a 71× per-layer KV reduction relative to a naïve MLA implementation."

**Why it is suspicious.** The DeepSeek-V2 and V3 technical reports do report large reductions relative to MHA, but neither paper reports a "71× per-layer reduction relative to a naïve MLA implementation." MLA's KV memory is fixed by the cache size of `c_KV` (latent rank `d_c`) plus `k_R` (RoPE component, dimension `d_h^R`), independent of whether one runs in "absorb" mode or not. The "absorb" optimization is *kernel-level* — it eliminates an intermediate decompression to full K, V tensors at attention time — but does not change the cache size. There is no 71× factor in the V2 or V3 papers I can locate; it is plausibly a misreading of an earlier ablation table that compared MLA to MHA at a specific (V2-scale) configuration.

**Action:** drop the 71× claim, or attribute it precisely to its true source if one can be located. The clean claim is:

> "MLA caches `c_KV ∈ ℝ^{d_c}` plus `k_R ∈ ℝ^{d_h^R}` per token per layer. At the V3 configuration `(d_c=512, d_h^R=64, BF16)`, this is `(512+64)·2 = 1,152 bytes/token/layer`, against `2 · n_h · d_h · 2 = 2·128·128·2 = 65,536 bytes/token/layer` for an MHA equivalent at the same `n_h · d_h` — a reduction of 65,536 / 1,152 ≈ **57×**. The 'absorb' optimization is orthogonal and concerns kernel structure, not cache size."

**Citation:** DeepSeek-AI. *DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model.* arXiv:2405.04434, §3.1 and Table 1 (Appendix). The ratio depends on the chosen MHA baseline; the V2 paper uses 16-head MHA with d_h=128 as its baseline and reports an order-of-magnitude reduction.

---

## E-5 [B] — "Llama-3 has 128,256 vocabulary" and downstream mask-bytes calculation

**Where:** Ch. 21, p. 54:

> "Llama-3's vocab is 128 256 tokens. For a batch of 64 sequences, that's 8 MB of masks per step…"

**Why it is partly wrong.** Llama-3 (8B/70B) does have vocab 128,256. But "8 MB of masks" assumes 1 byte per token, which is correct only if the engine uses an int8 or bool-as-byte mask. Production engines use bitmasks (1 bit/token) for the boolean validity mask, reducing the per-step mask volume by 8×: 64 × 128,256 / 8 = 1.0 MB. This is a real number; XGrammar specifically uses bitmasks for the constraint mask. Calling this "small in absolute terms but enormous in latency if computed on the CPU" is fine, but the size is materially less than 8 MB.

**Suggested edit:** replace "8 MB" with "1 MB (128,256 / 8 bits/byte × 64 sequences)". The qualitative point is preserved.

**Citation:** Dong et al., *XGrammar: Flexible and Efficient Structured Generation Engine for Large Language Models*, arXiv:2411.15100, §3.2 (token-level bitmask).

---

## E-6 [B] — Sarathi-Serve speedup attribution

**Where:** Ch. 11, p. 34:

> "5.6–6.9× for Falcon-180B (8×A100)"

**Why it is imprecise.** The Sarathi-Serve OSDI '24 paper reports "5.6× on capacity-vs-vLLM and 6.9× on capacity-vs-Orca" (or vice versa, depending on the SLO regime). The 5.6× and 6.9× are not a *range over conditions* — they are *two different baselines*. Quoting them as a hyphenated range conflates two separate experiments.

**Suggested edit:** "5.6× over vLLM and 6.9× over Orca (Sarathi-Serve paper, Table 4) on Falcon-180B (8×A100), at fixed TTFT/TBT SLOs."

**Citation:** Agrawal et al., *Taming Throughput-Latency Tradeoff in LLM Inference with Sarathi-Serve*, OSDI '24 (arXiv:2403.02310v3), Table 4 and §6.

---

## E-7 [B] — H100 SFU "MUFU" terminology

**Where:** Ch. 4, p. 19:

> "exp evaluations, which run on the Special Function Units (NVIDIA's PTX instruction prefix is mufu.ex2; the term 'MUFU' appears in PTX, while 'SFU' appears in architectural documentation — both refer to the same hardware)."

**Why it is mostly correct, but slightly mis-attributed.** The PTX mnemonic is `ex2.approx` (no `mufu` prefix in modern PTX); historical SASS / compiler documentation has used `MUFU` (multi-function unit). Calling MUFU a "PTX instruction prefix" is not strictly accurate — it is a SASS / hardware-block name. The architectural literature uses **SFU**; SASS uses **MUFU**; PTX uses `ex2.approx`. All three refer to the same hardware unit.

**Suggested edit:** "exp evaluations, which run on the **Special Function Units** (referred to as MUFU at the SASS / hardware-block level, and exposed via the `ex2.approx` family of PTX instructions). On H100 SXM5 these deliver ~3.9 TFLOP/s for `exp` against 989 TFLOP/s for matmul (a ~256× ratio)."

**Citation:** NVIDIA PTX ISA 8.x, §9.7.3 (`ex2.approx` family). NVIDIA Hopper Tuning Guide, §3 ("Multi-Function Unit").

---

## E-8 [C] — H100 launch-overhead figure is engine-dependent

**Where:** Ch. 7, p. 23:

> "Stanford Hazy Research's microbenchmarks on H100 measure approximately 2.1 µs per kernel launch on a CUDA stream, with CUDA Graphs reducing this only slightly."

**Why it is partly imprecise.** The Hazy Research blog post does measure ~2 µs per stream-launched kernel, but separately reports CUDA Graph replay at sub-microsecond per node (~0.5 µs effective on long graphs). "Reducing this only slightly" is not consistent with their published numbers; CUDA Graphs typically reduce the per-launch overhead by 2–4× on H100 once the graph is captured. The reason CUDA Graphs are not a free lunch in production is *capture amortization* and *shape-stability* (which the manuscript does mention later) — not because per-replay overhead is similar to per-launch overhead.

**Suggested edit:** "Hazy Research's microbenchmarks on H100 report ~2 µs per stream-launched kernel and approximately 0.5–0.7 µs per node in a replayed CUDA Graph (a 3–4× reduction once captured). The reason CUDA Graphs do not eliminate this entirely as a fraction of step time on small models is capture amortization and shape-stability cost, not the per-replay overhead itself."

**Citation:** Hazy Research blog, *Look Ma, No Bubbles!: Designing a Low-Latency Megakernel for Llama-1B*, May 2025; cross-check NVIDIA *Getting Started with CUDA Graphs* developer documentation.

---

## E-9 [C] — "Edition VIII says NVLink 4 = 900 GB/s aggregate per H100"

**Where:** Ch. 8, p. 27:

> "On NVLink 4 (900 GB/s aggregate per H100)"

**Why it is fine but worth pinning.** 900 GB/s is the *aggregate bidirectional* per-GPU NVLink 4 bandwidth (18 links × 50 GB/s × 2 directions = 1.8 TB/s total full-duplex, of which 900 GB/s is each direction; NVIDIA marketing typically quotes "900 GB/s" as half-duplex, but the H100 datasheet labels it "900 GB/s NVLink Network Bandwidth"). The number is correct; the manuscript should note (in a hedge) that the precise meaning of "900 GB/s" depends on how full-duplex is counted, and that NCCL's "bus bandwidth" does not equal raw link bandwidth — it is application-level rate after accounting for the algorithmic factor `2(N−1)/N`.

**Suggested edit:** add a one-sentence footnote.

**Citation:** NVIDIA H100 Datasheet, Hopper Architecture Whitepaper §5.

---

## E-10 [C] — "32K-context KV is ~10.7 GB" cross-check

**Where:** Ch. 5, p. 22:

> "per 32 K context ~10.7 GB"

**Verification.** 32,768 × 327,680 B = 10,737,418,240 B = 10.74 GB (decimal). 10.0 GiB. The manuscript uses GB consistently with decimal interpretation, which is fine. Cross-checks: 4K → 1.34 GB (10.737/8 ≈ 1.342 ✓); 128K → 42.95 GB (10.737 × 4 = 42.948 ✓). All numbers internally consistent.

**Action:** none. Including for completeness because it is a load-bearing number cited downstream.

---

## E-11 [C] — Definition of `bytes_per_token` for paged attention

**Where:** Ch. 5, p. 21:

> "bytes_per_token = 2 × n_layers × n_kv_heads × head_dim × dtype_bytes"

**Verification.** Correct for standard MHA/GQA. The factor `2` is for K and V. The formula does not include any per-block overhead (block table entries, etc.), which is appropriate at the level of a sizing formula. Verified against vLLM `vllm/v1/core/kv_cache_manager.py`, `block_size` and `num_blocks` accounting.

**Note** (not an error): for MLA, this formula does not apply; MLA uses `(d_c + d_h^R) × dtype_bytes × n_layers`. The manual gets MLA's formula right separately in Ch. 6.

---

## E-12 [C] — "vLLM's flat hash table" is not quite accurate as of vLLM ≥ 0.6

**Where:** Ch. 12, p. 35:

> "SGLang generalizes vLLM's flat hash table into a radix tree over tokenized prefixes."

**Why it is mostly correct.** Up through vLLM v0.5, prefix caching used a flat hash table over block hashes. As of vLLM v0.7+, the implementation has gained some hierarchical features (for example, the prefix-caching V1 implementation uses a hash chain over `(block_hash, parent_hash)` which is structurally more like a tree than a flat dict). The contrast with SGLang's radix tree remains valid in that SGLang's structure is *purpose-built* for longest-prefix matching across many sequences, whereas vLLM's structure is hash-chain based and supports *exact* prefix matching primarily.

**Suggested edit:** "SGLang's radix tree generalizes vLLM's hash-chain implementation into a structure purpose-built for longest-prefix matching across many concurrent sequences sharing partial common ancestors."

**Citation:** SGLang paper §4 (RadixAttention); vLLM commit `vllm/v1/core/kv_cache_utils.py` (hash-chain construction).

---

## E-13 [C] — Speculative decoding "expected accepted" formula

**Where:** Ch. 14, p. 40:

> "E[accepted] = (1 − α^{k+1}) / (1 − α)    (geometric, with bonus token on full acceptance)"

**Verification.** Almost correct. The "bonus token on full acceptance" exists when, on full acceptance of all k drafted tokens, the target's residual distribution is sampled to produce one *additional* token, giving up to k+1 accepted tokens per verify pass. Under the i.i.d. acceptance assumption, the expected number of accepted tokens is

```
E[accepted | i.i.d. α] = (1 − α^{k+1}) / (1 − α)
```

which matches. **However**, this formula assumes the bonus token is always generated, which is true in the standard speculative-decoding implementation. It also assumes the verify pass *itself* has zero cost relative to the draft sequence. Wall-clock speedup is

```
speedup = E[accepted] / (1 + c_draft / c_target · k)
```

where `c_draft`, `c_target` are the per-step costs of drafter and target. The manuscript states "with a draft 1/20 the size of the target … 2–3× wall-clock speedup is realistic", which is consistent. It would help to write the speedup formula explicitly.

**Citation:** Leviathan, Kalman, Matias. *Fast Inference from Transformers via Speculative Decoding.* arXiv:2211.17192, §3, equations (1)–(3).

---

## E-14 [C] — "FlashAttention-2 only achieves about 35% of H100 peak FP16"

**Where:** Ch. 4, p. 18.

**Verification.** The FA-3 paper (Shah et al., NeurIPS 2024) reports FA-2's H100 BF16 peak at ~35% of peak (≈345 TFLOP/s out of 989 TFLOP/s). The figure ~35% matches.

**Note:** the manuscript would benefit from also citing that on Ampere (A100), FA-2 reaches ~70%+ of peak BF16 — i.e., the "35%" is a Hopper-specific issue caused by FA-2 not using WGMMA / TMA / async copies. This adds nuance.

---

## Summary of cross-cutting findings

- The numerical claims that are independently verifiable (H100 / H200 / B200 specs, Llama-3-70B config, KV-per-token arithmetic, NCCL ring formula, FA-3 published numbers, vLLM file paths) are accurate.
- The claims that are wrong tend to be inherited from secondary sources (Fireworks blog for DeepSeek-V3, generic queueing-theory shorthand for Pollaczek–Khinchine).
- No correction reverses the manual's overall arguments. Every error in this list can be fixed in-place without restructuring chapters.

— end critical errors —
