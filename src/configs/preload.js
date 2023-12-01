// const { ipcRenderer } = require('electron');

// window.ipcRenderer = ipcRenderer; // Export ipcRenderer để có thể sử dụng trong renderer process


const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer,
});