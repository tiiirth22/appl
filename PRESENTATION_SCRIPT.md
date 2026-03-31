# ApplianceIQ RAG Engine - Presentation Script (30 mins)

## ⏱️ TIME ALLOCATION
- **0-2 min**: Intro + Project Overview
- **2-8 min**: LIVE DEMO (Frontend + Show RAG Working)
- **8-18 min**: TECHNICAL DEEP DIVE (RAG Engine + Vector DB)
- **18-25 min**: Code Walkthrough + Architecture
- **25-30 min**: Future Scope & Scalability Roadmap

---

## 📊 SECTION 1: INTRODUCTION (2 minutes)

### Opening Statement
"Hi everyone! Today I'm going to walk you through **ApplianceIQ** – a RAG-based appliance manual management system that leverages retrieval-augmented generation to provide intelligent Q&A on appliance manuals.

The problem we're solving: Users have physical manuals but can't easily search through them. We're making them AI-searchable with instant answers powered by vector embeddings and LLMs."

### What You'll See Today
1. ✅ Live demo of the frontend – uploading a manual and asking questions
2. 📊 Pinecone vector database in action – showing semantic search
3. 🔧 Technical breakdown of our RAG pipeline
4. 🚀 Future scalability improvements we're building

---

## 🎬 SECTION 2: LIVE DEMO (6 minutes)

### DEMO FLOW
**TIME: 2-8 MINUTES**

#### 2.1 Frontend Demo (3 minutes)
**TALKING POINTS:**
- "Let me show you the user experience first. Here's our React frontend..."
- Open browser → http://localhost:3000
- Navigate to **Dashboard** or **Manual Upload** page

**SHOW:**
1. **Upload Page**
   - Click "Upload Manual" button
   - Select a sample PDF/image (appliance manual)
   - Point out: "We accept PDFs and images. The system automatically converts images to text using OCR."
   - Show upload progress
   - Manual is now visible in the library

2. **Chat Interface**
   - Open the uploaded manual in chat
   - Type questions like:
     - "How do I reset the washing machine?"
     - "What's the warranty period?"
     - "How do I clean the filter?"
   - Show real-time answers appearing
   - **HIGHLIGHT:** "These answers are AI-generated based on the actual manual content using semantic search"

#### 2.2 Show Vector DB Results (2 minutes)
**TALKING POINTS:**
- "Behind the scenes, here's what's happening..."
- Open **MongoDB Atlas** or show terminal logs
- Show Pinecone dashboard (if available)
  - Navigate to Pinecone -> Project -> Indexes
  - Show the "appliance-manuals" index
  - Show number of vectors/embeddings stored
  - Show namespace structure (organized by manual_id for isolation)

**KEY POINTS:**
- "Each manual is chunked into smaller pieces (512 tokens)"
- "Each chunk gets converted to a 384-dimensional embedding vector"
- "These vectors are stored in Pinecone for ultra-fast semantic search"
- "When you ask a question, we search for the top-3 most relevant chunks and feed them to the LLM"

---

## 🔧 SECTION 3: TECHNICAL DEEP DIVE - RAG ENGINE + VECTOR DB (10 minutes)

### 3.1 What is RAG? (1 minute)

**TALKING POINTS:**
"RAG stands for Retrieval-Augmented Generation. Traditional LLMs have a knowledge cutoff – they can't know about your specific manual. RAG solves this by:

1. **Retrieving** relevant chunks from your documents (using vector similarity)
2. **Augmenting** the LLM prompt with these chunks for context
3. **Generating** an answer specific to your manual"

**DIAGRAM (draw on screen or show):**
```
User Question
    ↓
Convert to Embedding (384-dim vector)
    ↓
Search Pinecone (cosine similarity)
    ↓
Get Top-3 Relevant Chunks
    ↓
Build Prompt: "Context: [chunks] | Question: [user question]"
    ↓
Send to Ollama LLM (llama3.1)
    ↓
Stream Response
```

### 3.2 The RAG Pipeline - Deep Technical Dive (5 minutes)

