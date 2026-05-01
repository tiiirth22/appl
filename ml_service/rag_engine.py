"""RAG Query Engine — adapted from chat_service/rag_engine.py for the unified service.
Uses shared model_manager and embedding_cache instead of separate instances."""

import asyncio
import uuid
import time
import re
import json
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple

try:
    from pinecone import Pinecone
    PINECONE_AVAILABLE = True
except Exception as e:
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.error(f"CRITICAL: Failed to load Pinecone SDK: {e}")
    PINECONE_AVAILABLE = False

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

from config import (
    EMBEDDING_MODEL, LLM_MODEL, GROQ_API_KEY,
    GROQ_API_KEY_SECONDARY, LLM_MODEL_SECONDARY,
    GROQ_VISION_MODEL, GEMINI_API_KEY,
    PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_NAMESPACE,
    QUERY_TIMEOUT, EMBEDDING_TIMEOUT, PINECONE_TIMEOUT
)
from model_manager import model_manager
from cache import embedding_cache
from errors import (
    EmbeddingError, PineconeError, RAGError, TimeoutError as TimeoutErrorException,
    ServiceUnavailableError, MLServiceException, ErrorType,
)
from logger_config import get_processing_logger

import numpy as np

logger = get_processing_logger(__name__)

HARDCODED_COST_MAP = {
    "water_leak": {"diy": "$10–$30", "professional": "$100–$200"},
    "cooling_issue": {"diy": "$50–$100", "professional": "$200–$400"},
    "noise_vibration": {"diy": "$5–$20", "professional": "$80–$150"},
    "door_seal": {"diy": "$20–$60", "professional": "$100–$150"},
    "electrical": {"diy": "Not recommended", "professional": "$150–$350"},
    "unknown": {"diy": "Cost estimate unavailable", "professional": "Cost estimate unavailable"},
}

_global_pinecone_client = None
_global_pinecone_index = None
_global_groq_client = None
_global_groq_client_secondary = None

APPLIANCE_KEYWORDS = [
    'error','code','fault','repair','fix','broken','noise','vibration',
    'leak','temperature','cooling','heating','drum','motor','sensor',
    'compressor','refrigerant','filter','pump','drain','hose','seal',
    'door','button','display','light','power','water','ice','spin',
    'wash','dry','heat','cool','reset','beep','alarm','pressure',
    'voltage','surge','protector','install','replace','clean','maintain',
    'manual','troubleshoot','setting','mode','cycle','timer','blade',
    'belt','brush','coil','capacitor','thermostat','fuse','relay',
    'appliance','refrigerator','fridge','washer','washing machine',
    'dryer','dishwasher','microwave','oven','stove','freezer',
    'air conditioner','ac','heater','vacuum','blender',
    'security','lock','privacy','password','login','safety','kensington','port','connector',
]

OFF_TOPIC_PATTERNS = [
    ('capital','country','city','geography'),
    ('president','prime minister','politics','election'),
    ('movie','actor','film','song','music','celebrity'),
    ('recipe','cook','food','restaurant'),
    ('math','equation','calculate','algebra','calculus'),
    ('history','war','ancient'),
    ('stock','crypto','bitcoin','invest'),
]

# ─── Configurable Thresholds ──────────────────────────────────────────
CONFIDENCE_THRESHOLD_STRICT = 0.40  # Below this, we reject entirely
CONFIDENCE_THRESHOLD_PARTIAL = 0.60 # Below this, we warn the user
VAGUE_QUERY_PATTERNS = [
    r'^help\??$', r'^not working\??$', r'^issue\??$', r'^error\??$',
    r'^[?!.\s]+$', r'^.{1,3}$', r'^[asdfghjkl;]+$'
]
FALLBACK_SUPPORT_MSG = "I could not find reliable information related to your query in the uploaded manual. Please contact customer support at +91 8733078931 for further assistance."
NULL_RESPONSE_TOKEN = "[[OUT_OF_CONTEXT]]"


