import os
import requests 
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)

# --- CONFIGURATION ---
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- WEATHER API CONFIG ---
WEATHER_API_KEY = "Weather-api-key"
CITY = "Bengaluru"

# --- 1. MEMORY STORAGE ---
latest_sensor_data = {
    "N": 0, "P": 0, "K": 0,
    "temperature": 0, "humidity": 0,
    "ph": 0, "rainfall": 0
}

is_scanning = False

# --- 2. USER ROUTES ---
@app.route('/api/user', methods=['GET'])
def get_user():
    return jsonify({"username": "Developer", "email": "dev@bmsit.in"}), 200

# --- 3. CONTROL ROUTES ---
@app.route('/api/toggle-scan', methods=['POST'])
def toggle_scan():
    global is_scanning
    data = request.json
    is_scanning = data.get('scanning', False)
    status = "STARTED" if is_scanning else "STOPPED"
    print(f"🤖 System Status: {status}")
    return jsonify({"status": status, "is_scanning": is_scanning}), 200

@app.route('/api/check-command', methods=['GET'])
def check_command():
    command = "START" if is_scanning else "STOP"
    return command, 200

# --- 4. SENSOR & WEATHER ROUTE ---
@app.route('/api/update-sensors', methods=['POST'])
def update_sensors():
    global latest_sensor_data
    try:
        # 1. Get NPK from ESP32
        esp_data = request.json
        print(f"📡 NPK from ESP32: {esp_data}")
        
        # 2. Fetch REAL Weather
        try:
            print(f"☁️ Fetching weather for {CITY}...")
            weather_url = f"http://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={WEATHER_API_KEY}&units=metric"
            weather_res = requests.get(weather_url).json()
            
            if weather_res.get('cod') == 200:
                real_temp = weather_res['main']['temp']
                real_hum = weather_res['main']['humidity']
                real_rain = 0
                if 'rain' in weather_res:
                    real_rain = weather_res['rain'].get('1h', 0)
                
                print(f"✅ Real Weather: {real_temp}°C, {real_hum}%, Rain: {real_rain}mm")
                
                # 3. Overwrite ESP32 dummy values with REAL values
                esp_data['temperature'] = real_temp
                esp_data['humidity'] = real_hum
                esp_data['rainfall'] = real_rain * 24 
            else:
                print(f"⚠️ Weather API Error: {weather_res.get('message')}")
                
        except Exception as w_err:
            print(f"⚠️ Weather Fetch Failed: {w_err}")

        # 4. Save Final Data
        latest_sensor_data.update(esp_data)
        return jsonify({"status": "success"}), 200

    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 400

# --- 5. IMAGE & WEED ROUTES ---
@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    try:
        image_data = request.data
        if not image_data:
            return jsonify({"status": "error", "message": "No data received"}), 400
            
        file_path = os.path.join(UPLOAD_FOLDER, 'field_capture.jpg')
        with open(file_path, 'wb') as f:
            f.write(image_data)
            
        print("📸 Image received and saved!")
        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"❌ Image save error: {e}")
        return jsonify({"status": "error"}), 500

# [ADDED BACK] This was missing and caused the 404 error!
@app.route('/api/weed-detection', methods=['POST'])
def detect_weeds():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        
        file = request.files['image']
        # Convert image to base64 to send back to frontend
        img_bytes = file.read()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        return jsonify({
            "result_image": img_base64,
            "detections": "3 weeds detected (Simulation)"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 6. GET DATA ROUTES ---
@app.route('/api/get-sensor-data', methods=['GET'])
def get_sensor_data():
    return jsonify(latest_sensor_data), 200

@app.route('/api/crop-recommendation', methods=['POST'])
def recommend_crop():
    return jsonify({"recommended_crop": "Rice", "confidence": 0.95}), 200

if __name__ == '__main__':
    print("🚀 Server starting...")
    app.run(host='0.0.0.0', port=5000, debug=True)