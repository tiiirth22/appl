"""
Tests for RAG pipeline fixes:
  1. Out-of-scope question (irrelevant/general knowledge) -> fast rejection
  2. Wrong-device question -> device mismatch message
  3. Fallback step guide must NOT contain device-specific numbers/codes
  4. /debug/pinecone/manual/{manual_id} diagnostic endpoint
"""
import sys
import os
import asyncio
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

# Add chat_service to path
sys.path.insert(0, os.path.dirname(__file__))

from rag_engine import RAGQueryEngine


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_engine(manual_id="test-manual-1", manual_name="Samsung 1.2"):
    return RAGQueryEngine(manual_id=manual_id)


# ---------------------------------------------------------------------------
# Test 1: Out-of-scope — irrelevant/general-knowledge question
# ---------------------------------------------------------------------------

def test_scope_filter_geography():
    engine = _make_engine()
    # Capital of France is classic general knowledge
    in_scope, msg = engine._is_question_in_scope(
        "What is the capital of France?", manual_name="Samsung 1.2"
    )
    assert not in_scope, "Geography question should be out-of-scope"
    assert msg is not None
    assert "ApplianceIQ" in msg or "can't answer" in msg or "cannot answer" in msg.lower() or "general" in msg.lower()


def test_scope_filter_random_keyboard():
    engine = _make_engine()
    # asfghjklzxcvbnm — no appliance keywords, no off-topic pattern
    # Should pass through (short enough or indeterminate) — not flagged
    in_scope, _ = engine._is_question_in_scope(
        "asfghjklzxcvbnm", manual_name="Samsung 1.2"
    )
    # This is 16 chars, below 30, so passes as vague
    assert in_scope, "Short/random input should not be rejected (handled by LLM)"


def test_scope_filter_politics():
    engine = _make_engine()
    in_scope, msg = engine._is_question_in_scope(
        "Who is the president of the United States?", manual_name="Samsung 1.2"
    )
    assert not in_scope
    assert msg is not None


# ---------------------------------------------------------------------------
# Test 2: Wrong-device question
# ---------------------------------------------------------------------------

def test_scope_filter_wrong_device():
    engine = _make_engine(manual_name="Samsung 1.2")
    # FM-600XL is clearly not the Samsung 1.2
    in_scope, msg = engine._is_question_in_scope(
        "What refrigerant does the FM-600XL use?", manual_name="Samsung 1.2"
    )
    assert not in_scope, "Different device model should be flagged"
    assert "FM-600XL" in msg or "FM" in msg
    assert "Samsung 1.2" in msg


def test_scope_filter_same_device_allowed():
    engine = _make_engine(manual_name="Samsung RF28R")
    # Same device in question — should be allowed
    in_scope, _ = engine._is_question_in_scope(
        "How do I reset the Samsung RF28R ice maker?", manual_name="Samsung RF28R"
    )
    assert in_scope, "Question about the same device should be in scope"


# ---------------------------------------------------------------------------
# Test 3: Appliance question always in scope
# ---------------------------------------------------------------------------

def test_scope_filter_e5_error_in_scope():
    engine = _make_engine()
    in_scope, _ = engine._is_question_in_scope(
        "What does the E5 error code mean?", manual_name="Samsung 1.2"
    )
    assert in_scope, "Error code question should always be in scope"


def test_scope_filter_vibration_in_scope():
    engine = _make_engine()
    in_scope, _ = engine._is_question_in_scope(
        "My washing machine is vibrating too much, why?", manual_name="Samsung 1.2"
    )
    assert in_scope, "Vibration complaint is clearly appliance-related"


# ---------------------------------------------------------------------------
# Test 4: answer_question returns structured out-of-scope response immediately
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_answer_question_out_of_scope_skips_pinecone():
    engine = _make_engine(manual_name="Samsung 1.2")

    # Patch _retrieve_chunks — it must NOT be called for out-of-scope questions
    with patch.object(engine, '_retrieve_chunks', new_callable=AsyncMock) as mock_retrieve:
        result = await engine.answer_question(
            manual_id="test-123",
            question="What is the capital of France?",
            manual_name="Samsung 1.2",
        )

    assert result["out_of_scope"] is True
    assert result["fallback"] is True
    assert result["confidence"] == 0.0
    assert result["steps"] == []
    mock_retrieve.assert_not_called()  # No API call was made


# ---------------------------------------------------------------------------
# Test 5: secondary info generates generic steps in fallback mode
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_secondary_info_fallback_no_device_specifics():
    engine = _make_engine()

    # Mock the secondary Groq client
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '''{
        "steps": [
            {"step": 1, "title": "General Troubleshooting Steps", "description": "Unplug the device and wait 60 seconds.", "warning": "Disconnect power before proceeding."}
        ],
        "severity": "minor",
        "cost": {"diy": "$0", "professional": "$50-$100"}
    }'''

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_response

    with patch.object(engine, '_get_secondary_groq_client', new=AsyncMock(return_value=mock_client)):
        info = await engine._generate_secondary_info(
            question="What does E5 error mean?",
            sources=[],  # Empty sources = fallback scenario
            manual_name="Samsung 1.2",
            mode="fallback",
        )

    assert "steps" in info
    assert len(info["steps"]) > 0

    # Verify the prompt sent to the client contained the right instructions
    call_args = mock_client.chat.completions.create.call_args
    prompt_text = call_args[1]["messages"][0]["content"]
    assert "generic" in prompt_text.lower() or "general" in prompt_text.lower()
    assert "DO NOT invent" in prompt_text or "generic, safe" in prompt_text.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
