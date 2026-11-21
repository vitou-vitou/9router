# Android Emulator Benchmark Methodologies: State of the Art & Gaps

## 1. Existing Benchmarks & Frameworks

### 1.1 Trinity (OSDI'22) — High-Performance Graphics Projection
- **Source:** Gao et al., "High-Performance Mobile Emulation through Graphics Projection", OSDI 2022 ([usenix.org/system/files/osdi22-gao.pdf](https://www.usenix.org/system/files/osdi22-gao.pdf))
- **Emulators Compared:** Trinity, GAE (Google Android Emulator), QEMU-KVM, WSA, VMware Workstation, BlueStacks, DAOW.
- **Metrics:**
  - FPS (average per app, pairwise comparison on compatible apps).
  - Compatibility rate (% of top-100 3D apps + 10K random Play Store apps that launch/run).
  - Efficiency breakdown (projection space, flow control, data teleporting contributions).
  - Memory overhead of projection layer.
- **Test Harness:** Fixed config (4-core CPU, 4GB RAM, 64GB storage, 1080p@60Hz). High-end (i7-8750H/GTX1070) and mid-end (i5-9300H/UHD630) PCs. Windows 11 for most; Ubuntu 20.04 for QEMU-KVM.
- **Reproducibility:** Configs published; binary/code/data released at [TrinityEmulator.github.io](https://TrinityEmulator.github.io/).
- **Key Finding:** Trinity achieves 80–110% native performance, outperforming BlueStacks by ~9.8% avg FPS on high-end, ~16.1% on mid-end. DAOW beats Trinity on CPU-heavy physics apps due to direct hardware interfacing.

### 1.2 AndroidWorld (arXiv 2405.14573) — Agent Task Benchmark
- **Source:** Rawles et al., "AndroidWorld: A Dynamic Benchmarking Environment for Autonomous Agents" ([arxiv.org/html/2405.14573v2](https://arxiv.org/html/2405.14573v2))
- **Focus:** Reproducible task completion for AI agents, NOT emulator performance per se.
- **Metrics:** Task success rate, latency (agent vs human), reward signals.
- **Harness:** Pixel 6 emulator, Android 13, fixed date/time, 116 tasks across 20 open-source apps. Uses AndroidEnv Python library.
- **Reproducibility:** Each task has dedicated init/success-check/teardown logic. Apps require no auth. Random parameterization creates millions of variants.
- **Gap:** Does not measure emulator overhead, FPS, or resource consumption. Assumes emulator is a black box.

### 1.3 Alibaba MobilePerf — Performance Data Collection
- **Source:** [github.com/alibaba/mobileperf](https://github.com/alibaba/mobileperf) (755 stars, MIT)
- **Metrics:** CPU, memory, FPS, logcat, traffic, process/thread count, launch time.
- **Harness:** Python PC tool + ADB. No root, no SDK integration. Supports Android 6–16. Runs 72h+ continuously. ~12MB host memory.
- **Reproducibility:** Config file driven (`config.conf`). Cross-platform (Mac/Linux/Windows).
- **Limitation:** Designed for physical devices; works on emulators via ADB but doesn't account for emulator-specific overhead or hypervisor differences.

### 1.4 Simpleperf (AOSP) — Low-Level Profiling
- **Source:** [github.com/blmousee/simpleperf](https://github.com/blmousee/simpleperf) (AOSP mirror)
- **Metrics:** cpu-cycles, instructions, branch-misses, task-clock, per-function/per-DSO overhead.
- **Harness:** On-device profiling via `adb shell simpleperf record`. Requires `security.perf_harden=0`.
- **Use Case:** Micro-benchmarking guest-side code hotspots inside emulator. Not an emulator comparison tool.

### 1.5 Community Comparisons & CI Discussions
- **BlueStacks vs Android-x86/VirtualBox:** Student project ([tanishq18/Comparison-of-BlueStacks-and-Android-x86-on-VirtualBox-for-Android-Emulation-on-Windows](https://github.com/tanishq18/Comparison-of-BlueStacks-and-Android-x86-on-VirtualBox-for-Android-Emulation-on-Windows)). Limited methodology detail.
- **MobileNativeFoundation Discussion #229:** CI emulator perf pain points. Key insights: google-atd images have disabled UI; emulator.wtf outperforms Firebase Test Lab due to lower invocation overhead; KVM + GPU acceleration critical; ARM hosts preferred for ARM APKs.
- **Reverse Engineering Guide (LaurieWired):** ISA matching is the #1 perf factor. x86_64 host + ARM APK = unusable without translation. Docker/redroid recommended for portability. Cloud VMs for cross-ISA analysis.
- **Android Emulator Hypervisor Driver Issue #24:** WHPX vs HAXM perf. Cold boot speed differs; runtime perf similar. Type-1 vs Type-2 hypervisor matters.

### 1.6 Container-Based Emulators (redroid, Waydroid, Anbox)
- **No published comparative benchmarks found.** These are frequently discussed in RE/dev communities but lack standardized FPS/latency/overhead comparisons against traditional emulators in primary literature.
- **redroid:** Docker-based, headless, used in cloud/device farms. Perf depends entirely on host kernel + GPU passthrough config.
- **Waydroid:** Linux container (LXC), shares host kernel. Theoretically lowest overhead on Linux but no published numbers vs Genymotion/BlueStacks.
- **Anbox:** Deprecated/predecessor to Waydroid. No recent benchmarks.

---

## 2. Metrics Catalogue

| Metric | Definition | Tools Used | Emulator-Specific? |
|--------|-----------|------------|-------------------|
| FPS (avg/min/p99) | Frames rendered per second | MobilePerf, systrace, custom GL hooks | Yes |
| Frame latency / jank | Time between frame submission and display | Choreographer, gfxinfo dumpsys | Yes |
| Cold boot time | Emulator process start → home screen visible | Manual stopwatch, adb wait-for-device | Yes |
| App install time | `adb install` start → success | MobilePerf, adb timing | Partially |
| App launch time | am start → first frame drawn | MobilePerf, activity manager logs | Partially |
| Host CPU % | Emulator process CPU on host | top/htop/perf on host | Yes |
| Host RAM | RSS/PSS of emulator process | smem, /proc/[pid]/status | Yes |
| Guest CPU/RAM | Inside-emulator resource use | MobilePerf, simpleperf, dumpsys meminfo | No (shared with device) |
| Compatibility rate | % of target app set that launches + runs basic interaction | Manual or scripted smoke test | Yes |
| Input latency | Touch event → visible response | High-speed camera, instrumented app | Yes |
| Network throughput | iperf3 guest↔host or guest↔external | iperf3, adb reverse | Partially |
| Disk I/O | Sequential/random read/write inside guest | fio, AndroMark | Partially |
| GPU API overhead | Draw call latency, shader compile time | RenderDoc, GAPID, Tracy | Yes |
| Multi-instance scaling | N emulators concurrent → aggregate FPS/CPU | Custom orchestrator | Yes |

---

## 3. Reproducibility Approaches

1. **Fixed AVD/System Image:** AndroidWorld pins Pixel 6 + Android 13 + specific app versions. Trinity fixes CPU/RAM/resolution/hypervisor settings.
2. **Config-as-Code:** MobilePerf uses `config.conf`. Trinity publishes full emulator configs. AndroidWorld is fully scripted (Python + AndroidEnv).
3. **State Reset:** AndroidWorld has per-task teardown/init. Trinity uses cold boots between runs. MobilePerf supports monkey test loops with reset.
4. **Open Artifacts:** Trinity releases binary + data. AndroidWorld is open-source. MobilePerf is MIT-licensed.
5. **Host Spec Documentation:** Trinity specifies exact CPU/GPU/RAM/OS for both tiers. Most community benchmarks omit this, making replication impossible.

---

## 4. Identified Gaps for 50-Repo Benchmark

### Gap 1: No Unified Cross-Emulator Benchmark Suite
Existing work compares 2–7 emulators at most, using ad-hoc scripts. No single harness covers LDPlayer, BlueStacks, Genymotion, Waydroid, Anbox, redroid, GAE, and WSA with identical workloads and metrics.

### Gap 2: Container Emulators Are Unmeasured
redroid, Waydroid, and Anbox have zero published FPS/latency/overhead comparisons against traditional emulators in primary sources. The 50-repo benchmark should be the first to include them with reproducible methodology.

### Gap 3: Real-World App Corpus Missing
Trinity uses top-100 3D apps + 10K random. AndroidWorld uses 20 open-source apps. Neither covers the long tail of real-world apps (banking, social, e-commerce, government) that users actually run. A 50-repo corpus spanning categories fills this.

### Gap 4: Host Resource Overhead Not Standardized
Most benchmarks report guest-side metrics only. Host CPU/RAM/disk/GPU overhead per emulator instance is rarely measured systematically, yet it's the key differentiator for CI/cloud/device-farm operators.

### Gap 5: Multi-Instance Scaling Unstudied
No published data on how FPS/latency degrades when running N=1..10 emulator instances concurrently. Critical for device farm and CI capacity planning.

### Gap 6: Input Latency Largely Ignored
Only FPS is consistently measured. End-to-end touch-to-screen latency (critical for gaming and interactive apps) appears in no emulator comparison paper.

### Gap 7: Reproducibility Artifacts Incomplete
Many community comparisons lack: exact emulator version, host OS patch level, hypervisor driver version, GPU driver version, thermal state, background process list. The 50-repo benchmark should mandate a reproducibility manifest.

### Gap 8: No Statistical Rigor
Most comparisons report single-run averages. Confidence intervals, warm-up periods, outlier handling, and significance testing are absent from all surveyed emulator benchmarks except AndroidWorld (which focuses on agent success rates, not emulator perf).

### Gap 9: Architecture Translation Overhead Unquantified
ARM→x86 translation (libhoudini, ndk_translation) is known to be slow but no benchmark quantifies the penalty across emulators with different translation layers.

### Gap 10: CI/Cloud-Specific Metrics Missing
Invocation overhead (time from request to ready), snapshot restore time, and cost-per-test-hour are operationally critical but absent from academic benchmarks. emulator.wtf's advantage over Firebase Test Lab is anecdotal; no systematic comparison exists.

---

## 5. Recommended Methodology for 50-Repo Benchmark

Based on gaps above, the new benchmark should:

1. **Adopt Trinity's harness structure** (fixed configs, pairwise FPS, compatibility %) but extend to 8+ emulators including container-based.
2. **Use MobilePerf as the guest-side metric collector** (non-invasive, cross-version, proven stable).
3. **Add host-side instrumentation** (perf/cgroups for CPU, smem for RAM, nvidia-smi/intel_gpu_top for GPU).
4. **Define a 50-app corpus** spanning 10 categories × 5 apps each, with pinned APK versions + SHA256.
5. **Measure input latency** via instrumented test app + high-frequency timestamp logging.
6. **Run multi-instance tests** (N=1,2,4,8) with aggregate and per-instance metrics.
7. **Publish a reproducibility manifest**: emulator version, host OS/kernel, hypervisor, GPU driver, BIOS settings, thermal profile, background services.
8. **Apply statistical rigor**: 5+ warm-up runs, 10+ measured runs, bootstrap confidence intervals, Wilcoxon signed-rank for pairwise comparisons.
9. **Include ARM→x86 translation penalty** as a dedicated metric for non-native APKs.
10. **Report CI-relevant metrics**: cold boot, snapshot restore, invocation-to-ready time.

---

*Generated: 2026-09-21 | Sources: OSDI'22 Trinity paper, AndroidWorld arXiv, Alibaba MobilePerf, MNF Discussion #229, AOSP simpleperf, community guides. All primary sources.*