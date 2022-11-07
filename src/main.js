const { app, BrowserWindow, ipcMain } = require('electron');
const { OBSManager } = require('./backend/OBSManager.js')
const path = require('path')

const obsManager = new OBSManager();

let win;

const createWindow = function () {
  win = new BrowserWindow({
    width:  800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  ipcMain.on('client-expression-changed', (event, expression) => {
    onClientExpressionChanged(expression);
  });

  ipcMain.on('obs-connection-settings-changed', (event, settings) => {
    onClientObsConnectionSettingsChanged(settings);
  });

  win.loadFile('./src/frontend/index.html');
};


async function onClientExpressionChanged(expression) {
  console.log('EXPRESSION CHANGED: ' + expression);
  console.log(expression);
  obsManager.setCurrentExpression(expression);
}


async function sendObsConnectionError(err) {
  console.log(err.message);
  win.webContents.send('obs-connection-error', err.message);
}


async function onClientObsConnectionSettingsChanged(settings) {
  await connectToObs(settings, onError = sendObsConnectionError);
}

// TODO: no return value or error thrown when connection failed? How would you notify the client about a connection error (e.g. wrong credentials)?
async function connectToObs(settings, onError=function(err){}) {
  let ret = await obsManager.connect({
    ip: settings.ip,
    port: settings.port,
    password: settings.password
  });
  console.log('------');
  console.log(ret);
  console.log('------');
}


app.whenReady().then( async () => {
  createWindow();
  // read OBS settings and face settings from file

  // update face settings via ipc

  // update OBS settings
  settings = {
    ip: '192.168.43.55',
    port: '4455',
    password: '8wcbSnBF3Al9qQgQ'
  };

  await connectToObs(settings, onError = sendObsConnectionError);

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
