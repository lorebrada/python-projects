# 05 — Reference List, Corrected and Expanded

This file revises the manuscript's 47-entry bibliography for arXiv-id precision, correct venue/year, and full author lists. Where the manuscript cites a secondary source (blog post or summary article) and a primary source exists, we surface the primary. We also add ten missing references that Edition IX should cite to complete its claims. Each entry is annotated with an *audit note* describing what changed.

Symbols: ✓ verified primary; ✱ corrected from manuscript; ⊕ new addition.

---

## 1. Hardware datasheets and microarchitecture

**[H100] ✓ NVIDIA. *NVIDIA H100 Tensor Core GPU Datasheet*. 2022 (rev. 2024).** Cited specs (dense, no sparsity): 989.4 TFLOPS BF16/FP16 tensor-core compute, 1,978.9 TFLOPS FP8, 3.35 TB/s HBM3 bandwidth, 900 GB/s NVLink-4 per-direction. The 1,979 / 3,958 TFLOPS marketing figures include 2:1 structured sparsity. — *No change; verified.*

**[H100-arch] ⊕ Choquette, J. et al. *NVIDIA Hopper H100 GPU: Scaling Performance.* IEEE Micro Vol. 43 No. 3, May–June 2023, pp. 9–17. DOI: 10.1109/MM.2023.3256796.** — *Add: this is the canonical primary source for Hopper architecture; the Field Manual currently cites only the datasheet.*

**[B200] ✓ NVIDIA. *NVIDIA Blackwell Architecture Whitepaper.* 2024.** Cited specs: 192 GB HBM3e, 8 TB/s memory bandwidth, 1.8 TB/s NVLink-5 per-direction, 9 PFLOPS FP4 dense, 4.5 PFLOPS FP8 dense, 2.25 PFLOPS BF16/FP16 dense. 208 billion transistors, dual-die TSMC 4NP. — *No change; verified.*

**[Vast] ✱ Vast.ai. *NVIDIA H200 vs B200: Comparing Datacenter-Grade Accelerators.* August 2025.** — *Cite as secondary; Edition IX should also cite the H200 datasheet directly: NVIDIA, *NVIDIA H200 Tensor Core GPU Datasheet*, 2023, rev. 2024.*

**[Cudo] ✱ Cudo Compute. *NVIDIA's Blackwell Architecture: Breaking Down the B100, B200, and GB200.* January 2026.** — *Secondary; replace with NVIDIA Blackwell Whitepaper for primary numbers.*

**[Clarifai] ✱ Clarifai blog. *NVIDIA B200 GPU Guide.* January 2026.** — *Secondary; the roadmap items (B300, Rubin) should be cited via NVIDIA GTC keynote transcripts when stable URLs exist; otherwise as company communication, not a primary technical source.*

---

## 2. Attention and kernel papers

**[FA-2] ⊕ Dao, T. *FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning.* ICLR 2024 (arXiv:2307.08691).** — *Add: Edition VIII cites FA-2's existence but not the canonical reference.*

**[FA3] ✓ Shah, J., Bikshandi, G., Zhang, Y., Thakkar, V., Ramani, P., Dao, T. *FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision.* NeurIPS 2024 (arXiv:2407.08608).** — *No change; verified. The handbook correctly notes camera-ready vs early-blog discrepancy.*

**[FA-Decoding] ⊕ Dao, T. *Flash-Decoding for long-context inference.* FlashAttention repository / blog post, October 2023.** — *Add (see `03_MISSING_TOPICS.md` M-3).*

**[FlashInfer] ✓ Ye, Z. et al. *FlashInfer: Efficient and Customizable Attention Engine for LLM Inference Serving.* MLSys 2025 (arXiv:2501.01005).** — *Verified.*

**[FlashInfer-NV] ✓ NVIDIA Developer Blog. *Run High-Performance LLM Inference Kernels from NVIDIA Using FlashInfer.* June 13, 2025.** — *Verified.*

**[FA-vAttention] ✱ Prabhu, R., Nayak, A., Mohan, J., Ramjee, R., Panwar, A. *vAttention: Dynamic Memory Management for Serving LLMs without PagedAttention.* ASPLOS '25 (arXiv:2405.04437).** — *Add arXiv id (manuscript cites venue only).*

