const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  listXmlFiles: (paths) => ipcRenderer.invoke('fs:list-xml', paths),
  readFileContent: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  prepareExport: (payload) => ipcRenderer.invoke('export:prepare', payload)
});
