const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  splitFile: (options) => ipcRenderer.invoke('split-file', options),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  
  // Progress listener
  onSplitProgress: (callback) => {
    ipcRenderer.on('split-progress', (event, data) => callback(data));
  },
  
  // Remove progress listener
  removeSplitProgressListener: () => {
    ipcRenderer.removeAllListeners('split-progress');
  }
});