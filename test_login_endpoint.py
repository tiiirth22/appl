import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_login():
    url = "http://localhost:8000/api/auth/login"
    payload = {"email": "test@example.com", "password": "password"}
    
    async with httpx.AsyncClient() as client:
        # Test POST
        try:
            response = await client.post(url, json=payload)
            print(f"POST {url} -> Status: {response.status_code}")
        except Exception as e:
            print(f"POST {url} -> Error: {e}")
            
        # Test GET (should be 405)
        try:
            response = await client.get(url)
            print(f"GET {url} -> Status: {response.status_code}")
        except Exception as e:
            print(f"GET {url} -> Error: {e}")

        # Test OPTIONS
        try:
            response = await client.options(url)
            print(f"OPTIONS {url} -> Status: {response.status_code}")
        except Exception as e:
            print(f"OPTIONS {url} -> Error: {e}")

if __name__ == "__main__":
    import asyncio
    # Note: This requires the server to be running.
    # Since I can't start the server and keep it running for the script,
    # I'll instead just check the router inclusion once more.
    pass
