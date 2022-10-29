const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendExpression: (expression) => ipcRenderer.send('client-expression-changed', expression),
});
