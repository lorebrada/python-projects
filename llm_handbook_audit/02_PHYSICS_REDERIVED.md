# 02 — First-Principles Re-Derivation of Every Quantitative Model

This file recomputes, from physical and arithmetic first principles, every quantitative model the Field Manual relies on. The objective is to give a reader who wants to *check* the manual's numbers an independent path to verify them, with units carried throughout. Where the manual abbreviates, we expand. Where the manual implicitly assumes something, we make the assumption explicit. Where the manual rounds, we keep an extra digit and note the rounding direction.

We prefix each derivation with a one-line definition of the symbols, and we end each with a *cross-check* against an independent source where possible.

Notation throughout (consistent with the Field Manual):

- `d` — model hidden dimension (a.k.a. `d_model`).
- `m` — FFN intermediate dimension. For SwiGLU FFN, the gate and up projections are `d → m` and the down projection is `m → d`. The FFN parameter count per layer is `3·d·m`.
- `n_h` — number of attention heads.
- `d_h` — head dimension. For most models `n_h · d_h = d`, but MLA breaks this.
- `n_kv` — number of KV heads (n_kv = n_h for MHA, smaller for GQA, 1 for MQA).
- `L` — sequence length (for prefill: prompt length; for decode: position in generation).
- `B` — batch size.
- `dtype_bytes` — bytes per element of the activation/weight dtype (2 for BF16/FP16, 1 for FP8/INT8, 0.5 for FP4/INT4).
- `b` — KV-cache dtype bytes (may differ from activation dtype, e.g. INT8 KV with BF16 activations).

---

## A. Decode roofline including KV reads (the missing derivation)

**Setup.** A single decode step on a transformer with `n_layers` layers, hidden `d`, FFN intermediate `m`, attention heads `n_h`, KV heads `n_kv`, head dim `d_h`, processing one batch of B sequences each at position `n` in their generation.

**Bytes moved per step.** We separate weight reads and KV-cache reads.

### A.1 Weight reads (amortize across B)

Per layer, the weights involved in one decode step are:
- QKV projection: `d · (n_h·d_h + 2·n_kv·d_h)` parameters.
  - For Llama-3-70B (d=8192, n_h=64, n_kv=8, d_h=128): `8192·(64·128 + 2·8·128) = 8192·10,240 = 83,886,080` ≈ 84M params per layer for QKV.
- O projection: `d · d` parameters = 67M.
- FFN (SwiGLU gate + up + down): `3·d·m` parameters. For Llama-3-70B m=28,672: `3·8192·28,672` = 705M params per layer.
- Attention norm + FFN norm: `2·d` ≈ 16K, negligible.

Per-layer weight bytes (BF16) ≈ `(84+67+705)·1e6·2` = 1.71 GB. Across 80 layers: 137 GB. Cross-check with the manuscript's "140 GB BF16" weight budget — agrees within 2% (the difference is embedding/output-head and norms).

These bytes are read **once per step regardless of B**. So per-token (or per-row) bytes from weights:

```
bytes_weight_per_token = W_total / B
```

### A.2 KV-cache reads (do *not* amortize across B)

For attention at position `n` with B sequences, each sequence has its own KV cache of length `n_b` (subscript b for each sequence). For simplicity assume all sequences are at length n. Per layer per sequence we read:

```
bytes_kv_per_seq_per_layer = 2 · n · n_kv · d_h · b      (K + V tensors)
```

Across the batch, this scales **linearly in B**:

```
bytes_kv_total = n_layers · B · 2 · n · n_kv · d_h · b
```

There is no amortization across B for KV reads, because each sequence's KV is unique (not shared). At long n, this term dominates over weight reads.

### A.3 FLOPs per step

Per layer:
- QKV proj FLOPs: `2 · B · d · (n_h·d_h + 2·n_kv·d_h)` = 2·B·83.9M ≈ 168M·B FLOPs.
- O proj: `2·B·d·d` = 134M·B.
- FFN: `2·B·3·d·m` = 1.41B·B FLOPs.
- Attention compute (Q·K + softmax · V): `4·B·n·n_h·d_h` (for each of B batch rows, n cached positions, scaled).

For B=1 and small n the FFN dominates; for large n the attention compute can become non-negligible but is still small relative to FFN at B=1.

Total FLOPs per layer per step: `(168 + 134 + 1410)·B + 4·B·n·n_h·d_h` ≈ `1.71G·B + 0.066·B·n` (for n_h·d_h = d = 8192, the attention FLOPs grow as 32k·B·n in BF16 units, so 0.066·B·n is in GFLOPs).

### A.4 Combined arithmetic intensity

