"""
ONNX-first Singleton Model Manager
====================================
Loads the INT8-quantized ONNX model at startup and shares it across all endpoints.
Falls back to sentence-transformers (PyTorch) for local development if ONNX model
files are not present.

Key design decisions:
  1. ONNX Runtime is ~50 MB vs PyTorch ~800 MB → massive RAM savings in production.
  2. Singleton pattern prevents duplicate loading.
  3. Mean pooling + L2 normalization replicate sentence-transformers output exactly.
  4. Thread-safe via asyncio.to_thread for CPU-bound inference.
"""

import asyncio
import logging
import os
import time
from typing import Optional, List, Union

import numpy as np

# CPU optimization — must be set BEFORE importing onnxruntime
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

from config import (
    USE_ONNX, ONNX_MODEL_PATH, ONNX_TOKENIZER_PATH,
    EMBEDDING_MODEL,
)

logger = logging.getLogger(__name__)


class ONNXEmbeddingModel:
    """
    Lightweight embedding model using ONNX Runtime.
    Mimics the SentenceTransformer.encode() interface.
    """

    def __init__(self, model_path: str, tokenizer_path: str):
        import onnxruntime as ort
        from transformers import AutoTokenizer

        logger.info(f"Loading ONNX model from {model_path}")
        start = time.time()

        # Session options for CPU optimization
        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = 1
        sess_options.inter_op_num_threads = 1
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL

        self.session = ort.InferenceSession(
            model_path,
            sess_options=sess_options,
            providers=["CPUExecutionProvider"],
        )
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)

        elapsed = time.time() - start
        logger.info(f"ONNX model loaded in {elapsed:.2f}s (providers: {self.session.get_providers()})")

    def encode(
        self,
        texts: Union[str, List[str]],
        batch_size: int = 8,
        convert_to_tensor: bool = False,
        normalize_embeddings: bool = True,
    ) -> np.ndarray:
        """
        Encode texts to embeddings — drop-in replacement for SentenceTransformer.encode().

        Args:
            texts: Single string or list of strings.
            batch_size: Internal batch size for tokenization.
            convert_to_tensor: Ignored (kept for API compat).
            normalize_embeddings: Whether to L2-normalize output.

        Returns:
            numpy array of shape (n_texts, embedding_dim).
        """
        if isinstance(texts, str):
            texts = [texts]

        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]

            encoded = self.tokenizer(
                batch,
                padding=True,
                truncation=True,
                max_length=128,
                return_tensors="np",
            )

            input_ids = encoded["input_ids"]
            attention_mask = encoded["attention_mask"]
            token_type_ids = encoded.get(
                "token_type_ids", np.zeros_like(input_ids)
            )

            outputs = self.session.run(
                None,
                {
                    "input_ids": input_ids,
                    "attention_mask": attention_mask,
                    "token_type_ids": token_type_ids,
                },
            )

            # Mean pooling (weighted by attention mask)
            token_embeddings = outputs[0]  # (batch, seq_len, hidden_dim)
            input_mask_expanded = np.broadcast_to(
                attention_mask[:, :, np.newaxis], token_embeddings.shape
            )
            sum_embeddings = np.sum(
                token_embeddings * input_mask_expanded, axis=1
            )
            sum_mask = np.clip(
                input_mask_expanded.sum(axis=1), a_min=1e-9, a_max=None
            )
            embeddings = sum_embeddings / sum_mask

            # L2 normalize
            if normalize_embeddings:
                norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
                norms = np.clip(norms, a_min=1e-9, a_max=None)
                embeddings = embeddings / norms

            all_embeddings.append(embeddings)

        return np.vstack(all_embeddings)


class ModelManager:
    """
    Thread-safe singleton that holds a single embedding model instance.

    Production path:  ONNX Runtime (INT8 quantized, ~22 MB, no PyTorch)
    Dev fallback:     sentence-transformers (full PyTorch, ~90 MB model + ~800 MB runtime)
    """

    _instance: Optional["ModelManager"] = None
    _model = None
    _loading_task: Optional[asyncio.Task] = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def status(self) -> str:
        if self._model:
            return "ready"
        if self._loading_task and not self._loading_task.done():
            return "loading"
        return "not_initialized"

    @property
    def backend(self) -> str:
        """Which inference backend is active."""
        if self._model is None:
            return "none"
        return "onnx" if isinstance(self._model, ONNXEmbeddingModel) else "pytorch"

    def initialize(self):
        """Kick off background model loading (non-blocking)."""
        if self._model or (self._loading_task and not self._loading_task.done()):
            return
        logger.info("Starting background model initialization...")
        self._loading_task = asyncio.create_task(self._load_model())

    async def _load_model(self):
        """Load the model in a background thread to avoid blocking the event loop."""
        try:
            if USE_ONNX:
                logger.info(f"Loading ONNX model: {ONNX_MODEL_PATH}")
                self._model = await asyncio.to_thread(
                    ONNXEmbeddingModel, ONNX_MODEL_PATH, ONNX_TOKENIZER_PATH
                )
                logger.info("✓ ONNX model loaded successfully")
            else:
                # Fallback for local development without pre-converted model
                logger.warning("ONNX model not found — falling back to sentence-transformers (PyTorch)")
                from sentence_transformers import SentenceTransformer
                import torch
                torch.set_num_threads(1)
                self._model = await asyncio.to_thread(
                    SentenceTransformer, EMBEDDING_MODEL, device="cpu"
                )
                logger.info(f"✓ PyTorch model {EMBEDDING_MODEL} loaded (fallback mode)")

            self._initialized = True

        except Exception as e:
            logger.error(f"Failed to load model: {e}", exc_info=True)
            self._loading_task = None
            raise

    async def get_model(self):
        """
        Get the model instance.
        Waits for loading if in progress. Starts loading if not yet triggered.
        """
        if self._model:
            return self._model

        # If no task exists, or task finished with an error, (re)start loading
        if self._loading_task is None or (
            self._loading_task.done() and self._model is None
        ):
            # Clear any stale failed task before creating a new one
            self._loading_task = None
            self.initialize()

        if self._loading_task:
            logger.info("Waiting for model initialization to complete...")
            await self._loading_task

        if self._model:
            return self._model

        raise RuntimeError("Model manager failed to provide a valid model instance.")

    async def encode(self, texts: Union[str, List[str]], batch_size: int = 8) -> np.ndarray:
        """
        High-level encode method. Delegates to whichever backend is loaded.
        Runs inference in a thread to keep the event loop free.
        """
        model = await self.get_model()

        result = await asyncio.to_thread(
            model.encode, texts, batch_size=batch_size, convert_to_tensor=False
        )

        if hasattr(result, "tolist"):
            return result if isinstance(result, np.ndarray) else np.array(result)
        return np.array(result)


# ─── Global singleton ──────────────────────────────────────────────────
model_manager = ModelManager()
