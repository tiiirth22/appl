# ApplianceIQ Copilot Instructions

## Project Overview
ApplianceIQ is a RAG-based appliance manual management system with FastAPI backend and React frontend. Users upload appliance manuals (PDFs/images), which get processed into vector embeddings for AI-powered Q&A via chat interface. QR codes enable easy mobile access to manual chats.

## Architecture
- **Backend**: FastAPI with MongoDB (user/manual data) + Qdrant (vector search)
- **Frontend**: React 19 with Radix UI components
- **RAG Pipeline**: Document ingestion → chunking → embeddings → Qdrant storage → retrieval + Ollama generation
- **Auth**: OAuth sessions with MongoDB-stored user sessions

## Key Components
- `backend/server.py`: Main FastAPI app with REST endpoints
- `backend/rag.py`: RAG engine using sentence-transformers + Ollama/llama3.1
- `backend/ingestion.py`: Document processing (PDF/image → text chunks)
- `backend/auth.py`: OAuth session management
- `backend/qr_handler.py`: QR code generation/verification with crypto signatures
- `backend/models.py`: Pydantic models for all data structures
- `frontend/src/App.js`: React routing with auth-protected pages

## Data Flow
1. User uploads manual via `/api/manuals/upload`
2. `DocumentProcessor.process_manual()` extracts text, chunks it, generates embeddings
3. Chunks stored in Qdrant with `manual_id` filter for isolation
4. QR code generated and stored in MongoDB
5. Chat queries use `RAGEngine.answer_question()`: retrieve relevant chunks → generate answer via Ollama

## Developer Workflows

### Backend Development
```bash
cd backend
pip install -r requirements.txt
# Set up environment variables in .env (MongoDB, Qdrant, Ollama URLs)
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

### Full Stack Development
- Backend serves API on port 8000, frontend proxies API calls
- CORS configured via `CORS_ORIGINS` env var
- Auth flow: OAuth redirect → session processing → cookie-based auth

## Configuration Patterns
- Environment variables loaded from `backend/.env`
- MongoDB connection: `motor.motor_asyncio.AsyncIOMotorClient`
- Qdrant client initialized conditionally (fails gracefully if not configured)
- Ollama integration for local LLM inference (default: llama3.1 on localhost:11434)

## Code Patterns
- **Async everywhere**: All DB operations use `await` (Motor async client)
- **Pydantic models**: All data structures use Pydantic v2 with `model_config`
- **Error handling**: HTTPExceptions for API errors, logging for internal errors
- **Document processing**: Files saved to `/tmp/`, processed asynchronously
- **Vector search**: Filtered by `manual_id` to isolate user data
- **QR security**: Payloads signed with HMAC-SHA256 for integrity

## Testing
- Backend tests in `tests/` directory (currently minimal)
- Frontend uses Create React App test runner (`npm test`)

## Deployment Considerations
- Requires MongoDB, Qdrant, and Ollama services
- Document files stored temporarily in `/tmp/` (consider cloud storage for production)
- QR codes use short URLs for mobile-friendly access
- Analytics track query patterns and user feedback

## Common Development Tasks
- **Adding new manual types**: Extend `DocumentProcessor` for new file formats
- **Modifying RAG prompts**: Update prompt templates in `RAGEngine.generate_answer()`
- **New API endpoints**: Add to `server.py` with proper auth dependencies
- **UI components**: Use existing Radix UI patterns from `frontend/src/components/ui/`
- **Database schema changes**: Update Pydantic models and migration logic