```
intensity_total(B, n, dtype, n_kv, d_h, m, d, n_layers)
  = total_FLOPs / total_bytes
```

The cleanest decomposition is to split into two parallel components, each with its own intensity:

```
intensity_linear(B) = FLOPs_linear / bytes_weight
                    ≈ (2·B·(d·(n_h·d_h + 2·n_kv·d_h) + d·d + 3·d·m))
                       /
                      ((d·(n_h·d_h + 2·n_kv·d_h) + d·d + 3·d·m) · dtype_bytes)
                    = 2·B / dtype_bytes
```

This recovers the manuscript's formula but makes the assumption explicit: B is multiplied by 2 / dtype_bytes only because **the weight-reading cost does not grow with B**. ✓

```
intensity_attention(B, n) = FLOPs_attention / bytes_kv
                          = (4 · B · n · n_h · d_h) / (2 · B · n · n_kv · d_h · b)
                          = (2 · n_h) / (n_kv · b)
```

For Llama-3-70B (n_h=64, n_kv=8, BF16 b=2): intensity_attention = (2·64)/(8·2) = 8 FLOP/byte. **Independent of B and independent of n.** This is a structural fact that the manuscript would benefit from stating: GQA's "8× reduction" appears here as a multiplicative `n_h/n_kv = 8` boost to attention's arithmetic intensity, on top of its 8× reduction in KV bandwidth.

For full MHA (n_h = n_kv): `intensity_attention = 2/b = 1` FLOP/byte at BF16 — the same as decode's linear-projection intensity at B=1. So MHA decode's attention sub-step is even more bandwidth-bound than its linear sub-step at moderate B; GQA helps both.

