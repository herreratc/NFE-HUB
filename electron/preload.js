const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectRoot: () => ipcRenderer.invoke('select-root'),
  scanXml: (rootPath) => ipcRenderer.invoke('scan-xml', rootPath)
});
