from flask import Flask, render_template
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
    return render_template('main_screen.html', doodle_files=doodle_files)

@socketio.on('submit_doodle')
def handle_doodle_submission(data):
    try:
        image_data = data.get('image', '').split(',')[1]  # Extract base64 image data
        filename = f"doodle_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
        # Save the image to the static folder
        with open(os.path.join('static', 'doodles', filename), "wb") as f:
            f.write(base64.b64decode(image_data))
        # Add the filename to the list of doodle files
        doodle_files.append(filename)
        # Broadcast the doodle to all connected clients
        emit('new_doodle', {'image': f'/static/doodles/{filename}'}, broadcast=True)
    except Exception as e:
        emit('doodle_error', {'message': str(e)})

if __name__ == '__main__':
    local_ip = os.getenv('LOCAL_IP', '192.168.0.154')  # Replace '192.168.0.154' with your local IP address
    socketio.run(app, host=local_ip, port=5000, debug=True)