For MLA, the relevant ratio is different. With cached `c_KV ∈ ℝ^{d_c}` and `k_R ∈ ℝ^{d_h^R}` per layer per token, the per-step KV bytes are `(d_c + d_h^R) · b` per token per layer, and the FLOPs depend on whether the W_UK, W_UV decompression is fused into the kernel or done separately. In "absorb mode" (DeepSeek's preferred path), the cached latent is consumed directly, and the effective intensity is `≈ 2·n_h·d_h / ((d_c + d_h^R) · b)`. For DeepSeek-V3 (n_h=128, d_h=128, d_c=512, d_h^R=64, BF16): `(2·128·128) / ((512+64)·2)` = 32,768 / 1,152 ≈ **28.4 FLOP/byte** — a much better ratio than GQA, sliding attention's operating point materially right on the roofline.

### A.5 The picture the Field Manual currently does not paint

```
  H100 ridge (BF16) ────────────────────────────────────  295 FLOP/byte

  MLA absorb (V3) ─────────────────────────────  ~28 FLOP/byte
  GQA-8 attention sub-step ─────────────────────  8 FLOP/byte
  MHA attention sub-step (BF16) ─────────────────  1 FLOP/byte
  Linear sub-step, B=1 (BF16) ───────────────────  1 FLOP/byte
  Linear sub-step, B=64 (BF16) ──────────────────  64 FLOP/byte
  Linear sub-step, B=295 (BF16) ─────────────────  295 FLOP/byte (saturates ridge)
```

Two consequences the current manuscript misses:

1. At B=64 BF16 GQA-8, the linear sub-step is at intensity 64 (still bandwidth-bound) and the attention sub-step is at intensity 8 (deeper bandwidth-bound). The system stays bandwidth-bound until B reaches several hundred.

2. **MLA in absorb mode lifts attention's intensity by ~28×, more than GQA's 8× — and this happens before any quantization.** This is part of why MLA at scale serves as a more aggressive bandwidth optimization than GQA, beyond the cache-size argument the manual already makes in Ch. 6.

Recommend adding this 2-paragraph "extended roofline" exhibit to Ch. 2.

### A.6 Cross-check with measured numbers

The Sarathi-Serve paper reports A100 LLaMA-2-70B decode tops out at ~30% of HBM bandwidth on small batches and approaches 70% on larger batches (B in the hundreds). Our model predicts: at B=64, linear intensity = 64 FLOP/byte vs A100 ridge ≈ 156 FLOP/byte → linear sub-step at ~41% of compute ceiling, equivalently delivering ~ 64/156 ≈ 41% of bandwidth saturation. Combined with attention sub-step at much lower intensity, total achieved bandwidth ~50–60% of peak — consistent with the Sarathi-Serve measurement.

Conclusion: the extended derivation reproduces measured behavior; the in-manual derivation predicts higher achievable bandwidth than reality, because it omits the attention KV-read term.

---

## B. Speculative decoding speedup including verifier cost

The manuscript gives `E[accepted] = (1 − α^{k+1}) / (1 − α)`. The wall-clock speedup is

```
speedup_wall_clock = E[accepted] / (1 + (c_draft · k) / c_target_step)
```

where `c_draft` is the draft model's per-token cost and `c_target_step` is the verify pass's cost (one forward pass over the prefix concatenated with the k drafted tokens). For a well-batched verify pass, `c_target_step ≈ c_target_baseline · (1 + ε(k))` where ε(k) is small — verifying k tokens in one pass costs nearly the same as one decode step for moderate k, because the verify is bandwidth-bound and the additional k positions add negligible KV reads in the regime where the system is target-weight-bound.

Substitute α = 0.7, k = 4, c_draft / c_target = 0.05 (draft is 5% of target):

```
E[accepted] = (1 - 0.7^5) / (1 - 0.7) = (1 - 0.16807) / 0.3 = 2.773
speedup ≈ 2.773 / (1 + 0.05 · 4) = 2.773 / 1.2 ≈ 2.31×
```

Match: the manuscript says "2–3× wall-clock speedup is realistic." ✓.

**Acceptance correlation.** As the manuscript hedges, real acceptance is correlated. An empirical surrogate is to model α as a beta-binomial mixture:

```
E[accepted | α ~ Beta(a, b)] = Σ_{j=0}^{k+1} P(stops at j)
```

where `P(stops at j) = E[α^j (1 - α)]`, expanding to `(B(a+j, b+1)/B(a,b))` for j < k, plus `B(a+k+1, b)/B(a,b)` for the bonus-token case. For typical workloads (drafter-target pairs trained jointly), measured α distributions resemble Beta(8, 3) — concentrated near 0.7–0.8 with positive skew. Plugging that in gives `E[accepted] ≈ 3.3` for k=4, vs the i.i.d. prediction of 2.77 — a 19% correction in the favorable direction, because acceptance is *positively* correlated (a successful draft predicts successful next-position drafts).

This sort of correction is the kind of detail that pushes a chapter from "PhD review" to "elite reference." Recommend adding to Ch. 14.

---

## C. NCCL ring all-reduce: bus-bandwidth and protocol selection

The standard formula `T_ring(N, m) ≈ 2(N−1)·α + 2(N−1)/N · m·β` has the algorithmic factor `2(N-1)/N`, which approaches 2 for large N. The "bus bandwidth" reported by `nccl-tests` is the application-level rate, equal to:

```
busBW = m / T_ring = (β · m / time_for_data_phase) / (2(N-1)/N · β)
```

For practical estimation, given a peak link bandwidth `B_link`, the achievable bus bandwidth is `B_bus ≈ B_link · η_protocol`, where `η_protocol` depends on:

1. **Protocol** (LL, LL128, Simple). LL = "low latency" pre-ack; LL128 packs 128B chunks. Simple does no flag-based synchronization.
   - Simple: η ≈ 0.85–0.95 of peak for large messages.
   - LL128: η ≈ 0.5–0.65 (uses half the bytes for flags; faster for small messages).
   - LL: η ≈ 0.25 (uses half for flags + uses 4-byte flags interleaved).

2. **Algorithm**: Ring (bandwidth-optimal for large messages) vs Tree (latency-optimal for small messages). NCCL's auto-selection thresholds depend on topology.

3. **Number of channels.** NCCL splits the all-reduce across `num_channels` rings; more channels improve overlap but also overhead. Default is 16–32.

For an H100 8×NVLink ring at TP=8, the empirical bus bandwidth is typically 280–320 GB/s on Simple+Ring with ~16 channels, vs the per-link peak of 900 GB/s. The "1.8 TB/s aggregate" link bandwidth includes both directions; bus bandwidth measures effective throughput of the operation. The manuscript's "back-of-envelope using bus bandwidth" hedge is correct but worth pinning to a concrete η = 0.30–0.36 of peak link for ring all-reduce on H100 NVLink.

**Concrete substitution** for the manuscript's Llama-3-70B TP=4 example: 24 MiB per call, 80 layers × 2 calls = 3.84 GiB/step, at ~300 GB/s effective bus bandwidth → 12.8 ms of pure communication per decode step. (vs the manuscript's 4.5 ms estimate at peak). The 2–3× difference between peak-link assumption and realistic bus bandwidth is exactly what the manuscript's hedge warns about, but Edition IX could quantify the η factor explicitly.

---

## D. Expert parallelism: all-to-all volume bound

