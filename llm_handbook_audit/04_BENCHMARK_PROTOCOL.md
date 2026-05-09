# 04 — A Reproducible Benchmark Protocol

Edition VIII's Ch. 22 ("Benchmarking inference: what to measure") gives the right *checklist* but does not give the *protocol* — i.e., a runnable recipe that produces apples-to-apples comparison across vLLM, SGLang, TRT-LLM, TGI in a fixed time budget. This file specifies that protocol, with prompt schema, arrival schedule, metric definitions, and tool wiring concrete enough to copy-paste.

The protocol is designed to (a) be runnable on a single 8×H100 node in roughly half a day per engine, (b) produce enough datapoints that the tail-latency cliff is observable, (c) use only public software so that results are reproducible by any third party, and (d) report results in the form (TTFT-p99, TPOT-p99, goodput-at-SLO, prompt-length-bucketed) that the manual itself prescribes.

---

## 1. Test fixture

**Hardware:** 1×8×H100 SXM5, NVSwitch, 80GB HBM3 per GPU, 900 GB/s NVLink 4. Run on one host to eliminate inter-node confounders.

**Model:** Llama-3-70B-Instruct in BF16 (base) and FP8 (quantized via `llmcompressor` with W8A8 calibration on the C4 calibration set, 512 examples). Pin the same model checkpoint hash across all four engines.

**Software pinning:**
- vLLM 0.10.x (specific tag)
- SGLang 0.4.x
- TensorRT-LLM 0.16+, with engine compiled for `--max_input_len 8192 --max_output_len 4096 --max_batch_size 256`
- TGI 2.4+
- All on the same Python venv where applicable; CUDA 12.6, cuDNN 9.5, NCCL 2.23.

**Tokenizer:** `meta-llama/Meta-Llama-3-70B-Instruct` HF tokenizer (fast). Pinned tokenizer hash.

---

## 2. Prompt distribution

A 10,000-prompt corpus, partitioned:

| Bucket | Count | Source | Length |
|--------|-------|--------|--------|
| Short chat (single-turn) | 4,000 | ShareGPT filtered to ≤512 input tokens | 32–512 input |
| Long chat (multi-turn) | 3,000 | ShareGPT multi-turn, full conversation history concatenated | 512–4,096 input |
| Long-context document | 2,000 | LongBench (single-document QA) | 4,096–32,768 input |
| Code | 1,000 | HumanEval+ and MBPP+ | 32–1,024 input |

Stratified-sample 10K prompts; **fix the random seed** (e.g., `seed=20260509`); **publish the resulting JSONL** so the corpus is byte-identical across runs. Schema:

```jsonl
{"id": "p0001", "bucket": "short-chat", "input_tokens": 234, "expected_output_tokens": 187, "prompt": "..."}
{"id": "p0002", "bucket": "long-context", "input_tokens": 18342, "expected_output_tokens": 423, "prompt": "..."}
```

**`expected_output_tokens`** is set per the source (ShareGPT's actual completion length, or LongBench's gold answer length). At benchmark time, the engine is asked for `max_tokens = 1.5 × expected_output_tokens` to allow for natural variation; the *actual* generated output length is recorded and used for downstream analysis.

---

## 3. Arrival schedule

**Two regimes**, both run for each engine:

- **Closed-loop**: `concurrency = K` with K ∈ {1, 2, 4, 8, 16, 32, 64, 128, 256}. K parallel client threads, each thread pulls a prompt from the corpus, sends it, waits for completion, repeats. Run for `min(5 minutes, 1000 requests)` per K.

- **Open-loop**: Poisson arrivals with mean rate λ ∈ {1, 2, 4, 8, 16, 32, 64} req/s. Each request samples a prompt independently. Run for 10 minutes per λ. Open-loop is the regime in which the cliff appears.

Both regimes are run once with `temperature=0` (deterministic, for reproducibility checks) and once with `temperature=0.7, top_p=0.9` (production-realistic).

---

## 4. Metric definitions (mathematically precise)

Let request *i* enter the system at time `t^enter_i`, see its first emitted token at `t^first_i`, and emit token *j* at `t^j_i` with the last token at `t^end_i`. Let `n^out_i` be the number of output tokens.

- **TTFT_i** := `t^first_i − t^enter_i`. Time-to-first-token, including queue + prefill + first-decode.
- **TPOT_i** := `(t^end_i − t^first_i) / max(1, n^out_i − 1)`. Average inter-token latency. (Note the `n^out_i − 1` denominator: the first token is timed by TTFT, so TPOT is averaged over the *remaining* tokens.)
- **E2E_i** := `t^end_i − t^enter_i`.
- **Throughput** (output) := `Σ_i n^out_i / wall_clock_duration`. Per replica or per-cluster.
- **Goodput-at-SLO(s_TTFT, s_TPOT)** := `Σ_i n^out_i · 1[TTFT_i ≤ s_TTFT and TPOT_i ≤ s_TPOT]` / wall-clock-duration. Per replica.

We use SLOs `(s_TTFT = 500 ms, s_TPOT = 50 ms)` for chat workloads and `(2000 ms, 100 ms)` for long-context.

**All percentiles reported with bootstrap 95% CIs** (10K resamples) so the reader can see whether differences are statistically significant.

---

## 5. Output schema

A single JSONL emitted per benchmark run, one row per request:

```jsonl
{"engine": "vllm-0.10.1", "regime": "open-loop", "lambda": 16,
 "request_id": "p3128", "bucket": "long-chat", "input_tokens": 1342,
 "output_tokens": 287, "ttft_ms": 482.3, "tpot_ms": 28.7,
 "e2e_ms": 8716.2, "preempted": false, "cached_prefix_tokens": 1280,
 "engine_step_count": 287, "completed": true, "error": null}
```

