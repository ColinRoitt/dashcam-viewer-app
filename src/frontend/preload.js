const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getVideoFiles: (folderPath) => ipcRenderer.invoke('get-video-files', folderPath),
});
