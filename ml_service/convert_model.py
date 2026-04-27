"""
ONNX Model Conversion Script
=============================
Converts sentence-transformers/all-MiniLM-L6-v2 to ONNX format
with INT8 dynamic quantization.

This script is executed ONCE during the Docker build stage.
PyTorch is NOT needed at runtime — only ONNX Runtime.

Usage:
    python convert_model.py

Output:
    /app/model_onnx/model.onnx           (FP32 baseline)
    /app/model_onnx/model_quantized.onnx (INT8 quantized — used at runtime)
    /app/model_onnx/tokenizer/           (HuggingFace tokenizer files)
"""

import os
import sys
import shutil
from pathlib import Path

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
OUTPUT_DIR = Path("/app/model_onnx")
ONNX_PATH = OUTPUT_DIR / "model.onnx"
QUANTIZED_PATH = OUTPUT_DIR / "model_quantized.onnx"
TOKENIZER_DIR = OUTPUT_DIR / "tokenizer"


def export_to_onnx():
    """Export the SentenceTransformer model to ONNX format."""
    import torch
    from transformers import AutoModel, AutoTokenizer

    print(f"[1/4] Loading model: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModel.from_pretrained(MODEL_NAME)
    model.eval()

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Save tokenizer for runtime use (no PyTorch needed)
    print(f"[2/4] Saving tokenizer to {TOKENIZER_DIR}")
    tokenizer.save_pretrained(str(TOKENIZER_DIR))

    # Create dummy input for ONNX export
    dummy_text = "This is a test sentence for ONNX export."
    encoded = tokenizer(
        dummy_text,
        padding="max_length",
        truncation=True,
        max_length=128,
        return_tensors="pt",
    )

    input_ids = encoded["input_ids"]
    attention_mask = encoded["attention_mask"]
    token_type_ids = encoded.get("token_type_ids", torch.zeros_like(input_ids))

    # Export to ONNX
    print(f"[3/4] Exporting ONNX model to {ONNX_PATH}")
    torch.onnx.export(
        model,
        (input_ids, attention_mask, token_type_ids),
        str(ONNX_PATH),
        input_names=["input_ids", "attention_mask", "token_type_ids"],
        output_names=["last_hidden_state"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "attention_mask": {0: "batch_size", 1: "sequence_length"},
            "token_type_ids": {0: "batch_size", 1: "sequence_length"},
            "last_hidden_state": {0: "batch_size", 1: "sequence_length"},
        },
        opset_version=14,
        do_constant_folding=True,
    )

    print(f"    ✓ Exported: {ONNX_PATH} ({ONNX_PATH.stat().st_size / 1024 / 1024:.1f} MB)")
    return True


def quantize_model():
    """Apply INT8 dynamic quantization to the ONNX model."""
    from onnxruntime.quantization import quantize_dynamic, QuantType

    print(f"[4/4] Quantizing model (INT8) → {QUANTIZED_PATH}")

    quantize_dynamic(
        model_input=str(ONNX_PATH),
        model_output=str(QUANTIZED_PATH),
        weight_type=QuantType.QInt8,
        optimize_model=True,
    )

    original_size = ONNX_PATH.stat().st_size / 1024 / 1024
    quantized_size = QUANTIZED_PATH.stat().st_size / 1024 / 1024
    reduction = (1 - quantized_size / original_size) * 100

    print(f"    ✓ FP32: {original_size:.1f} MB → INT8: {quantized_size:.1f} MB ({reduction:.0f}% reduction)")

    # Remove the FP32 model to save space in the Docker image
    ONNX_PATH.unlink()
    print(f"    ✓ Removed FP32 model (keeping only INT8)")


def verify_model():
    """Quick verification that the quantized model loads and produces output."""
    import numpy as np
    import onnxruntime as ort
    from transformers import AutoTokenizer

    print("\n[Verification] Loading quantized model...")
    session = ort.InferenceSession(
        str(QUANTIZED_PATH),
        providers=["CPUExecutionProvider"],
    )
    tokenizer = AutoTokenizer.from_pretrained(str(TOKENIZER_DIR))

    test_text = "The refrigerator is making a loud buzzing noise."
    encoded = tokenizer(
        test_text,
        padding=True,
        truncation=True,
        max_length=128,
        return_tensors="np",
    )

    outputs = session.run(
        None,
        {
            "input_ids": encoded["input_ids"],
            "attention_mask": encoded["attention_mask"],
            "token_type_ids": encoded.get(
                "token_type_ids", np.zeros_like(encoded["input_ids"])
            ),
        },
    )

    # Mean pooling
    token_embeddings = outputs[0]
    attention_mask = encoded["attention_mask"]
    input_mask_expanded = np.broadcast_to(
        attention_mask[:, :, np.newaxis], token_embeddings.shape
    )
    sum_embeddings = np.sum(token_embeddings * input_mask_expanded, axis=1)
    sum_mask = np.clip(input_mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
    embeddings = sum_embeddings / sum_mask

    # Normalize
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / norms

    print(f"    ✓ Output shape: {embeddings.shape}")
    print(f"    ✓ Embedding dim: {embeddings.shape[1]}")
    print(f"    ✓ Norm check: {np.linalg.norm(embeddings[0]):.4f} (should be ~1.0)")
    print(f"\n✅ Model conversion and verification complete!")


if __name__ == "__main__":
    try:
        export_to_onnx()
        quantize_model()
        verify_model()
    except Exception as e:
        print(f"\n❌ Conversion failed: {e}", file=sys.stderr)
        sys.exit(1)
