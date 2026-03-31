import os
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

class RAGEvaluator:
    """Evaluates RAG pipeline safety and accuracy."""
    
    def __init__(self, groq_client=None):
        self.groq = groq_client
        self.db_client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        self.db = self.db_client.applianceiq_db

    async def evaluate_faithfulness(self, question: str, context: str, answer: str) -> Dict[str, Any]:
        """Verify the answer is grounded ONLY in the context. (Metric 1)"""
        if not self.groq: return {"score": 0, "reason": "Evaluator LLM not available"}
        
        prompt = f"""EVALUATION TASK:
CONTEXT: {context}
QUESTION: {question}
ANSWER: {answer}

Verify if the ANSWER is faithful to the CONTEXT.
1. Does the answer contain facts not in the context?
2. Does it contradict the context?
3. Is it a hallucination?

Output JSON: {{"faithfulness_score": 0.0-1.0, "reasoning": "..."}}"""
        
        try:
            res = self.groq.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                response_format={ "type": "json_object" }
            )
            import json
            return json.loads(res.choices[0].message.content)
        except Exception as e:
            return {"score": 0, "error": str(e)}

    async def run_audit(self, limit: int = 5):
        """Run an audit on the latest N RAG traces."""
        print(f"\n--- RAG Safety Audit (Last {limit} queries) ---")
        cursor = self.db.rag_traces.find().sort("timestamp", -1).limit(limit)
        async for trace in cursor:
            # We need to associate the 'answer' which was streamed and saved in a 'queries' collection
            query_doc = await self.db.queries.find_one({"question": trace["question"]}, sort=[("created_at", -1)])
            
            if not query_doc:
                print(f"[SKIP] No final answer found for question: {trace['question']}")
                continue

            print(f"\nQuestion: {trace['question']}")
            score = await self.evaluate_faithfulness(trace['question'], trace['full_context'], query_doc['answer'])
            print(f"Faithfulness Score: {score.get('faithfulness_score')}")
            print(f"Reason: {score.get('reasoning')}")

if __name__ == "__main__":
    import asyncio
    from groq import Groq
    
    async def main():
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        evaluator = RAGEvaluator(client)
        await evaluator.run_audit()
    
    asyncio.run(main())
