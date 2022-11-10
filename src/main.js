const { app, BrowserWindow, ipcMain } = require('electron');
const { OBSManager } = require('./backend/OBSManager.js');
const { CacheStore } = require('./backend/CacheStore.js');
const path = require('path');

const appData = getAppDataPath();
console.log(appData);

const obsManager = new OBSManager();
const cacheStore = new CacheStore(path.join(appData, 'obs-face-expression-cache.json'));
console.log('cache file location: ' + cacheStore.path);

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

  ipcMain.on('obs-connection-settings-applied', (event, settings) => {
    onClientObsConnectionSettingsApplied(settings);
  });

  win.loadFile('./src/frontend/index.html');
};


async function onClientExpressionChanged(expression) {
  console.log('EXPRESSION CHANGED: ' + expression);
  console.log(expression);
  await obsManager.setCurrentExpression(expression);
}


async function sendObsConnectionError(err) {
  return win.webContents.send('obs-connection-error', err);
}


async function sendCacheSettings(settings) {
  return win.webContents.send('update-from-cache-settings', settings);
}


async function onClientObsConnectionSettingsApplied(settings) {
  await cacheStore.set('ip', settings.ip);
  await cacheStore.set('port', settings.port);
  await cacheStore.set('password', settings.password);
  await connectToObs(settings, onError = sendObsConnectionError);
}


// TODO: rename error sending
async function connectToObs(settings, onError=function(err){}) {
  let err = '';
  console.log('hello from connectToObs!');
  obsManager.connect({
    ip: settings.ip,
    port: settings.port,
    password: settings.password
  })
  .then((result) => {
    err = result.message;
    return sendObsConnectionError(result.message);
  })
  .catch((error) => {
    err = error;
  })
  .then(() => {
    return sendObsConnectionError(err);
  });
}


app.whenReady().then( async () => {

  createWindow(); // await?

  // timeout needed to wait for the browser to load
  // TODO： use signals for this
  setTimeout(async function()  {
    initFromCache();
  }, 1000);

});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// just a placeholder. should be ipc event handler
app.on('settings-applied', (settings) => {

});


async function initFromCache() {
  let obsSettings = {
    ip: cacheStore.get('ip'),
    port: cacheStore.get('port'),
    password: cacheStore.get('password'),
  };

  let faceSettings = {

  };

  // TODO: create class for settings format
  return sendCacheSettings({
    obs: obsSettings,
    face: faceSettings,
  });

}


function getAppDataPath() {
  return process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
}
