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
import pickle
from collections import OrderedDict
from typing import Optional

import numpy as np
import redis

from config import EMBEDDING_CACHE_SIZE, REDIS_URL, REDIS_ENABLED

logger = logging.getLogger(__name__)


class EmbeddingCache:
    """Thread-safe LRU cache for embedding vectors with optional Redis backend."""

    def __init__(self, max_size: int = EMBEDDING_CACHE_SIZE):
        self._cache: OrderedDict[str, np.ndarray] = OrderedDict()
        self._max_size = max_size
        self._redis: Optional[redis.Redis] = None
        
        if REDIS_ENABLED:
            try:
                self._redis = redis.from_url(REDIS_URL, socket_timeout=2)
                self._redis.ping()
                logger.info("Distributed Redis cache enabled")
            except Exception as e:
                logger.warning(f"Redis cache unavailable, falling back to in-memory: {e}")

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
        
        # 1. Try Redis first
        if self._redis:
            try:
                data = self._redis.get(f"emb:{key}")
                if data:
                    self.hits += 1
                    return pickle.loads(data)
            except Exception as e:
                logger.error(f"Redis get error: {e}")

        # 2. Fallback to in-memory
        if key in self._cache:
            self._cache.move_to_end(key)
            self.hits += 1
            return self._cache[key]
            
        self.misses += 1
        return None

    def put(self, text: str, embedding: np.ndarray):
        """Store an embedding in the cache."""
        key = self._hash_text(text)

        # 1. Store in Redis (if available) with 24h expiration
        if self._redis:
            try:
                self._redis.setex(
                    f"emb:{key}",
                    86400,  # 24 hours
                    pickle.dumps(embedding)
                )
            except Exception as e:
                logger.error(f"Redis set error: {e}")

        # 2. Always maintain in-memory LRU as L1 cache
        if key in self._cache:
            self._cache.move_to_end(key)
            self._cache[key] = embedding
            return

        if len(self._cache) >= self._max_size:
            self._cache.popitem(last=False)

        self._cache[key] = embedding

    def clear(self):
        """Clear all cached embeddings."""
        self._cache.clear()
        if self._redis:
            try:
                # Only clear our namespace
                keys = self._redis.keys("emb:*")
                if keys:
                    self._redis.delete(*keys)
            except Exception as e:
                logger.error(f"Redis clear error: {e}")
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
            "l1_size": self.size,
            "max_l1_size": self._max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(self.hit_rate, 4),
            "redis_enabled": self._redis is not None,
        }


# ─── Global singleton ─────────────────────────────────────────────────
embedding_cache = EmbeddingCache()
