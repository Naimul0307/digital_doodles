const socket = io();
const canvas = document.getElementById('doodleCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let inputField = null;
let isTyping = false;
let draggingText = false;
let draggedText = null;

// Arrays to store all drawing paths and text elements
let drawingPaths = [];
let currentPath = [];
let textElements = [];

// Add event listeners for mouse and touch events
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mousemove', handleMouseMove);

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchend', handleTouchEnd);
canvas.addEventListener('touchmove', handleTouchMove);

function handleMouseDown(event) {
    const { offsetX, offsetY } = getEventCoords(event);
    if (isTyping) return;
    if (startDragging(offsetX, offsetY)) return;
    startDrawing(offsetX, offsetY);
}

function handleMouseUp() {
    stopDrawing();
    stopDragging();
}

function handleMouseMove(event) {
    const { offsetX, offsetY } = getEventCoords(event);
    if (drawing) {
        drawLine(offsetX, offsetY);
    } else if (draggingText) {
        dragText(offsetX, offsetY);
    }
}

function handleTouchStart(event) {
    const { offsetX, offsetY } = getEventCoords(event.touches[0]);
    if (isTyping) return;
    if (startDragging(offsetX, offsetY)) return;
    startDrawing(offsetX, offsetY);
}

function handleTouchEnd(event) {
    stopDrawing();
    stopDragging();

    // If typing mode is on, create the input field on touch end
    if (isTyping) {
        createInputField(event.changedTouches[0]);
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    const { offsetX, offsetY } = getEventCoords(event.touches[0]);
    if (drawing) {
        drawLine(offsetX, offsetY);
    } else if (draggingText) {
        dragText(offsetX, offsetY);
    }
}

function startDrawing(x, y) {
    drawing = true;
    currentPath = [{ x, y }];
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    if (drawing) {
        drawingPaths.push([...currentPath]);
        currentPath = [];
    }
    drawing = false;
    ctx.beginPath();
}

function drawLine(x, y) {
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    currentPath.push({ x, y });
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Clear the drawing paths and text elements arrays
    drawingPaths = [];
    textElements = [];

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
    inputField.style.position = 'absolute';
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
            const textX = parseInt(inputField.style.left);
            const textY = parseInt(inputField.style.top) + 20;
            addTextElement(text, textX, textY);
            document.querySelector('.canvas-container').removeChild(inputField);
            inputField = null;
            isTyping = false;
            canvas.removeEventListener('click', createInputField);
            canvas.removeEventListener('touchend', createInputField);
        }
    });
}

function addTextElement(text, x, y) {
    textElements.push({ text, x, y });
    redrawCanvas();
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all drawing paths
    drawingPaths.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        path.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    });

    // Redraw all text elements
    textElements.forEach(textElement => {
        ctx.font = '40px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(textElement.text, textElement.x, textElement.y);
    });
}

function startDragging(x, y) {
    let startDragging = false;
    textElements.forEach(textElement => {
        if (isInsideText(textElement, x, y)) {
            draggingText = true;
            draggedText = textElement;
            draggedText.offsetX = x - textElement.x;
            draggedText.offsetY = y - textElement.y;
            startDragging = true;
        }
    });
    return startDragging;
}

function dragText(x, y) {
    if (!draggingText) return;
    draggedText.x = x - draggedText.offsetX;
    draggedText.y = y - draggedText.offsetY;
    redrawCanvas();
}

function stopDragging() {
    draggingText = false;
    draggedText = null;
}

function getEventCoords(event) {
    const canvasRect = canvas.getBoundingClientRect();
    return {
        offsetX: event.clientX - canvasRect.left,
        offsetY: event.clientY - canvasRect.top
    };
}

function isInsideText(textElement, x, y) {
    return x >= textElement.x && x <= textElement.x + ctx.measureText(textElement.text).width && y >= textElement.y - 20 && y <= textElement.y;
}


function detectZoomLevel() {
    var ratio = 0,
        screen = window.screen,
        ua = navigator.userAgent.toLowerCase();

    if (~ua.indexOf('firefox')) {
        if (window.devicePixelRatio !== undefined) {
            ratio = window.devicePixelRatio;
        }
    } else if (~ua.indexOf('msie') || ~ua.indexOf('trident')) {
        if (screen.deviceXDPI && screen.logicalXDPI) {
            ratio = screen.deviceXDPI / screen.logicalXDPI;
        }
    } else if (window.outerWidth !== undefined && window.innerWidth !== undefined) {
        ratio = window.outerWidth / window.innerWidth;
    }

    return ratio;
}

// Example usage to adjust layout based on zoom level
function adjustLayoutBasedOnZoom() {
    var zoomLevel = detectZoomLevel();
    if (zoomLevel < 1) {
        // Adjust CSS or apply classes for zoomed out state
        document.body.classList.add('zoomed-out');
    } else {
        // Adjust CSS or apply classes for default or zoomed in state
        document.body.classList.remove('zoomed-out');
    }
}

// Execute the adjustment on page load
adjustLayoutBasedOnZoom();

// Listen for window resize events to re-adjust on zoom change
window.addEventListener('resize', adjustLayoutBasedOnZoom);