**[Attention] ⊕ Vaswani, A. et al. *Attention Is All You Need.* NeurIPS 2017 (arXiv:1706.03762).** — *Add: the manuscript's "Further Reading" appendix mentions this informally but it is not in the main reference list.*

**[Roofline] ⊕ Williams, S., Waterman, A., Patterson, D. *Roofline: An Insightful Visual Performance Model for Multicore Architectures.* CACM Vol. 52 No. 4, April 2009, pp. 65–76.** — *Add: load-bearing for Ch. 2; currently mentioned by name only.*

---

## 3. Memory management and serving systems

**[vLLM] ✓ Kwon, W., Li, Z., Zhuang, S. et al. *Efficient Memory Management for Large Language Model Serving with PagedAttention.* SOSP 2023 (arXiv:2309.06180).** — *Verified.*

**[Orca] ⊕ Yu, G.-I., Jeong, J. S., Kim, G.-W., Kim, S., Chun, B.-G. *Orca: A Distributed Serving System for Transformer-Based Generative Models.* OSDI 2022.** — *Add: the canonical iteration-level scheduling paper.*

**[SGLang] ✓ Zheng, L. et al. *SGLang: Efficient Execution of Structured Language Model Programs.* NeurIPS 2024 (arXiv:2312.07104).** — *Verified.*

**[Sarathi] ✓ Agrawal, A., Panwar, A., Mohan, J., Kwatra, N., Gulavani, B., Tumanov, A. *SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills.* arXiv:2308.16369. 2023.** — *Verified.*

**[Sarathi-Serve] ✓ Agrawal, A., Kedia, N., Panwar, A., Mohan, J., Kwatra, N., Gulavani, B., Tumanov, A., Ramjee, R. *Taming Throughput-Latency Tradeoff in LLM Inference with Sarathi-Serve.* OSDI '24 (arXiv:2403.02310).** — *Verified.*

**[DistServe] ✓ Zhong, Y., Liu, S., Chen, J. et al. *DistServe: Disaggregating Prefill and Decoding for Goodput-optimized Large Language Model Serving.* OSDI '24 (arXiv:2401.09670).** — *Verified.*

---

## 4. Quantization

**[AWQ] ⊕ Lin, J. et al. *AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration.* MLSys 2024 (arXiv:2306.00978).** — *Add full citation (manuscript only mentions name in passing).*

**[GPTQ] ⊕ Frantar, E. et al. *GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers.* ICLR 2023 (arXiv:2210.17323).** — *Add full citation.*

**[MXFP4] ⊕ Open Compute Project. *Microscaling Formats (MX) v1.0 Specification.* September 2023.** — *Add (load-bearing for any 2026-era Blackwell quantization claim).*

**[Microscaling] ⊕ Rouhani, B. et al. *Microscaling Data Formats for Deep Learning.* arXiv:2310.10537. 2023.** — *Add.*

---

## 5. Architecture papers

**[GQA] ⊕ Ainslie, J. et al. *GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints.* EMNLP 2023 (arXiv:2305.13245).** — *Add (manuscript cites by name only).*

**[MQA] ⊕ Shazeer, N. *Fast Transformer Decoding: One Write-Head Is All You Need.* arXiv:1911.02150. 2019.** — *Add.*

**[MLA / V2] ⊕ DeepSeek-AI. *DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model.* arXiv:2405.04434. 2024.** — *Add (currently cited only via tertiary sources).*

**[DeepSeek-V3] ✓ DeepSeek-AI. *DeepSeek-V3 Technical Report.* arXiv:2412.19437. 2024.** — *Verified.*

**[MHA2MLA] ✓ Ji, Y. et al. *Towards Economical Inference: Enabling DeepSeek's Multi-Head Latent Attention in Any Transformer-based LLMs.* arXiv:2502.14837. 2025.** — *Verified.*

**[CLA] ⊕ Brandon, W. et al. *Reducing Transformer Key-Value Cache Size with Cross-Layer Attention.* arXiv:2405.12981. 2024.** — *Add.*

**[YOCO] ⊕ Sun, Y. et al. *You Only Cache Once: Decoder-Decoder Architectures for Language Models.* NeurIPS 2024 (arXiv:2405.05254).** — *Add.*

