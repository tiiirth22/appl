"""
Observability & Metrics
========================
Lightweight resource tracking for the unified ML service.
Provides memory, CPU, and request latency metrics without
external dependencies (no Prometheus, no Datadog).
"""

import logging
import os
import time
import threading
from collections import deque
from typing import Dict, Any

logger = logging.getLogger(__name__)

# ─── Process-level resource tracking ─────────────────────────────────

def get_memory_usage_mb() -> float:
    """Get current process RSS memory in megabytes."""
    try:
        # Linux / Docker
        with open("/proc/self/status", "r") as f:
            for line in f:
                if line.startswith("VmRSS:"):
                    return int(line.split()[1]) / 1024  # kB → MB
    except FileNotFoundError:
        pass

    # Fallback: psutil (if installed)
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024 * 1024)
    except ImportError:
        pass

    return -1.0


def get_cpu_percent() -> float:
    """Get CPU usage percentage for the current process."""
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.cpu_percent(interval=0.1)
    except ImportError:
        pass

    # Fallback: parse /proc/stat (rough estimate)
    try:
        with open(f"/proc/{os.getpid()}/stat", "r") as f:
            parts = f.read().split()
            utime = int(parts[13])
            stime = int(parts[14])
            total = utime + stime
            # Clock ticks per second
            clk_tck = os.sysconf(os.sysconf_names["SC_CLK_TCK"])
            return (total / clk_tck) * 100
    except (FileNotFoundError, KeyError):
        pass

    return -1.0


# ─── Request Latency Tracker ─────────────────────────────────────────

class LatencyTracker:
    """
    Tracks request latencies per endpoint with a sliding window.
    Thread-safe, zero-dependency.
    """

    def __init__(self, window_size: int = 100):
        self._window_size = window_size
        self._latencies: Dict[str, deque] = {}
        self._lock = threading.Lock()
        self._total_requests: Dict[str, int] = {}

    def record(self, endpoint: str, latency_ms: float):
        """Record a request latency."""
        with self._lock:
            if endpoint not in self._latencies:
                self._latencies[endpoint] = deque(maxlen=self._window_size)
                self._total_requests[endpoint] = 0

            self._latencies[endpoint].append(latency_ms)
            self._total_requests[endpoint] += 1

    def get_stats(self, endpoint: str) -> Dict[str, Any]:
        """Get latency stats for an endpoint."""
        with self._lock:
            if endpoint not in self._latencies or not self._latencies[endpoint]:
                return {"count": 0}

            data = list(self._latencies[endpoint])
            data.sort()

            n = len(data)
            return {
                "count": self._total_requests[endpoint],
                "window_size": n,
                "avg_ms": round(sum(data) / n, 2),
                "min_ms": round(data[0], 2),
                "max_ms": round(data[-1], 2),
                "p50_ms": round(data[n // 2], 2),
                "p95_ms": round(data[min(int(n * 0.95), n - 1)], 2),
                "p99_ms": round(data[min(int(n * 0.99), n - 1)], 2),
            }

    def get_all_stats(self) -> Dict[str, Any]:
        """Get latency stats for all endpoints."""
        with self._lock:
            endpoints = list(self._latencies.keys())
        return {ep: self.get_stats(ep) for ep in endpoints}


# ─── Global Metrics Collector ─────────────────────────────────────────

class MetricsCollector:
    """Aggregates all metrics into a single report."""

    def __init__(self):
        self.latency = LatencyTracker()
        self._start_time = time.time()

    @property
    def uptime_seconds(self) -> float:
        return time.time() - self._start_time

    def collect(
        self,
        model_manager=None,
        batcher=None,
        cache=None,
    ) -> Dict[str, Any]:
        """Collect all metrics into a single report."""
        report = {
            "uptime_seconds": round(self.uptime_seconds, 1),
            "memory_mb": round(get_memory_usage_mb(), 1),
            "cpu_percent": round(get_cpu_percent(), 1),
            "latency": self.latency.get_all_stats(),
        }

        if model_manager:
            report["model"] = {
                "status": model_manager.status,
                "backend": model_manager.backend,
            }

        if batcher:
            report["batcher"] = batcher.metrics

        if cache:
            report["cache"] = cache.metrics

        return report


# ─── Global singleton ─────────────────────────────────────────────────
metrics = MetricsCollector()
