# 07 — Style, Pedagogy, and Editorial Recommendations

The Field Manual's voice is one of its strongest assets. The recommendations here are not stylistic rewrites; they are surgical interventions that preserve the existing voice while strengthening the manual's pedagogical grip.

## 1. Make every numerical claim runnable

Every numerical claim in the manual is checkable in principle, but the reader has to do the arithmetic. Edition IX should ship a small Python module (`fieldmanual/derive.py`) that computes every number cited in the manual from first principles. For example:

```python
from fieldmanual import derive

# Reproduces the Ch. 5 worked example.
print(derive.kv_per_token(
    n_layers=80, n_kv_heads=8, head_dim=128, dtype_bytes=2))
# 327680  (bytes/token)

print(derive.kv_per_request(per_token_bytes=327680, context=4096) / 1e9)
# 1.34   (GB)

# Reproduces the Ch. 2 ridge calculation.
print(derive.roofline_ridge(
    peak_compute_tflops=989, peak_bandwidth_tbs=3.35))
# 295.2  (FLOP/byte)
```

This makes the manual *self-checking*, ensures cross-edition consistency, and lets a reader plug in their own numbers (e.g., a custom GPU spec) and see the implications immediately. No published reference on this topic does this. It would be a unique contribution.

## 2. Anchor every claim to a verifiable artifact

Wherever the manual cites a vLLM or SGLang internal class or file path, the citation should include a *commit SHA* and a *line range*. Example:

> "The scheduler's batch composition logic is implemented at [vllm@42172ad/vllm/v1/core/sched/scheduler.py:L412–L478](https://github.com/vllm-project/vllm/blob/42172ad/vllm/v1/core/sched/scheduler.py#L412-L478)."

This converts an unstable reference (a class name in a moving codebase) into a stable, durable artifact. The Field Manual already cites commit `42172ad`; extending this to file/line pinpoints would be a small effort with a large reliability dividend.

## 3. Quantify every hedge

The manual's hedge callouts are a strength, but several are qualitative where they could be quantitative. For example, in Ch. 8:

> "The 4.5 ms estimate above is a back-of-envelope using bus bandwidth; real numbers will differ by 2× either direction depending on configuration."

The "2× either direction" is the right shape but could be replaced with a concrete table:

| Configuration | NCCL bus BW | Step comm time |
|---|---|---|
| TP=4, NVLink, Simple+Ring, 16 channels | ~310 GB/s | 12.7 ms |
| TP=4, NVLink, Tree, 8 channels | ~190 GB/s (large messages) | 20.7 ms |
| TP=8 across 2 nodes via IB NDR | ~38 GB/s | 100+ ms |
| TP=4, Hopper-NVLink-bus, LL128 | ~210 GB/s | 18.7 ms |

Each cell becomes verifiable; the "either direction" hedge becomes specific.

## 4. Standardize unit notation

The manuscript currently mixes GB (decimal, 10⁹) and GiB (binary, 2³⁰) inconsistently. Most numbers are decimal-derived (e.g., 1.34 GB = 4096 × 327,680 bytes), but a few labels are GiB (and the [Jarvis] reference uses GiB labels for decimal-derived numbers, as the manuscript's footnote correctly notes). Edition IX should use SI units (GB) consistently, and explicitly call out the few places GiB is the right unit (e.g., HBM capacity, where vendors use GB but mean 1024³).

## 5. Display equations should be numbered

Equations like the roofline ridge formula, the bubble fraction, the speculative-decoding speedup, the Pollaczek–Khinchine formula, the KV-per-token formula are all referenced multiple times. Edition IX should number them and reference by number, e.g., "from (2.3) and (5.1) we get…". This is the standard textbook discipline; the manual is already operating at textbook density.

## 6. Add a "common derivations" appendix

Appendix C: a single page with every formula derived in the manual, in a uniform notation, suitable for copying into a notebook. Currently a reader has to flip across chapters to assemble (e.g.) "the cost of a TP=4 H100 step." Pre-computing the answer for every common deployment would save substantial reader time.

## 7. The diagrams are good; the per-chapter "key takeaways" are uneven

Some chapters end with a "Key Takeaways" callout and some don't. Edition IX should add this to every chapter, in the same uniform format, so the manual can be skimmed for review.

## 8. Pedagogical flow improvement: pull MLA forward

The current chapter ordering treats MLA in Ch. 6, but its impact on the roofline is invoked in Ch. 2. A short forward-reference in Ch. 2 ("see Ch. 6 for how MLA changes this picture") would help, and the extended roofline derivation in `02_PHYSICS_REDERIVED.md` makes this connection explicit.

## 9. Voice consistency: the case study uses "you" tense; keep it everywhere

Ch. 35 addresses the reader as "you" ("You operate a customer-facing chat product…"). This works very well. Some other production-anatomy chapters use third person ("a deployment that…"). Standardizing on "you" wherever the reader is being asked to make a decision would make the manual feel more like a senior engineer talking to the reader.

## 10. Add a one-page index of "operational rules"

The manual scatters short imperative rules ("Never make a capacity-planning decision based on nvidia-smi alone"). These are the highest-value bits of the manual for an on-call engineer. Edition IX should collect them into a one-page index — title it "Field Operational Rules" — at the back. A reader who carries the manual into an incident bridge will reference this page first.

## 11. Cite Tri Dao's name spelling consistently

The manuscript spells the FA author "Dao, Fu, Ermon, Rudra, Ré" in Ch. 4 and just "Dao" elsewhere. Tri Dao is the lead author throughout the FA series. Edition IX should pin the spelling and use the same author-list across mentions of the same paper.

## 12. The "thesis manifesto" should be quoted directly into the marketing copy

The thesis section (pp. 9–10) is the strongest single passage in the manual. Edition IX's promotional materials, the back cover, and the foreword (if there is one for Edition IX) should quote the thesis verbatim. It is the kind of writing that earns the manual a spot in syllabi.

## 13. Footnote density

Edition VIII uses bracketed citations `[Tag]` inline. This is fine for primary-source attribution. For *secondary commentary* (e.g., the parenthetical "the term 'MUFU' appears in PTX, while 'SFU' appears in architectural documentation"), Edition IX should consider footnotes proper, freeing the inline prose. The manual is dense enough that this is a real readability lever.

## 14. The author "we"

The manuscript uses "we" ambiguously: sometimes "we (the authors)" and sometimes "we (the practitioner reader)." Pin the convention. The clearest pattern (used by *Designing Data-Intensive Applications* and *Database Internals*) is to reserve "we" for the authors only and use "you" for the reader.

## 15. License clarity for the runnable artifacts

If Edition IX ships the `derive.py` module and the `benchmark/harness.py` from `04_BENCHMARK_PROTOCOL.md`, they should be Apache-2 or MIT licensed and hosted in a separate repository linked from the colophon. The current copyright notice is appropriately strict for the prose; the runnable artifacts deserve a permissive license to maximize their dissemination as supporting infrastructure for the manual itself.

— end style and pedagogy —