#### PHASE 1: DOCUMENT INGESTION
**SHOW CODE** (Point to backend/ingestion.py):
```python
class DocumentProcessor:
    def __init__(self, pinecone_client: Pinecone):
        self.pc = pinecone_client
        self.embedding_model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2"
        )
    
    async def process_manual(self, file_path: str, manual_id: str):
        # Step 1: Extract text
        text = self._extract_text_from_pdf(file_path)  # or OCR for images
        
        # Step 2: Chunk the text
        chunks = self._chunk_text(text, chunk_size=512, overlap=50)
        
        # Step 3: Generate embeddings
        embeddings = self.embedding_model.encode(chunks)
        
        # Step 4: Store in Pinecone
        vectors = [
            (f"{manual_id}_{i}", embedding, {"text": chunk, "manual_id": manual_id})
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
        ]
        self.index.upsert(vectors)
```

**TALKING POINTS:**
- "When a user uploads a PDF, we extract all text (handles PDF + images with OCR)"
- "Then we chunk the text into overlapping 512-token chunks – overlap helps maintain context"
- "Each chunk is converted to an embedding using sentence-transformers model"
- "The embedding is a 384-dimensional vector that captures the semantic meaning"
- "We store it in Pinecone with metadata (the actual text and manual_id for filtering)"

#### PHASE 2: RETRIEVAL AT QUERY TIME
**SHOW CODE** (Point to backend/rag.py):
```python
class RAGEngine:
    async def retrieve_context(self, query: str, manual_id: str, top_k: int = 3):
        # Step 1: Convert query to embedding
        query_embedding = self.embedding_model.encode(query)
        
        # Step 2: Search Pinecone with manual_id filter
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            filter={"manual_id": {"$eq": manual_id}},
            include_metadata=True
        )
        
        # Step 3: Extract text from results
        context_chunks = [
            match["metadata"]["text"] 
            for match in results["matches"]
        ]
        
        return "\n\n".join(context_chunks)
```

**TALKING POINTS:**
- "When user asks a question, we immediately convert it to the same 384-dim embedding"
- "We search Pinecone for the top-3 most similar vectors (using cosine similarity)"
- "Crucially: we filter by manual_id to ensure we only search within that specific manual"
- "This gives us the top-3 most relevant chunks from the entire manual"

#### PHASE 3: GENERATION
**SHOW CODE**:
```python
async def answer_question(self, query: str, manual_id: str):
    # Retrieve context
    context = await self.retrieve_context(query, manual_id)
    
    # Build prompt
    prompt = f"""You are a helpful appliance assistant. 
    
Context from manual:
{context}

User Question: {query}

Answer based ONLY on the context above."""
    
    # Call Ollama LLM
    response = httpx.post(
        f"{self.ollama_base_url}/api/generate",
        json={"model": "llama3.1", "prompt": prompt, "stream": True},
        timeout=None
    )
    
    # Stream response
    for line in response.iter_lines():
        yield line
```

**TALKING POINTS:**
- "We take the retrieved context and build a prompt with the user's question"
- "This prompt goes to Ollama running llama3.1 locally (no API calls, fully private)"
- "The LLM generates an answer grounded in the manual context"
- "We stream the response back to the frontend in real-time (UI shows it character-by-character)"

### 3.3 Vector Database: Why Pinecone? (2 minutes)

**TALKING POINTS:**
"Traditional databases search using exact keyword matching. Vector databases are different:

- **Semantic Search**: We find conceptually similar content, not just keyword matches
- **Example**: If manual says 'press the reset button', and user asks 'how do I restart?', traditional DB fails but vector DB finds it (semantically similar)