**[Mamba] ⊕ Gu, A., Dao, T. *Mamba: Linear-Time Sequence Modeling with Selective State Spaces.* COLM 2024 (arXiv:2312.00752).** — *Add.*

**[Mamba-2] ⊕ Dao, T., Gu, A. *Transformers are SSMs: Generalized Models and Efficient Algorithms Through Structured State Space Duality.* ICML 2024 (arXiv:2405.21060).** — *Add.*

**[Llama-3] ⊕ Grattafiori, A. et al. *The Llama 3 Herd of Models.* arXiv:2407.21783. 2024.** — *Add (the manuscript cites the model's `config.json` but not the technical report).*

---

## 6. Distributed-systems primitives

**[Megatron-TP] ⊕ Shoeybi, M. et al. *Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism.* arXiv:1909.08053. 2019.** — *Add (the canonical source for tensor-parallel partitioning).*

**[Megatron-PP] ✓ Narayanan, D. et al. *Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM.* SC '21 (arXiv:2104.04473).** — *Verified.*

**[ZeroBubble] ⊕ Qi, P. et al. *Zero Bubble Pipeline Parallelism.* ICLR 2024 (arXiv:2401.10241).** — *Add (see `03_MISSING_TOPICS.md` M-8).*

**[SequenceParallel] ⊕ Korthikanti, V. et al. *Reducing Activation Recomputation in Large Transformer Models.* arXiv:2205.05198. 2022.** — *Add (canonical source for SP).*

**[Ring] ✓ Liu, H., Zaharia, M., Abbeel, P. *Ring Attention with Blockwise Transformers for Near-Infinite Context.* arXiv:2310.01889. 2023.** — *Verified.*

**[CP / Ulysses] ✓ Jacobs, S. et al. *DeepSpeed Ulysses: System Optimizations for Enabling Training of Extreme Long Sequence Transformer Models.* arXiv:2309.14509. 2023.** — *Verified.*

**[NCCL] ✓ NVIDIA. *nccl-tests/doc/PERFORMANCE.md.* GitHub.** — *Verified. Also add: NVIDIA NCCL Developer Guide §6.7 ("Algorithms").*

---

## 7. Speculative decoding

**[Spec-Original-1] ⊕ Leviathan, Y., Kalman, M., Matias, Y. *Fast Inference from Transformers via Speculative Decoding.* ICML 2023 (arXiv:2211.17192).** — *Add full citation.*

**[Spec-Original-2] ⊕ Chen, C. et al. *Accelerating Large Language Model Decoding with Speculative Sampling.* arXiv:2302.01318. 2023.** — *Add.*

**[Medusa] ⊕ Cai, T. et al. *Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads.* ICML 2024 (arXiv:2401.10774).** — *Add.*

**[EAGLE-2] ⊕ Li, Y. et al. *EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees.* arXiv:2406.16858. 2024.** — *Add.*

**[EAGLE-3] ✱ Li, Y. et al. *EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test.* arXiv:2503.01840. 2025.** — *Replace `[EAGLE-3]` (which currently cites the E2E Networks blog) with the primary.*

**[Sequoia] ⊕ Chen, Z. et al. *Sequoia: Scalable, Robust, and Hardware-aware Speculative Decoding.* arXiv:2402.12374. 2024.** — *Add.*

**[MTP] ⊕ Gloeckle, F. et al. *Better & Faster Large Language Models via Multi-token Prediction.* ICML 2024 (arXiv:2404.19737).** — *Add (load-bearing for the MTP-as-speculation discussion).*

---

## 8. Structured generation

**[Outlines] ⊕ Willard, B. T., Louf, R. *Efficient Guided Generation for Large Language Models.* arXiv:2307.09702. 2023.** — *Add.*

**[XGrammar] ✱ Dong, Y. et al. *XGrammar: Flexible and Efficient Structured Generation Engine for Large Language Models.* arXiv:2411.15100. 2024.** — *Add arXiv id.*

---

## 9. Multi-LoRA

**[Punica] ⊕ Chen, L. et al. *Punica: Multi-Tenant LoRA Serving.* MLSys 2024 (arXiv:2310.18547).** — *Add.*

**[S-LoRA] ⊕ Sheng, Y. et al. *S-LoRA: Serving Thousands of Concurrent LoRA Adapters.* MLSys 2024 (arXiv:2311.03285).** — *Add.*

---

## 10. Security / multi-tenancy

**[Cache-side] ✱ Song, Z. et al. *Leaking Secrets from Prefix Caches.* USENIX Security 2025 (or arXiv:2502.05368, depending on which paper is cited; manuscript should pin).** — *Pin to a specific paper.*

**[vLLM-salt] ✓ vLLM Project. *Automatic Prefix Caching: Cache Isolation for Security.* docs.vllm.ai. RFC #16016. April 2025.** — *Verified.*

---

## 11. Storage hierarchy

**[LMCache] ⊕ Yang, J. et al. *LMCache: Cache Layer for LLM Serving.* arXiv:2410.05094 (or project repo). 2024.** — *Add.*

**[MoonCake] ⊕ Qin, R. et al. *Mooncake: A KVCache-centric Disaggregated Architecture for LLM Serving.* arXiv:2407.00079. 2024.** — *Add.*

---

## 12. Production case studies

**[Disagg-retro] ✓ Hao AI Lab @ UCSD. *Disaggregated Inference: 18 Months Later.* November 2025.** — *Verified.*

**[LMSYS-EP] ✓ LMSYS / SGLang Team. *Deploying DeepSeek with PD Disaggregation and Large-Scale Expert Parallelism.* May 5, 2025.** — *Verified.*

**[Hazy] ✓ Stanford Hazy Research. *Look Ma, No Bubbles! Designing a Low-Latency Megakernel for Llama-1B.* May 27, 2025.** — *Verified.*

---

## 13. Implementation references

**[V1-arch] ✓ vLLM Project. *V1 Engine Architecture.* DeepWiki.** — *Verified. The `vllm/v1/engine/core.py`, `vllm/v1/core/sched/scheduler.py`, `vllm/v1/worker/gpu_model_runner.py` paths are correct as of vLLM 0.10.*

**[Gordić] ✓ Gordić, A. *Inside vLLM: Anatomy of a High-Throughput LLM Inference System.* August 2025. (Commit 42172ad reference.)** — *Verified. Outstanding tertiary reference.*

---

## 14. Ten new references Edition IX should add (consolidated list)

The following are referenced in `02_PHYSICS_REDERIVED.md`, `03_MISSING_TOPICS.md`, or `04_BENCHMARK_PROTOCOL.md` and should be added to the bibliography:

1. Pope, R. et al. *Efficiently Scaling Transformer Inference.* arXiv:2211.05102. 2022.
2. Vaswani et al., *Attention is All You Need.* NeurIPS 2017 (arXiv:1706.03762).
3. Williams, Waterman, Patterson, *Roofline.* CACM 2009.
4. Kleinrock, L. *Queueing Systems Volume 1: Theory.* Wiley 1975.
5. Choquette et al., *Hopper H100 GPU.* IEEE Micro 2023.
6. Open Compute Project, *MX Format Specification v1.0.* 2023.
7. Rouhani et al., *Microscaling Data Formats for Deep Learning.* arXiv:2310.10537. 2023.
8. Brandon et al., *Cross-Layer Attention.* arXiv:2405.12981. 2024.
9. Sun et al., *You Only Cache Once.* arXiv:2405.05254. 2024.
10. Gu & Dao, *Mamba.* arXiv:2312.00752. 2023.
11. Qi et al., *Zero Bubble Pipeline Parallelism.* ICLR 2024.
12. Gloeckle et al., *Multi-Token Prediction.* ICML 2024.
13. Qin et al., *Mooncake.* arXiv:2407.00079. 2024.
14. Liu et al., *MiniCache.* arXiv:2405.14366. 2024.
15. Chen et al., *Sequoia.* arXiv:2402.12374. 2024.
16. Cai et al., *Medusa.* ICML 2024.
17. Korthikanti et al., *Reducing Activation Recomputation.* arXiv:2205.05198. 2022.
18. Shoeybi et al., *Megatron-LM.* arXiv:1909.08053. 2019.
19. Yu et al., *Orca.* OSDI 2022.
20. Chen et al., *Punica.* MLSys 2024.
21. Sheng et al., *S-LoRA.* MLSys 2024.

— end corrected references —
