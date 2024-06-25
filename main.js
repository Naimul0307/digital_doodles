const fs = require('fs');
const path = require('path');

// Load configuration from config.json
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { app, BrowserWindow, globalShortcut } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true, // Start in full-screen mode
    autoHideMenuBar: true, // Hide the menu bar
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  const url = `http://${config.IP}:${config.PORT}`;  // Ensure config.PORT matches the updated port number in app.py
  mainWindow.loadURL(url);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Registering the F11 key to toggle fullscreen
  globalShortcut.register('F11', () => {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });

  // Registering the Esc key to exit fullscreen
  globalShortcut.register('Esc', () => {
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
  });
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
