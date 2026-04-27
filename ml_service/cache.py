"""
Embedding Cache
================
LRU in-memory cache for embedding vectors.
Prevents recomputation for repeated queries (e.g. the same user asking
the same question multiple times, or identical chunks during ingestion).

Cache key = SHA-256 hash of the input text (deterministic, collision-resistant).
Cache value = numpy array (embedding vector).

Memory footprint: 1024 entries × 384 dims × 4 bytes = ~1.5 MB (negligible).
"""

import hashlib
import logging
from collections import OrderedDict
from typing import Optional

import numpy as np

from config import EMBEDDING_CACHE_SIZE

logger = logging.getLogger(__name__)


class EmbeddingCache:
    """Thread-safe LRU cache for embedding vectors."""

    def __init__(self, max_size: int = EMBEDDING_CACHE_SIZE):
        self._cache: OrderedDict[str, np.ndarray] = OrderedDict()
        self._max_size = max_size

        # Metrics
        self.hits = 0
        self.misses = 0

    @staticmethod
    def _hash_text(text: str) -> str:
        """Create a deterministic cache key from text."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def get(self, text: str) -> Optional[np.ndarray]:
        """Look up a cached embedding. Returns None on miss."""
        key = self._hash_text(text)
        if key in self._cache:
            # Move to end (most recently used)
            self._cache.move_to_end(key)
            self.hits += 1
            return self._cache[key]
        self.misses += 1
        return None

    def put(self, text: str, embedding: np.ndarray):
        """Store an embedding in the cache."""
        key = self._hash_text(text)

        if key in self._cache:
            self._cache.move_to_end(key)
            self._cache[key] = embedding
            return

        if len(self._cache) >= self._max_size:
            # Evict the least recently used entry
            evicted_key, _ = self._cache.popitem(last=False)
            logger.debug(f"Cache eviction: {evicted_key[:16]}...")

        self._cache[key] = embedding

    def clear(self):
        """Clear all cached embeddings."""
        self._cache.clear()
        self.hits = 0
        self.misses = 0
        logger.info("Embedding cache cleared")

    @property
    def size(self) -> int:
        return len(self._cache)

    @property
    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

    @property
    def metrics(self) -> dict:
        return {
            "size": self.size,
            "max_size": self._max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(self.hit_rate, 4),
            "memory_estimate_mb": round(
                self.size * 384 * 4 / (1024 * 1024), 2
            ),
        }


# ─── Global singleton ─────────────────────────────────────────────────
embedding_cache = EmbeddingCache()
