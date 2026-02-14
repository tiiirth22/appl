---
description: Setup and verify the RAG environment (Qdrant, Ollama, Embeddings)
---
1. **Ensure Prerequisites**:
   - Install Python dependencies: `pip install -r backend/requirements.txt`
   - Install Ollama: [Download Ollama](https://ollama.com/)
   - Pull the Llama model: `ollama pull llama3.1`

2. **Verify Environment Variables**:
   - Check `backend/.env` for:
     - `QDRANT_URL`
     - `QDRANT_API_KEY`
     - `OLLAMA_BASE_URL` (default: http://localhost:11434)

// turbo
3. **Run Diagnostic Script**:
   It is recommended to run the diagnostic script to check connections.
   ```bash
   python backend/test_rag_setup.py
   ```

4. **Start Backend**:
   - Navigate to `backend` directory: `cd backend`
   - Run the server: `uvicorn server:app --reload`
