import requests
import json

url = "http://localhost:8001/query"
# Use the manual_id found in Pinecone root namespace
data = {
    "manual_id": "e0fe862d-7c29-41d6-8a54-0ada1bd017fa",
    "question": "What is this about?",
    "top_k": 5
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
