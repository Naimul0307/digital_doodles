from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import os
from datetime import datetime
import base64

app = Flask(__name__)
socketio = SocketIO(app)

# List to store doodles
doodle_files = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/main_screen')
def main_screen():
    return render_template('main_screen.html')

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
        doodle_files = doodle_files[:10]
        
        # Broadcast the doodle to all connected clients
        emit('new_doodle', {'image': f'/static/doodles/{filename}'}, broadcast=True)
    
    except Exception as e:
        emit('doodle_error', {'message': str(e)})

@app.route('/get_latest_doodles')
def get_latest_doodles():
    global doodle_files  # Ensure doodle_files is treated as a global variable
    return jsonify({'doodles': doodle_files})

if __name__ == '__main__':
    local_ip = os.getenv('LOCAL_IP', '192.168.0.154')  # Replace '192.168.0.154' with your local IP address
    socketio.run(app, host=local_ip, port=5000, debug=True)
