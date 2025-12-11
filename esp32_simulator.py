import time
import random
import requests
import sys

# CONFIGURATION
SERVER_URL = "http://localhost:5000/api"

def check_command():
    """Ask the server if we should be scanning"""
    try:
        response = requests.get(f"{SERVER_URL}/check-command")
        if response.status_code == 200:
            return response.text.strip()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to Backend. Is it running?")
        return "STOP"
    return "STOP"

def send_fake_data():
    """Generate random data and send it to the server"""
    # 1. Create Fake Data
    data = {
        "N": random.randint(10, 200),
        "P": random.randint(10, 200),
        "K": random.randint(10, 200),
        "humidity": 0,
        "temperature": 0,
        "ph": 6.5,
        "rainfall": 0
    }

    # 2. Send to Server
    try:
        response = requests.post(f"{SERVER_URL}/update-sensors", json=data)
        if response.status_code == 200:
            print(f"✅ Data Sent: N={data['N']} P={data['P']} K={data['K']}")
        else:
            print(f"⚠️ Server rejected data: {response.status_code}")
    except Exception as e:
        print(f"❌ Upload Failed: {e}")

def main():
    print("🤖 ESP32 Software Simulator Started")
    print(f"📡 Connecting to {SERVER_URL}...")
    print("------------------------------------------------")

    while True:
        # 1. Check Command
        command = check_command()

        if command == "START":
            print("🚀 Status: SCANNING... Sending data...")
            send_fake_data()
            time.sleep(200) # Send data every 2 seconds
        else:
            print("💤 Status: IDLE (Waiting for 'Start' on website)...")
            time.sleep(2) # Check again in 2 seconds

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Simulator Stopped")
        sys.exit(0)