const socket = io();
const canvas = document.getElementById('doodleCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let inputField = null;
let isTyping = false;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchmove', drawTouch);

function startDrawing(event) {
    if (isTyping) return;
    drawing = true;
    ctx.beginPath();
    const { offsetX, offsetY } = getEventCoords(event);
    ctx.moveTo(offsetX, offsetY);
}

function stopDrawing() {
    if (isTyping) return;
    drawing = false;
    ctx.beginPath();
}

function draw(event) {
    if (!drawing || isTyping) return;
    const { offsetX, offsetY } = getEventCoords(event);
    drawLine(offsetX, offsetY);
}

function drawTouch(event) {
    event.preventDefault();
    if (!drawing || isTyping) return;
    const { offsetX, offsetY } = getEventCoords(event.touches[0]);
    drawLine(offsetX, offsetY);
}

function drawLine(x, y) {
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Remove the input field if it exists
    if (inputField) {
        document.querySelector('.canvas-container').removeChild(inputField);
        inputField = null;
        isTyping = false;
        canvas.removeEventListener('click', createInputField);
        canvas.removeEventListener('touchend', createInputField);
    }
}

function saveDoodle() {
    const dataURL = canvas.toDataURL('image/png');
    socket.emit('submit_doodle', { image: dataURL });
    clearCanvas(); // Clear the canvas after saving
}

function addText() {
    isTyping = true;
    canvas.addEventListener('click', createInputField);
    canvas.addEventListener('touchend', createInputField);
}

function createInputField(event) {
    if (inputField) return;

    const { offsetX, offsetY } = getEventCoords(event);
    
    inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.style.left = `${offsetX}px`;
    inputField.style.top = `${offsetY}px`;

    // Ensure the input field stays within the canvas
    const canvasRect = canvas.getBoundingClientRect();
    const inputWidth = 150;
    const inputHeight = 30; // Adjust based on expected input height

    if (offsetX + inputWidth > canvas.width) {
        inputField.style.left = `${canvas.width - inputWidth}px`;
    }
    if (offsetY + inputHeight > canvas.height) {
        inputField.style.top = `${canvas.height - inputHeight}px`;
    }

    document.querySelector('.canvas-container').appendChild(inputField);
    inputField.focus();

    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const text = inputField.value;
            ctx.font = '20px Arial';
            ctx.fillStyle = '#000000';
            ctx.fillText(text, parseInt(inputField.style.left), parseInt(inputField.style.top) + 20);
            document.querySelector('.canvas-container').removeChild(inputField);
            inputField = null;
            isTyping = false;
            canvas.removeEventListener('click', createInputField);
            canvas.removeEventListener('touchend', createInputField);
        }
    });
}

function getEventCoords(event) {
    const canvasRect = canvas.getBoundingClientRect();
    return {
        offsetX: event.clientX - canvasRect.left,
        offsetY: event.clientY - canvasRect.top
    };
}