Plus a per-run summary:

```json
{"engine": "vllm-0.10.1", "regime": "open-loop", "lambda": 16,
 "duration_s": 600, "requests_started": 9621, "requests_completed": 9598,
 "ttft_p50_ms": 342, "ttft_p99_ms": 1180,
 "tpot_p50_ms": 22, "tpot_p99_ms": 67,
 "throughput_out_tok_per_s": 4234.1,
 "goodput_at_slo_500_50": 3198.4,
 "preemption_rate": 0.012,
 "prefix_cache_hit_rate": 0.871}
```

---

## 6. Knob disclosure

For *each* engine, the benchmark report must include the full configuration:

- Engine version + git SHA
- Model checkpoint hash
- Tokenizer hash
- `max_num_seqs`, `max_num_batched_tokens`, `block_size`, KV pool size
- Quantization (BF16, FP8, etc.) including calibration set
- `enable_prefix_caching`, `enable_chunked_prefill`, `long_prefill_token_threshold`
- Scheduling policy (FCFS / priority)
- Speculative decoding config (drafter, k, tree shape) if any
- CUDA Graph capture sizes
- NCCL config (`NCCL_PROTO`, `NCCL_ALGO`, `NCCL_NCHANNELS`)

---

## 7. Reference harness sketch

```python
# benchmark/harness.py — minimal protocol-faithful client.
# Open-loop client: Poisson-arrivals from one process per lambda value.
# Each request hits the OpenAI-compatible /v1/chat/completions endpoint
# with stream=true; per-token timestamps captured via SSE event time.

import asyncio, json, time, random
from openai import AsyncOpenAI

async def issue_request(client, prompt, max_tokens, params):
    t_enter = time.perf_counter()
    first_tok_time = None
    last_tok_time = None
    n_out = 0
    async for event in client.chat.completions.create(
        model=params["model"], stream=True,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=params["temperature"], top_p=params["top_p"],
    ):
        now = time.perf_counter()
        if first_tok_time is None and event.choices[0].delta.content:
            first_tok_time = now
        if event.choices[0].delta.content:
            last_tok_time = now
            n_out += 1
    return {
        "ttft_ms": (first_tok_time - t_enter) * 1000,
        "tpot_ms": ((last_tok_time - first_tok_time) / max(1, n_out-1)) * 1000,
        "e2e_ms": (last_tok_time - t_enter) * 1000,
        "n_out": n_out,
    }

async def open_loop_client(corpus, lam_per_s, duration_s, params):
    client = AsyncOpenAI(base_url=params["url"], api_key="x")
    inflight = []
    end_at = time.perf_counter() + duration_s
    while time.perf_counter() < end_at:
        await asyncio.sleep(random.expovariate(lam_per_s))
        prompt = random.choice(corpus)
        max_tokens = int(prompt["expected_output_tokens"] * 1.5)
        inflight.append(asyncio.create_task(
            issue_request(client, prompt["prompt"], max_tokens, params)))
    results = await asyncio.gather(*inflight)
    return results
```

(Full harness with metric aggregation, prefix-cache-hit instrumentation, and percentile bootstrap is a 300-line script — left as an Edition IX appendix.)

---

## 8. Reporting template

Every benchmark figure in Edition IX should adhere to this template:

```
Engine: vLLM 0.10.1
Hardware: 8×H100 SXM5, NVSwitch
Model: Llama-3-70B-Instruct, FP8 W8A8
Configuration: TP=2, DP=4, max_num_batched_tokens=8192,
               enable_prefix_caching=true, enable_chunked_prefill=true
Workload: Open-loop, λ=16 req/s, 10-minute run, 9,621 requests.
Tokenizer: meta-llama/Meta-Llama-3-70B-Instruct, fast (HF tokenizers 0.20.x)

Results (95% bootstrap CI in brackets):
  TTFT p50:  342 ms   [338, 347]
  TTFT p99: 1,180 ms  [1,140, 1,231]
  TPOT p50:   22 ms   [21.8, 22.3]
  TPOT p99:   67 ms   [64, 72]
  Throughput: 4,234 tok/s [4,207, 4,261]
  Goodput @ (500ms, 50ms): 3,198 tok/s
  Preemption rate: 1.2%
  Prefix-cache hit rate: 87.1%

Per-bucket TTFT p99:
  short-chat:   320 ms
  long-chat:    870 ms
  long-context: 2,148 ms
  code:         286 ms
```

This is the unit of evidence Edition IX should produce for every engine claim.

---

## 9. Statistical-rigor checklist

- [x] Bootstrap 95% CIs on every percentile.
- [x] Power analysis: at least 10K requests per regime to detect 5% TTFT differences with α=0.05.
- [x] Run each (engine, regime) cell 3× and report median + range.
- [x] Discard the first 60s of each run as warmup.
- [x] Stratified sampling at the prompt-bucket level; report per-bucket separately.
- [x] Pre-register the SLOs and the engines tested; do not adjust the SLOs after seeing results.

---

## 10. What this protocol enables

A reader running this protocol on a fresh 8×H100 node can produce, in one calendar day, a comparison table that *no published vendor benchmark currently produces*. The Field Manual's contribution by including this protocol verbatim is to make every claim in Ch. 22, Ch. 28, and Ch. 35 *checkable*. That is the property that distinguishes a canonical reference from a synthesis.

— end benchmark protocol —
