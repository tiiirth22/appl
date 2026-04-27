"""
Dynamic Embedding Batcher
===========================
Collects individual embedding requests and processes them in batches
to maximize throughput on CPU.

Design:
  - Incoming texts are added to a queue.
  - A background coroutine flushes the queue every BATCH_WINDOW_MS or
    when BATCH_SIZE texts are accumulated, whichever comes first.
  - Each caller awaits a Future that resolves when its batch is processed.
  - This prevents 1-at-a-time encoding overhead.

Example improvement:
  Without batching: 8 sequential requests × 15ms = 120ms
  With batching:    1 batch of 8 × 18ms = 18ms
"""

import asyncio
import logging
import time
from typing import List, Optional

import numpy as np

from config import BATCH_SIZE, BATCH_WINDOW_MS

logger = logging.getLogger(__name__)


class _PendingItem:
    """Single text waiting for embedding."""
    __slots__ = ("text", "future")

    def __init__(self, text: str, future: asyncio.Future):
        self.text = text
        self.future = future


class EmbeddingBatcher:
    """
    Accumulates embedding requests and processes them in batches.

    Usage:
        batcher = EmbeddingBatcher(model_manager)
        await batcher.start()
        embedding = await batcher.embed("some text")
    """

    def __init__(self, model_manager, batch_size: int = BATCH_SIZE, window_ms: int = BATCH_WINDOW_MS):
        self._model_manager = model_manager
        self._batch_size = batch_size
        self._window_sec = window_ms / 1000.0
        self._queue: List[_PendingItem] = []
        self._lock = asyncio.Lock()
        self._flush_event = asyncio.Event()
        self._running = False
        self._task: Optional[asyncio.Task] = None

        # Metrics
        self.total_batches = 0
        self.total_texts = 0
        self.total_batch_time_ms = 0.0

    async def start(self):
        """Start the background batch processor."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._batch_loop())
        logger.info(f"Batcher started (batch_size={self._batch_size}, window={self._window_sec * 1000:.0f}ms)")

    async def stop(self):
        """Stop the background batch processor and flush remaining items."""
        self._running = False
        self._flush_event.set()
        if self._task:
            await self._task

    async def embed(self, text: str) -> np.ndarray:
        """
        Submit a single text for embedding.
        Returns a 1-D numpy array (embedding vector).
        """
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        item = _PendingItem(text=text, future=future)

        async with self._lock:
            self._queue.append(item)
            if len(self._queue) >= self._batch_size:
                self._flush_event.set()

        return await future

    async def embed_batch(self, texts: List[str]) -> np.ndarray:
        """
        Submit multiple texts at once. Returns (n_texts, dim) array.
        Bypasses the queue and processes directly for bulk operations.
        """
        model = await self._model_manager.get_model()
        embeddings = await asyncio.to_thread(
            model.encode, texts, batch_size=self._batch_size, convert_to_tensor=False
        )
        return np.array(embeddings) if not isinstance(embeddings, np.ndarray) else embeddings

    async def _batch_loop(self):
        """Background loop that flushes the queue periodically or when full."""
        while self._running:
            try:
                # Wait for either: batch is full, or timeout
                await asyncio.wait_for(
                    self._flush_event.wait(),
                    timeout=self._window_sec,
                )
            except asyncio.TimeoutError:
                pass  # Timeout — flush whatever we have

            self._flush_event.clear()
            await self._flush()

        # Final flush on shutdown
        await self._flush()

    async def _flush(self):
        """Process all pending items in the queue."""
        async with self._lock:
            if not self._queue:
                return
            items = self._queue[:]
            self._queue.clear()

        texts = [item.text for item in items]

        try:
            start = time.time()
            model = await self._model_manager.get_model()
            embeddings = await asyncio.to_thread(
                model.encode, texts, batch_size=self._batch_size, convert_to_tensor=False
            )
            elapsed_ms = (time.time() - start) * 1000

            # Metrics
            self.total_batches += 1
            self.total_texts += len(texts)
            self.total_batch_time_ms += elapsed_ms

            if not isinstance(embeddings, np.ndarray):
                embeddings = np.array(embeddings)

            logger.info(
                f"Batch processed: {len(texts)} texts in {elapsed_ms:.1f}ms "
                f"({elapsed_ms / len(texts):.1f}ms/text)"
            )

            # Resolve each future with its embedding slice
            for i, item in enumerate(items):
                if not item.future.done():
                    item.future.set_result(embeddings[i])

        except Exception as e:
            logger.error(f"Batch embedding failed: {e}", exc_info=True)
            for item in items:
                if not item.future.done():
                    item.future.set_exception(e)

    @property
    def metrics(self) -> dict:
        avg_batch_time = (
            self.total_batch_time_ms / self.total_batches
            if self.total_batches > 0 else 0
        )
        avg_text_time = (
            self.total_batch_time_ms / self.total_texts
            if self.total_texts > 0 else 0
        )
        return {
            "total_batches": self.total_batches,
            "total_texts": self.total_texts,
            "avg_batch_time_ms": round(avg_batch_time, 2),
            "avg_per_text_ms": round(avg_text_time, 2),
            "queue_depth": len(self._queue),
        }
