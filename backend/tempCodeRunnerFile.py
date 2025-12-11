import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)

# --- CONFIGURATION ---
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- 1. MEMORY STORAGE ---
# Holds latest sensor data
latest_sensor_data = {
    "N": 0, "P": 0, "K": 0,
    "temperature": 0, "humidity": 0,
    "ph": 0, "rainfall": 0
}

# Holds the Master Switch state (False = Stop, True = Start)
is_scanning = False

# --- 2. EXISTING ROUTES (User) ---
@app.route('/api/user', methods=['GET'])
def get_user():
    return jsonify({"username": "Developer", "email": "dev@bmsit.in"}), 200

# --- 3. CONTROL ROUTES (The "Start Button" Logic) ---

# Website -> Server: "Start the machine!"
@app.route('/api/toggle-scan', methods=['POST'])
def toggle_scan():
    global is_scanning
    data = request.json
    # Update the global switch based on what the website sent
    is_scanning = data.get('scanning', False)
    
    status = "STARTED" if is_scanning else "STOPPED"
    print(f"🤖 System Status: {status}")
    
    return jsonify({"status": status, "is_scanning": is_scanning}), 200

# ESP32 -> Server: "Should I move?"
@app.route('/api/check-command', methods=['GET'])
def check_command():
    # If is_scanning is True, tell ESP32 to "START"
    command = "START" if is_scanning else "STOP"
    return command, 200

# --- 4. SENSOR & IMAGE ROUTES ---

# ESP32 -> Server: "Here is the sensor data"
@app.route('/api/update-sensors', methods=['POST'])
def update_sensors():
    global latest_sensor_data
    try:
        data = request.json
        print(f"📡 Data from ESP32: {data}")
        latest_sensor_data.update(data)
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 400

# ESP32 -> Server: "Here is a photo"
@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    try:
        # Get raw bytes from request
        image_data = request.data
        if not image_data:
            return jsonify({"status": "error", "message": "No data received"}), 400
            
        # Save image (overwrites the previous one called 'field_capture.jpg')
        # In a real app, you might want to add a timestamp to the filename
        file_path = os.path.join(UPLOAD_FOLDER, 'field_capture.jpg')
        with open(file_path, 'wb') as f:
            f.write(image_data)
            
        print("📸 Image received and saved!")
        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"❌ Image save error: {e}")
        return jsonify({"status": "error"}), 500

# Website -> Server: "Give me the latest data"
@app.route('/api/get-sensor-data', methods=['GET'])
def get_sensor_data():
    return jsonify(latest_sensor_data), 200

# Website -> Server: "Predict Crop" (Placeholder)
@app.route('/api/crop-recommendation', methods=['POST'])
def recommend_crop():
    return jsonify({"recommended_crop": "Rice", "confidence": 0.95}), 200

if __name__ == '__main__':
    print("🚀 Server starting... ESP32 can connect to this IP.")
    app.run(host='0.0.0.0', port=5000, debug=True)