class RAGQueryEngine:
    """RAG-based query answering engine using shared ONNX embeddings."""

    def __init__(self, manual_id: Optional[str] = None, request_id: Optional[str] = None):
        self.manual_id = manual_id
        self.request_id = request_id
        self.logger = get_processing_logger(__name__, manual_id, request_id)
        self._pinecone_client = None
        self._pinecone_index = None
        self._groq_client = None
        self._groq_client_secondary = None

    def _validate_query_quality(self, question: str) -> Tuple[bool, Optional[str]]:
        """Detect vague, nonsensical or extremely low-quality queries."""
        q = question.lower().strip()
        
        # 1. Check for random characters or very short queries
        if len(q) < 4 and not q.isdigit():
            return False, "Your query is too short. Please provide more details about the issue."
            
        # 2. Check for vague patterns
        for pattern in VAGUE_QUERY_PATTERNS:
            if re.match(pattern, q):
                return False, "I need more information to help you. Could you describe exactly what's happening with the device?"
                
        return True, None

    def _is_question_in_scope(self, question: str, manual_name: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        q = question.lower().strip()
        
        # Quality check first
        is_quality, quality_msg = self._validate_query_quality(question)
        if not is_quality:
            return False, quality_msg

        has_kw = any(kw in q for kw in APPLIANCE_KEYWORDS)
        if not has_kw:
            for pg in OFF_TOPIC_PATTERNS:
                if any(p in q for p in pg):
                    return False, f"I'm specialized in appliance support. I can't answer general questions about {pg[0]}."

        return True, None

    async def answer_question(self, manual_id: str, question: str,
                              manual_name: Optional[str] = None, top_k: int = 5,
                              history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        start_time = time.time()
        query_id = str(uuid.uuid4())

        in_scope, rejection_msg = self._is_question_in_scope(question, manual_name)
        if not in_scope:
            self.logger.info(f"Out-of-scope question rejected: {question[:80]}")
            return {
                "query_id": query_id, "answer": rejection_msg, "sources": [],
                "confidence": 0.0, "processing_time_ms": (time.time() - start_time) * 1000,
                "video_url": None, "steps": [], "severity": "none",
                "cost": {"diy": "N/A", "professional": "N/A"},
                "history": history or [], "from_manual": False, "fallback": True, "out_of_scope": True,
            }

        try:
            self.logger.info(f"Processing query: {question[:100]}...")
            
            # --- NEW: Multi-Query Expansion ---
            # We generate 2 semantic variations to increase recall for technical terms
            variations = [question]
            try:
                expansion_prompt = f"Given the technical query: '{question}', provide 2 alternative search terms that might appear in a laptop manual (e.g., technical names, synonyms). Output ONLY the terms separated by |"
                expansion_resp = await asyncio.wait_for(
                    self._call_llm_internal(expansion_prompt, model="llama-3.1-8b-instant", max_tokens=30),
                    timeout=3.0
                )
                if expansion_resp and "|" in expansion_resp:
                    variations.extend([v.strip() for v in expansion_resp.split("|") if v.strip()])
                    self.logger.info(f"Expanded queries: {variations}")
            except Exception as e:
                self.logger.warning(f"Query expansion failed: {e}")

            # Collect chunks from all variations
            all_chunks = []
            all_scores = []
            
            for q_var in variations:
                q_emb = await self._embed_text(q_var)
                chunks, mode, score = await self._retrieve_chunks(manual_id, q_emb, top_k=5)
                all_chunks.extend(chunks)
                all_scores.append(score)

            # Deduplicate by text content and keep highest score for each
            unique_chunks = {}
            for c in all_chunks:
                if c["text"] not in unique_chunks or c["score"] > unique_chunks[c["text"]]["score"]:
                    unique_chunks[c["text"]] = c
            
            sources = sorted(unique_chunks.values(), key=lambda x: x["score"], reverse=True)[:top_k]
            top_score = max(all_scores) if all_scores else 0.0
            mode = "strong" if top_score > 0.6 else "partial"

            # 1. Similarity Check (Hard Rejection)
            if top_score < CONFIDENCE_THRESHOLD_STRICT:
                self.logger.warning(f"Low confidence rejection: {top_score:.2f} < {CONFIDENCE_THRESHOLD_STRICT}")
                return {
                    "query_id": query_id, "answer": FALLBACK_SUPPORT_MSG, "sources": [],
                    "confidence": float(top_score), "rejection_reason": "low_confidence",
                    "is_reliable": False, "processing_time_ms": (time.time() - start_time) * 1000,
                    "history": history or [], "from_manual": False, "fallback": True
                }

            video_url = self._construct_youtube_url(question, manual_name=manual_name)

            async def get_secondary_safely():
                try:
                    return await self._generate_secondary_info(question, sources, manual_name=manual_name, mode=mode)
                except Exception as e:
                    self.logger.error(f"Secondary info failed: {e}")
                    return {"steps": [], "severity": None, "cost": None}

            answer, secondary_info = await asyncio.gather(
                self._generate_answer(question, sources, mode=mode, manual_name=manual_name, history=history),
                get_secondary_safely(),
            )
            
            # 2. LLM Relevance Check (Hallucination Guard)
            if NULL_RESPONSE_TOKEN in answer:
                self.logger.warning("LLM triggered context-missing fallback")
                return {
                    "query_id": query_id, "answer": FALLBACK_SUPPORT_MSG, "sources": [],
                    "confidence": float(top_score), "rejection_reason": "context_insufficient",
                    "is_reliable": False, "processing_time_ms": (time.time() - start_time) * 1000,
                    "history": history or [], "from_manual": False, "fallback": True
                }

            processing_time_ms = (time.time() - start_time) * 1000
            
            return {
                "query_id": query_id, 
                "answer": answer, 
                "sources": sources if top_score > CONFIDENCE_THRESHOLD_PARTIAL else [],
                "confidence": float(top_score), 
                "is_reliable": top_score > CONFIDENCE_THRESHOLD_PARTIAL,
                "rejection_reason": None if top_score > CONFIDENCE_THRESHOLD_PARTIAL else "partial_match",
                "processing_time_ms": processing_time_ms,
                "video_url": video_url,
                "steps": secondary_info.get("steps", []),
                "severity": secondary_info.get("severity", "none"),
                "cost": secondary_info.get("cost", {"diy": "Unavailable", "professional": "Unavailable"}),
                "history": history or [], "from_manual": mode != "fallback", "fallback": mode == "fallback",
            }
        except MLServiceException:
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error: {e}", exc_info=True)
            raise RAGError(str(e), retryable=True)

    # ─── Embedding (uses shared model + cache) ───────────────────────

    async def _embed_text(self, text: str, timeout: int = EMBEDDING_TIMEOUT) -> List[float]:
        try:
            cached = embedding_cache.get(text)
            if cached is not None:
                return cached.tolist() if hasattr(cached, "tolist") else list(cached)

            embeddings = await asyncio.wait_for(model_manager.encode(text), timeout=timeout)
            emb = embeddings[0] if embeddings.ndim > 1 else embeddings
            embedding_cache.put(text, emb)
            return emb.tolist() if hasattr(emb, "tolist") else list(emb)
        except asyncio.TimeoutError:
            raise TimeoutErrorException("embedding", timeout)
        except Exception as e:
            raise EmbeddingError(str(e), retryable=True)

    # ─── Pinecone retrieval ──────────────────────────────────────────

    async def _get_pinecone_index(self):
        global _global_pinecone_client, _global_pinecone_index
        if _global_pinecone_index is not None:
            self._pinecone_client = _global_pinecone_client
            return _global_pinecone_index
        
        if not PINECONE_AVAILABLE:
            raise ServiceUnavailableError("pinecone", "pinecone SDK not installed")
            
        if not PINECONE_API_KEY:
            raise ServiceUnavailableError("pinecone", "PINECONE_API_KEY not configured")
        try:
            if _global_pinecone_client is None:
                _global_pinecone_client = Pinecone(api_key=PINECONE_API_KEY)
            _global_pinecone_index = _global_pinecone_client.Index(PINECONE_INDEX_NAME)
            self._pinecone_client = _global_pinecone_client
            return _global_pinecone_index
        except Exception as e:
            raise PineconeError(f"Failed to initialize Pinecone: {e}", retryable=True)

    async def _retrieve_chunks(self, manual_id: str, embedding: List[float],
                               top_k: int = 5, timeout: int = PINECONE_TIMEOUT
                               ) -> Tuple[List[Dict[str, Any]], str, float]:
        try:
            index = await self._get_pinecone_index()
            self.logger.info(f"Querying Pinecone | Dim: {len(embedding)} | manual_id: {manual_id}")

            index_desc = await asyncio.to_thread(self._pinecone_client.describe_index, PINECONE_INDEX_NAME)
            if len(embedding) != index_desc.dimension:
                raise PineconeError(f"Dimension mismatch: {len(embedding)} vs {index_desc.dimension}", retryable=False)

            results = await asyncio.wait_for(
                asyncio.to_thread(lambda: index.query(
                    vector=embedding, top_k=top_k, include_metadata=True,
                    filter={"manual_id": {"$eq": manual_id}},
                    namespace=PINECONE_NAMESPACE,
                )),
                timeout=timeout,
            )

            matches = results.get("matches", [])
            top_score = matches[0]["score"] if matches else 0.0

            if top_score >= 0.6:
                mode = "strong"
            elif top_score >= 0.25:
                mode = "partial"
            else:
                mode = "fallback"

            chunks = []
            for match in matches:
                meta = match.get("metadata", {})
                chunks.append({
                    "text": meta.get("text", ""), "page": meta.get("page_number", 0),
                    "score": match["score"], "manual_name": meta.get("manual_name", "Unknown"),
                })
            return chunks, mode, top_score
        except asyncio.TimeoutError:
            raise TimeoutErrorException("pinecone_query", timeout)
        except MLServiceException:
            raise
        except Exception as e:
            raise PineconeError(str(e), retryable=True)

    # ─── LLM answer generation ───────────────────────────────────────

    async def _get_groq_client(self):
        global _global_groq_client
        if _global_groq_client is not None:
            return _global_groq_client
        if not GROQ_AVAILABLE:
            raise ServiceUnavailableError("groq", "groq SDK not installed")
        if not GROQ_API_KEY:
            raise ServiceUnavailableError("groq", "GROQ_API_KEY not configured")
        _global_groq_client = await asyncio.to_thread(Groq, api_key=GROQ_API_KEY)
        return _global_groq_client

    async def _get_secondary_groq_client(self):
        global _global_groq_client_secondary
        if _global_groq_client_secondary is not None:
            return _global_groq_client_secondary
        if not GROQ_AVAILABLE:
            return None
        key = GROQ_API_KEY_SECONDARY or GROQ_API_KEY
        if not key:
            return None
        try:
            _global_groq_client_secondary = await asyncio.to_thread(Groq, api_key=key)
            return _global_groq_client_secondary
        except Exception:
            return None

    async def _call_llm_internal(self, prompt: str, model: str = "llama-3.1-8b-instant", max_tokens: int = 100) -> str:
        """Utility for internal small LLM tasks like query expansion."""
        try:
            client = await self._get_groq_client()
            response = await asyncio.to_thread(lambda: client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=max_tokens
            ))
            return response.choices[0].message.content.strip()
        except Exception as e:
            self.logger.error(f"Internal LLM call failed: {e}")
            return ""

    async def _generate_answer(self, question: str, sources: List[Dict], mode: str = "fallback",
                               manual_name: Optional[str] = None,
                               history: Optional[List[Dict[str, str]]] = None,
                               timeout: int = QUERY_TIMEOUT) -> str:
        try:
            client = await self._get_groq_client()
            context = "\n\n".join([f"Source {i+1}:\n{s['text']}" for i, s in enumerate(sources[:3])])
            device_info = f"Current device: {manual_name}" if manual_name else "Current device: (Unknown)"

            if mode == "strong":
                instruction = f"Use ONLY the provided manual context. If the answer is not in the context, return ONLY the token: {NULL_RESPONSE_TOKEN}. Do NOT guess."
            elif mode == "partial":
                instruction = f"Try to answer from context. If highly uncertain, return: {NULL_RESPONSE_TOKEN}."
            else:
                return FALLBACK_SUPPORT_MSG

            prompt = f"""### TASK
You are a strict technical support AI. Use the context to answer. If unsure, say you don't know.

### CONTEXT
{context}

### INSTRUCTIONS
- {instruction}
- Be precise and professional.

### QUERY
{question}

### RESPONSE:"""

            messages = [{"role": "system", "content": "You are a helpful assistant answering questions about appliance manuals. Be concise and accurate."}]
            if history:
                messages.extend(history[-6:])
            messages.append({"role": "user", "content": prompt})

            response = await asyncio.wait_for(
                asyncio.to_thread(lambda: client.chat.completions.create(
                    model=LLM_MODEL, messages=messages, temperature=0.3, max_tokens=600,
                )),
                timeout=timeout,
            )
            return response.choices[0].message.content.strip()
        except asyncio.TimeoutError:
            raise TimeoutErrorException("llm_generation", timeout)
        except Exception as e:
            raise RAGError(f"Failed to generate answer: {e}", retryable=True)

    async def _generate_secondary_info(self, question: str, sources: List[Dict],
                                       manual_name: Optional[str] = None, mode: str = "fallback",
                                       timeout: int = QUERY_TIMEOUT) -> Dict[str, Any]:
        try:
            client = await self._get_secondary_groq_client()
            if not client:
                return {}
            context = "\n\n".join([f"Context {i+1}:\n{s['text']}" for i, s in enumerate(sources[:3])]) if sources else "No context."
            device_info = f"Device: {manual_name}" if manual_name else ""
            spec = "Generate ONLY generic safe troubleshooting steps." if mode == "fallback" else "Use manual context for specific steps."

            prompt = f"""You are a repair assistant. {device_info}
{spec}
Return ONLY valid JSON: {{"steps":[{{"step":1,"title":"...","description":"...","warning":"..."}}],"severity":"minor|moderate|critical","cost":{{"diy":"$X","professional":"$Y"}}}}
Context: {context}
Query: {question}"""

            response = await asyncio.wait_for(
                asyncio.to_thread(lambda: client.chat.completions.create(
                    model=LLM_MODEL_SECONDARY, messages=[{"role": "user", "content": prompt}],
                    temperature=0.1, max_tokens=800,
                )),
                timeout=timeout,
            )
            content = response.choices[0].message.content.strip()
            info = self._extract_json(content)
            return info if isinstance(info, dict) else {}
        except Exception as e:
            self.logger.error(f"Secondary info error: {e}")
            return {}

    def _construct_youtube_url(self, question: str, manual_name: Optional[str] = None) -> Optional[str]:
        q = question.lower()
        keywords = ['how to','fix','repair','replace','broken','not working','error','troubleshoot']
        if not any(k in q for k in keywords):
            return None
        appliance = manual_name or "appliance"
        return f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(f'{q} {appliance} fix repair')}"

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if match:
            try: return json.loads(match.group(1))
            except: pass
        match = re.search(r'(\{.*\})', text, re.DOTALL)
        if match:
            try: return json.loads(match.group(1))
            except: pass
        return None

    # ─── Image / Frame analysis (Gemini) ─────────────────────────────

    async def analyze_image(self, image_b64: str, manual_id: str,
                            manual_name: Optional[str] = None,
                            history: Optional[List[Dict[str, str]]] = None, top_k: int = 5) -> Dict[str, Any]:
        import google.generativeai as genai
        import PIL.Image, io, base64
        try:
            start_time = time.time()
            if not GEMINI_API_KEY:
                raise ServiceUnavailableError("gemini", "GEMINI_API_KEY not configured")
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            image_bytes = base64.b64decode(image_b64.split(",")[-1] if "," in image_b64 else image_b64)
            image = PIL.Image.open(io.BytesIO(image_bytes))
            prompt = "Describe the appliance repair technical problem shown in this image in one concise sentence."
            response = await asyncio.to_thread(model.generate_content, [prompt, image])
            extracted = response.text.strip()
            rag_response = await self.answer_question(manual_id=manual_id, manual_name=manual_name,
                                                      question=extracted, history=history, top_k=top_k)
            rag_response["extracted_problem"] = extracted
            rag_response["processing_time_ms"] = (time.time() - start_time) * 1000
            return rag_response
        except MLServiceException:
            raise
        except Exception as e:
            raise MLServiceException(ErrorType.RAG_ERROR, f"Failed to analyze image: {e}", retryable=True)

    async def analyze_frame(self, image_b64: str) -> Dict[str, Any]:
        import google.generativeai as genai
        import PIL.Image, io, base64
        try:
            if not GEMINI_API_KEY:
                raise ServiceUnavailableError("gemini", "GEMINI_API_KEY not configured")
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            image_bytes = base64.b64decode(image_b64.split(",")[-1] if "," in image_b64 else image_b64)
            image = PIL.Image.open(io.BytesIO(image_bytes))
            prompt = '''You are an appliance repair assistant. Look at this image and identify any visible issue.
Return ONLY JSON: {"issue":"...or null","part":"...","severity":"minor|moderate|critical|none","suggested_query":"how to fix ..."}'''
            safety = [{"category": c, "threshold": "BLOCK_NONE"} for c in
                      ["HARM_CATEGORY_HARASSMENT","HARM_CATEGORY_HATE_SPEECH","HARM_CATEGORY_SEXUALLY_EXPLICIT","HARM_CATEGORY_DANGEROUS_CONTENT"]]
            response = await asyncio.to_thread(lambda: model.generate_content([prompt, image], safety_settings=safety))
            try:
                raw = response.candidates[0].content.parts[0].text.strip() if response.candidates else response.text.strip()
            except (ValueError, AttributeError, IndexError):
                raise MLServiceException(ErrorType.SERVICE_UNAVAILABLE, "Vision analysis unavailable.", retryable=True)
            result = self._extract_json(raw)
            if not result:
                return {"issue": None, "part": "unknown", "severity": "none", "suggested_query": None}
            return result
        except MLServiceException:
            raise
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                raise MLServiceException(ErrorType.SERVICE_UNAVAILABLE, "AI limit reached. Try again.", retryable=True)
            raise MLServiceException(ErrorType.INTERNAL_ERROR, f"Frame analysis error: {e}", retryable=True)
