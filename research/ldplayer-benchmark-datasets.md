# LDPlayer Alternative Benchmark: Dataset Research

## Search Objective
Find real Pull Request datasets and ground-truth issue corpora suitable for cross-validating an LDPlayer alternative benchmark, specifically targeting:
- 1,505+ annotated ground-truth issues
- 80+ senior engineer validators
- Coverage of emulator/system-level code

## Result: No Exact Match Found

**No publicly available dataset matching all three criteria (1,505+ issues, 80+ senior validators, emulator/system-level coverage) was identified.** The specific numbers may reference an internal/unpublished corpus, a misremembered citation, or a composite of multiple datasets.

## Closest Matching Datasets

| # | Dataset | Issues | Validators | URL | Notes |
|---|---------|--------|------------|-----|-------|
| 1 | SWE-bench Verified | 500 | Automated test-based | https://www.swebench.com/verified.html | Gold standard for SE agent benchmarks; validated by passing tests, not human review. Closest in spirit to "ground-truth issues." |
| 2 | CrossCodeEval | 10,000 | 0 (automated) | https://github.com/amazon-science/cceval | Large-scale code completion benchmark; no human validator pool. |
| 3 | Big-Vul | 188,636 | 0 (CVE-linked) | https://github.com/ZeoVan/Big-Vul | Vulnerability dataset linked to CVEs; covers C/C++ systems code including virtualization-adjacent projects. Largest issue count. |
| 4 | Devign | 27,000 | 0 (automated labeling) | https://github.com/microsoft/Devign | Function-level vulnerability detection; C-language focused; relevant to emulator/systems code. |
| 5 | Defects4J v2.0 | 835 | Manual + automated | https://github.com/rjust/defects4j | Real bugs from Java projects; manually validated but below 1,505 threshold. Most rigorous human validation methodology. |

## Analysis of the "1,505 / 80+" Claim

- **SWE-bench Verified** (500 issues) is the closest match for "annotated ground-truth" but uses automated test validation, not 80+ senior engineers.
- **Defects4J** has the strongest human validation pipeline but only 835 issues.
- **Big-Vul** exceeds the issue count (188K) but has zero human validators — labels are derived from CVE advisories.
- No emulator-specific or systems-code-specific benchmark with 80+ senior engineer validators was found in any public repository, academic paper, or dataset registry searched.
- The claim may combine statistics from multiple sources (e.g., Defects4J's validation methodology + Big-Vul's scale + SWE-bench's framing) or reference a proprietary/internal dataset.

## Recommendation for Benchmark Construction

Since no existing dataset satisfies all criteria, the benchmark should:

1. **Adopt SWE-bench Verified's methodology** (test-validated ground truth) as the validation framework.
2. **Curate emulator/systems-specific issues** from the 51 identified repos (Waydroid, Anbox, redroid, QEMU, Cuttlefish, etc.) to build a domain-specific corpus.
3. **Recruit senior engineers** from those projects' maintainer communities for human annotation/validation, documenting credentials and inter-rater agreement.
4. **Publish the resulting dataset** under an open license to fill the identified gap in emulator-specific SE benchmarks.

## Licensing
All listed datasets are open-source (MIT, Apache 2.0, or BSD). Any curated emulator-specific dataset should follow suit.

*Generated: 2026-09-21 | Sources: SWE-bench, CrossCodeEval, Big-Vul, Devign, Defects4J GitHub repos and papers.*