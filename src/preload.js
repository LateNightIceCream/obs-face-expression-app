const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendExpression: (expression) => ipcRenderer.send('client-expression-changed', expression),
  sendObsConnectionSettings: (settings) => ipcRenderer.send('obs-connection-settings-changed', settings),
  handleObsConnectionError: (callback) => ipcRenderer.on('obs-connection-error', callback),
  handleCacheSettingsInit: (callback) => ipcRenderer.on('update-from-cache-settings', callback),
});
