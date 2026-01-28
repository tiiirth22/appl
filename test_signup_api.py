import requests
import json

def test_signup():
    url = "http://localhost:8000/api/auth/signup"
    payload = {
        "email": "test-new-user@test.com",
        "name": "Test User",
        "password": "Password123!",
        "role": "business_owner"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_signup()