**Why Pinecone specifically?**
1. **Managed Service**: No server maintenance – Pinecone handles scaling
2. **Namespaces**: Each manual gets its own namespace (appliance-manuals#manual_id_123)
3. **Metadata Filtering**: Filter by manual_id to isolate user data
4. **Low Latency**: Returns results in <100ms even with millions of vectors
5. **Cost-Efficient**: Pay only for what you store + queries
6. **Serverless**: Auto-scales with demand"

**ARCHITECTURE DIAGRAM (show/draw):**
```
Pinecone Index: "appliance-manuals"
├── Namespace: manual_123
│   ├── Vector 1: [0.23, 0.45, ...384 dims] + {text: "Reset instructions...", manual_id: "manual_123"}
│   ├── Vector 2: [0.12, 0.67, ...384 dims] + {text: "Warranty info...", manual_id: "manual_123"}
│   └── Vector N: ...
├── Namespace: manual_456
│   └── Vector X: ...
```

---

## 💻 SECTION 4: FULL ARCHITECTURE & CODE WALKTHROUGH (7 minutes)

### 4.1 Architecture Overview (2 minutes)

**SHOW CODE STRUCTURE:**

```
Backend (FastAPI)
├── server.py (REST API endpoints)
├── auth.py (OAuth + session management)
├── ingestion.py (DocumentProcessor for chunking + embedding)
├── rag.py (RAGEngine for retrieval + generation)
├── models.py (Pydantic schemas)
└── qr_handler.py (QR code generation)

Database Layer
├── MongoDB (user data + manual metadata)
└── Pinecone (vector embeddings + semantic search)

Frontend (React)
├── ChatBot.js (main chat interface)
├── ManualUpload.js (upload interface)
└── Dashboard.js (manual library)

LLM Layer
└── Ollama (llama3.1 running locally)
```

**TALKING POINTS:**
"Our system is modular. Each component has a single responsibility:
- **API Layer handles requests** → **Ingestion processes documents** → **RAG retrieves + generates** → **Vectors stored in Pinecone**"

### 4.2 Key Endpoints Walkthrough (3 minutes)

**SHOW IN CODE (backend/server.py):**

```python
# 1. UPLOAD ENDPOINT
@app.post("/api/manuals/upload")
async def upload_manual(file: UploadFile, current_user = Depends(get_current_user)):
    # Save file to /tmp/
    file_path = f"/tmp/{file.filename}"
    
    # Process with DocumentProcessor
    processor = DocumentProcessor(pinecone_index)
    await processor.process_manual(file_path, manual_id=str(uuid.uuid4()))
    
    # Store metadata in MongoDB
    manual = Manual(filename=file.filename, user_id=current_user.id, ...)
    db.manuals.insert_one(manual.model_dump())
    
    return {"status": "success", "manual_id": manual.id}

# 2. CHAT ENDPOINT
@app.post("/api/chat")
async def chat(request: ChatRequest, current_user = Depends(get_current_user)):
    rag = RAGEngine(pinecone_index)
    
    # Stream response
    async def generate():
        async for chunk in rag.answer_question(request.query, request.manual_id):
            yield chunk
    
    return StreamingResponse(generate())

# 3. RETRIEVE ENDPOINT (for debugging)
@app.post("/api/retrieve")
async def retrieve(query: str, manual_id: str):
    rag = RAGEngine(pinecone_index)
    context = await rag.retrieve_context(query, manual_id)
    return {"context": context}
```

**TALKING POINTS:**
- "Upload endpoint: Saves the file, processes it with our DocumentProcessor, stores metadata in MongoDB"
- "Chat endpoint: Uses RAGEngine to retrieve context and generate streaming responses"
- "Retrieve endpoint: Shows exactly what context chunks the RAG is using (useful for debugging)"

### 4.3 Data Flow Example (2 minutes)

**SCENARIO: User uploads a washing machine manual and asks "How do I clean the filter?"**

```
1. Frontend: User selects PDF file → Click Upload
   ↓
2. Backend POST /api/manuals/upload
   └─ DocumentProcessor.process_manual()
      ├─ Extract text: "To clean the filter, press eject button..."
      ├─ Chunk text: ["To clean the filter...", "Press eject button...", ...]
      ├─ Embed: each chunk → 384-dim vector
      └─ Pinecone upsert: Store vectors with manual_id namespace
   ↓
3. MongoDB: Insert manual record + user_id + filename
   ↓
4. Frontend: Shows "Manual uploaded successfully!"

---

5. Frontend: User types question in chat: "How do I clean the filter?"
   ↓
6. Backend POST /api/chat
   └─ RAGEngine.answer_question()
      ├─ Embed question: "How do I clean the filter?" → 384-dim vector
      ├─ Pinecone query (filtered by manual_id): Get top-3 similar chunks
      │  └─ Result 1: "To clean the filter, press eject button and remove mesh..."
      │  └─ Result 2: "Clean filter weekly for best performance..."
      │  └─ Result 3: "Replace filter yearly or more if water is hard..."
      ├─ Build prompt: "Context: [chunks above]\nQuestion: How do I clean the filter?"
      ├─ Ollama /api/generate: Call llama3.1 with prompt
      └─ Stream response: "Based on the manual, to clean the filter: 1. Press eject button..."
   ↓
7. Frontend: Display streamed response character-by-character
```

---

## 🚀 SECTION 5: FUTURE SCOPE & SCALABILITY (5 minutes)

### Problem: Current Limitations
"Our current system works great for demos, but at scale we face:
- 🔴 Repeated embedding calculations waste compute (same question = re-embed)
- 🔴 Inflexible chunking (512 tokens for all docs - bad for some types)
- 🔴 Response feels slow without streaming (LLM generates but we buffer first)
- 🔴 No visibility into what's happening (black box)
- 🔴 No rate limits (one user could crash the system)"

### FEATURE 1: 🟠 EMBEDDING CACHE
**Problem**: User asks same question twice → We re-embed and re-search

**Solution**:
```python
class EmbeddingCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = 3600  # 1 hour
    
    async def get_embedding(self, query: str):
        cache_key = f"embedding:{hashlib.md5(query.encode()).hexdigest()}"
        cached = await self.redis.get(cache_key)
        
        if cached:
            return np.frombuffer(cached, dtype=np.float32)
        
        # Not cached, compute it
        embedding = self.embedding_model.encode(query)
        
        # Store in Redis for 1 hour
        await self.redis.set(
            cache_key, 
            embedding.tobytes(), 
            ex=self.ttl
        )
        
        return embedding
```

**Benefits**: ✅ 10-100x faster for repeated queries | ✅ Reduced CPU load | ✅ Lower latency

**Implementation**: Add Redis to backend, wrap embedding calls with cache layer

---

### FEATURE 2: 🟡 CHUNKING STRATEGY AT INGESTION
**Problem**: Fixed 512-token chunks don't fit all content
- Technical manuals need longer context
- Quick-reference guides need smaller chunks
- Some sections are hierarchical

**Solution**:
```python
class AdaptiveChunker:
    def __init__(self):
        self.strategies = {
            "technical": {"size": 1024, "overlap": 100},  # Longer chunks
            "guide": {"size": 256, "overlap": 25},         # Shorter chunks
            "hierarchical": ChunkerBySection               # Split by headers
        }
    
    async def chunk_document(self, text: str, doc_type: str):
        if doc_type in self.strategies:
            if callable(self.strategies[doc_type]):
                return self.strategies[doc_type](text)
            else:
                cfg = self.strategies[doc_type]
                return self._chunk_sliding_window(
                    text, 
                    size=cfg["size"], 
                    overlap=cfg["overlap"]
                )

# Usage in DocumentProcessor
processor = AdaptiveChunker()
chunks = await processor.chunk_document(manual_text, doc_type="technical")
```

**Benefits**: ✅ Better context preservation | ✅ Fewer irrelevant chunks | ✅ Improved answer quality

**Implementation**: 
1. Ask users to specify manual type on upload
2. Or auto-detect using LLM
3. Apply appropriate strategy

---

### FEATURE 3: 🟠 LLM RESPONSE STREAMING
**Current**: We wait for entire LLM response, then send to frontend
**Problem**: If generation takes 10 seconds, user waits 10 seconds with no feedback

**Solution** (we partially have this):
```python
@app.post("/api/chat")
async def chat(request: ChatRequest):
    rag = RAGEngine(pinecone_index)
    
    async def response_generator():
        async for chunk in rag.answer_question(request.query, request.manual_id):
            # Stream each token instantly
            yield f"data: {json.dumps({'token': chunk})}\n\n"
    
    return StreamingResponse(response_generator(), media_type="text/event-stream")
```

**Frontend**:
```javascript
const response = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({...}) });
const reader = response.body.getReader();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = new TextDecoder().decode(value);
    setAnswerText(prev => prev + text);  // Update character-by-character
}
```

**Benefits**: ✅ Perceived speed improvement | ✅ Real-time token visibility | ✅ Users feel responsiveness

**Implementation**: Already mostly there – just ensure frontend renders streaming properly

---

### FEATURE 4: 🟢 OBSERVABILITY – TRACE EVERY RAG CALL
**Current**: If answer is wrong, we don't know why
**Problem**: Was it the retrieval? The chunks? The LLM? The prompt?

**Solution** (Distributed Tracing):
```python
from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.grpc import trace_exporter
from opentelemetry.sdk.trace import TracerProvider

tracer = trace.get_tracer(__name__)

async def answer_question_with_tracing(self, query: str, manual_id: str):
    with tracer.start_as_current_span("rag_answer_question") as span:
        span.set_attribute("query", query)
        span.set_attribute("manual_id", manual_id)
        
        # Trace retrieval
        with tracer.start_as_current_span("retrieval") as ret_span:
            context = await self.retrieve_context(query, manual_id)
            ret_span.set_attribute("chunks_retrieved", len(context.split("\n\n")))
            ret_span.set_attribute("context_length", len(context))
        
        # Trace generation
        with tracer.start_as_current_span("generation") as gen_span:
            async for chunk in self._generate_with_ollama(context, query):
                yield chunk
            gen_span.set_attribute("response_complete", True)

# Export to Jaeger or Grafana Tempo for visualization
```

**In Jaeger Dashboard**, we see:
```
RAG Answer Question (100ms total)
├── Query Embedding (5ms)
├── Pinecone Retrieval (15ms) ← Was this slow?
│   └─ Retrieved 3 chunks, 2.5KB context
├── Prompt Building (1ms)
├── Ollama Generation (79ms) ← LLM was slow
│   └─ Generated 125 tokens
└─ Stream Complete
```

**Benefits**: ✅ Debug performance bottlenecks | ✅ Identify slow operations | ✅ Track quality issues

**Implementation**:
1. Install OpenTelemetry: `pip install opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp`
2. Set up Jaeger: `docker run -p 16686:16686 jaegertracing/all-in-one`
3. Wrap RAG calls with tracing spans

---

### FEATURE 5: 🟡 RATE LIMITING PER TENANT
**Current**: Anyone can spam requests and crash the system
**Problem**: One malicious user → entire system down

**Solution** (Per-tenant rate limiting):
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# Per-user rate limit: 30 requests per minute
@app.post("/api/chat")
@limiter.limit("30/minute")
async def chat(request: ChatRequest, current_user = Depends(get_current_user)):
    # Additional per-tenant tier-based limits
    user_tier = current_user.subscription_tier  # "free", "pro", "enterprise"
    
    tier_limits = {
        "free": {"rpm": 10, "daily": 100},
        "pro": {"rpm": 100, "daily": 10000},
        "enterprise": {"rpm": 1000, "daily": 100000}
    }
    
    # Check Redis counter
    redis_key = f"rate_limit:{current_user.id}:rpm"
    current_count = await redis.incr(redis_key)
    
    if current_count == 1:
        await redis.expire(redis_key, 60)  # Reset every 60 seconds
    
    if current_count > tier_limits[user_tier]["rpm"]:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. {user_tier} plan allows {tier_limits[user_tier]['rpm']} requests/minute"
        )
    
    # Process request...
    rag = RAGEngine(pinecone_index)
    return await rag.answer_question(request.query, request.manual_id)

