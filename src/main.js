const { app, BrowserWindow, ipcMain } = require('electron');
const { OBSManager } = require('./backend/OBSManager.js')
const path = require('path')

const obsManager = new OBSManager();

const createWindow = function () {
  const win = new BrowserWindow({
    width:  800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  ipcMain.on('client-expression-changed', (event, expression) => {
    onClientExpressionChanged(expression);
  });

  win.loadFile('./src/frontend/index.html');
};


async function onClientExpressionChanged(expression) {
  console.log('EXPRESSION CHANGED: ' + expression);
  console.log(expression);
  obsManager.setCurrentExpression(expression);
}


app.whenReady().then( async () => {
  createWindow();
  // read OBS settings and face settings from file

  // update face settings via ipc

  // update OBS settings

  await obsManager.connect({
    ip: '192.168.43.55',
    port: '4455',
    password: '8wcbSnBF3Al9qQgQ'
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// just a placeholder. should be ipc event handler
app.on('settings-applied', (settings) => {

});

// OBS handler
