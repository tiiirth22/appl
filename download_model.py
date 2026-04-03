from sentence_transformers import SentenceTransformer
import os
import sys

def download_model():
    model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    print(f"Downloading model: {model_name}...")
    try:
        model = SentenceTransformer(model_name)
        print("Model downloaded successfully!")
    except Exception as e:
        print(f"Error downloading model: {e}")
        sys.exit(1)

if __name__ == "__main__":
    download_model()
