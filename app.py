from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import os
from datetime import datetime
import base64
import json  # Import JSON module

app = Flask(__name__)
socketio = SocketIO(app)

# Function to load configuration from config.json
def load_config():
    with open('config.json', 'r') as f:
        return json.load(f)

# Initialize configuration
config = load_config()

# List to store doodles
doodle_files = []

@app.route('/')
def index():
    return render_template('main_screen.html')

@app.route('/index')
def main_screen():
    return render_template('index.html')

@socketio.on('submit_doodle')
def handle_doodle_submission(data):
    global doodle_files  # Ensure doodle_files is treated as a global variable

    try:
        image_data = data.get('image', '').split(',')[1]  # Extract base64 image data
        filename = f"doodle_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
        
        # Save the image to the static folder
        with open(os.path.join('static', 'doodles', filename), "wb") as f:
            f.write(base64.b64decode(image_data))
        
        # Update doodle_files list with new filename
        doodle_files.insert(0, f'/static/doodles/{filename}')
        
        # Trim the list to 10 items
        doodle_files = doodle_files[:12]
        
        # Broadcast the doodle to all connected clients
        emit('new_doodle', {'image': f'/static/doodles/{filename}'}, broadcast=True)
    
    except Exception as e:
        emit('doodle_error', {'message': str(e)})

@app.route('/get_latest_doodles')
def get_latest_doodles():
    global doodle_files  # Ensure doodle_files is treated as a global variable
    max_images = int(os.getenv('MAX_IMAGES', 8))  # Default to 8 if not set in environment
    return jsonify({'doodles': doodle_files[:max_images]})

if __name__ == '__main__':
    # Read IP and PORT from config.json
    config = load_config()  # Reload config to get latest changes
    local_ip = config.get('IP', '127.0.0.1')
    port_number = int(config.get('PORT', 5001))  # Change to a different default port number if needed
    
    socketio.run(app, host=local_ip, port=port_number, debug=True)
