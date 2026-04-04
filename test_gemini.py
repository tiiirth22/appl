import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load from backend/.env
env_path = Path("backend/.env")
load_dotenv(env_path)

api_key = os.getenv("GEMINI_API_KEY")
print(f"Testing Gemini API Key: {api_key[:10]}...")

if not api_key:
    print("ERROR: GEMINI_API_KEY not found in backend/.env")
    exit(1)

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello, system check. Are you online?")
    print("\nSUCCESS!")
    print(f"Gemini Response: {response.text}")
except Exception as e:
    print("\nFAILED!")
    print(f"Error details: {str(e)}")
