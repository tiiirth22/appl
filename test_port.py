import socket

def check_port(ip, port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2)
    try:
        s.connect((ip, port))
        print(f"SUCCESS: Port {port} is OPEN on {ip}")
        return True
    except Exception as e:
        print(f"FAILED: Port {port} is CLOSED on {ip}. Error: {e}")
        return False
    finally:
        s.close()

if __name__ == "__main__":
    print("--- ApplianceIQ Port Diagnostic ---")
    check_port("127.0.0.1", 8000) # Backend
    check_port("127.0.0.1", 8001) # ML Service