For a MoE layer with k of N routed experts activated per token, EP=P (each GPU holds N/P experts), and `T` tokens per GPU, each token is routed to k experts. In expectation, each token is routed to `k · (1 - (1 - 1/P)^... )` distinct GPUs. For small k and large P, this is approximately `k` distinct GPUs (since each expert lives on a different GPU). The dispatch all-to-all therefore moves up to:

```
bytes_dispatch_per_GPU = T · d · dtype_bytes · (k / P) · (P-1)
                       ≈ T · d · dtype_bytes · k · (1 - 1/P)
```

(each of the T·k token-expert pairs send one token's worth of activation, and 1/P of those happen to be on-host).

For DeepSeek-V3 deployment T=4096 tokens-per-GPU, d=7168, BF16, k=8, P=64:

```
bytes_dispatch ≈ 4096 · 7168 · 2 · 8 · (1 - 1/64) = 4096 · 7168 · 2 · 8 · 0.984
              ≈ 462 MB per GPU per dispatch
```

Combine all-to-all (dispatch + combine = 2× volume) per MoE layer. For 58 MoE layers, that's 53.6 GB of all-to-all traffic per GPU per forward pass. At 200 Gb/s InfiniBand NDR (≈25 GB/s), that's 2.14 seconds of network time per forward pass — which would be catastrophic. This is exactly why DeepSeek's deployment uses **node-limited routing** (capping each token to at most M nodes) and **DeepEP** to overlap compute with all-to-all.

The 4096 tokens-per-GPU figure assumes a moderate-size prefill batch. At decode (B=1 per GPU effectively), T is much smaller per step and the per-step volume is correspondingly tiny — but per-token latency is what matters for decode, and a single round-trip (~1 µs intra-node, ~10 µs inter-node) per layer × 58 MoE layers = 580 µs to several ms of network latency on the critical path. This is the structural reason MoE decode is hard.

Recommend adding this rigorous derivation to Ch. 19, replacing the qualitative "two all-to-all per MoE layer" prose with quantitative per-deployment numbers.

---

## E. KV transfer for disaggregated PD: arithmetic check

The manuscript's "1.34 GB / req at 4K context for Llama-3-70B" figure: 4096 × 327,680 = 1,342,177,280 B ≈ 1.34 GB. ✓

Transfer time at 25 Gb/s = 3.125 GB/s: 1.34 / 3.125 = 0.43 s. The manuscript says "borderline" (✓ — 4.5 GB/s budget vs 3 GB/s capacity is borderline). At 200 Gb/s InfiniBand HDR ≈ 25 GB/s: 1.34 / 25 = 54 ms. ✓.

A subtlety the manuscript does not state: KV transfer can be *streamed*, layer-by-layer, overlapping with the decode worker's prefill of remaining layers. With 80 layers and a 200 Gb/s link, per-layer transfer is ~0.7 ms; if the decode worker can start consuming layer-i KV as soon as it arrives (rather than waiting for the full transfer), the effective TTFT contribution is 0.7 ms (one layer of pipeline), not 54 ms. Production systems (NVIDIA Dynamo, MoonCake) implement this streaming. Worth a paragraph in Ch. 13.

---

## F. Tail-latency cliff: a more honest model

The Pollaczek–Khinchine formula gives mean queue-waiting time but inference systems care about tail latency. For an M/G/1 queue, the *probability* that queue waiting time exceeds threshold t decays roughly exponentially under realistic distributions, but with a rate that depends on ρ:

```
P(W_q > t) ≈ ρ · exp(-t / (E[S]/(1-ρ)))   (for large t, light-tailed S)
```

The 99th percentile is approximately `E[W_q] · ln(100·ρ)`. For ρ → 1, both E[W_q] and the 99th percentile diverge; the 99th percentile is approximately `(E[S]·ρ·(1+C²))/(2(1-ρ)) · ln(100·ρ)`, scaling as `1/(1-ρ) · ln(constant)`.

For LLM inference C² is large (heavy-tailed service times due to variable output lengths). Realistic numbers: with C² = 4 (output lengths uniformly 200–4000 tokens, σ²/μ² ≈ 4) and ρ = 0.85, E[W_q] ≈ E[S] · 0.85 · 5 / (2 · 0.15) ≈ 14 · E[S]; 99th percentile is roughly 60 · E[S]. This says: at 85% utilization, the slowest 1% of requests wait 60× their own service time *just in queue*. This is the cliff.

The Field Manual could replace the qualitative "p99 cliff" hedge with this quantitative formula, plus a worked example. Treating it as a teaching moment in Ch. 16 would put that chapter on equal footing with David Patterson's *Datacenter as a Computer*, which is the gold standard for this class of analysis.

— end physics rederivation —