# Also rate limit upload endpoint (prevent disk spam)
@app.post("/api/manuals/upload")
@limiter.limit("10/hour")  # 10 uploads per hour per user
async def upload_manual(file: UploadFile, current_user = Depends(get_current_user)):
    # Process...
```

**Benefits**: ✅ Prevent abuse | ✅ Fair resource allocation | ✅ Tier-based monetization

**Implementation**:
1. Install slowapi: `pip install slowapi`
2. Add Redis for distributed rate limiting: `pip install redis`
3. Define tier-based limits in database
4. Wrap endpoints with @limiter.limit()

---

### IMPLEMENTATION ROADMAP

**Phase 1 (Week 1)**: 
- [ ] Embedding Cache + Redis
- [ ] Observability setup (Jaeger)

**Phase 2 (Week 2)**:
- [ ] Adaptive Chunking Strategy
- [ ] Rate Limiting per Tenant

**Phase 3 (Week 3)**:
- [ ] Advanced streaming optimization
- [ ] Multi-modal support (video manuals)

**Phase 4 (Production)**:
- [ ] Performance optimization (batch embeddings)
- [ ] Cost optimization (Pinecone tier selection)
- [ ] Advanced analytics dashboard

---

## 📝 CLOSING STATEMENT (1 minute)

"So to recap:

1. **Today you saw**: RAG in action - uploading a manual and getting instant, accurate answers
2. **Under the hood**: Semantic search powered by embeddings, vector databases, and LLMs
3. **The future**: With caching, adaptive chunking, streaming, observability, and rate limiting, we're building a scalable, production-ready system

The key insight: RAG lets us take specialized knowledge (appliance manuals) and make it instantly searchable with AI. As we implement these scaling features, we'll be ready for millions of users and terabytes of manual data.

**Questions?**"

---

## 🎪 QUICK REFERENCE DURING PRESENTATION

### If Demo Breaks
- **Backend not responding**: Check `uvicorn server:app --reload`
- **Pinecone failing**: Check API key in `.env`
- **LLM not working**: Check `ollama serve` is running on localhost:11434
- **Frontend not loading**: Check `npm start` on port 3000

### Key Stats to Mention
- Embedding Model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)
- Chunk Size: 512 tokens with 50-token overlap
- Retrieval Top-K: 3 chunks per query
- LLM Model: Ollama llama3.1 (fully local, no API calls)
- Pinecone Latency: <100ms for semantic search
- Streaming Response: Real-time token generation

### Code Snippets to Show
1. **Embedding generation** (ingestion.py, line ~40-50)
2. **Pinecone retrieval** (rag.py, line ~60-75)
3. **Chat endpoint** (server.py, line ~150-170)
4. **Chunk extraction** (ingestion.py, line ~80-95)

---

## 🎯 PRESENTER TIPS

✅ **DO:**
- Start with the live demo to grab attention
- Use analogies ("like Google, but for YOUR documents")
- Show the Pinecone dashboard live if possible
- Have terminal open to show logs/embeddings
- Emphasize the privacy angle (local LLM, no cloud)

❌ **DON'T:**
- Get too deep into math (skip cosine similarity details unless asked)
- Live code during presentation (pre-demo code)
- Assume audience knows what embeddings are (explain simply: "numbers that represent meaning")
- Forget to mention it's fully local/private

---

## 📊 PRESENTATION FLOW VISUAL

```
START (0 min)
│
├─ Intro & Problem (1 min)
│
├─ LIVE DEMO (6 mins)
│  ├─ Frontend upload+chat walkthrough (3 mins) ← PRODUCT DEMO
│  └─ Show Pinecone DB & vectors (2 mins)      ← TECH DEMO
│
├─ TECHNICAL DEEP DIVE (7 mins)
│  ├─ What is RAG? (1 min)
│  ├─ Ingestion → Retrieval → Generation pipeline (5 mins)
│  └─ Why Pinecone? (1 min)
│
├─ ARCHITECTURE CODE WALKTHROUGH (7 mins)
│  ├─ System architecture overview (2 mins)
│  ├─ Key API endpoints (3 mins)
│  └─ Full data flow example (2 mins)
│
├─ FUTURE SCOPE & SCALABILITY (5 mins)
│  ├─ Embedding Cache 🟠
│  ├─ Adaptive Chunking 🟡
│  ├─ Streaming 🟠
│  ├─ Observability 🟢
│  └─ Rate Limiting 🟡
│
├─ Closing + Questions (1 min)
│
END (30 mins)
```

---

**Good luck with your presentation! 🚀**
