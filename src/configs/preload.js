const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("Electron", { ipcRenderer: { ...ipcRenderer, on: ipcRenderer.on } });