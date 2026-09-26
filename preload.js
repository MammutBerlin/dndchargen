// Preload-Skript: stellt der Renderer-Seite (renderer/index.html) eine kleine,
// sichere API bereit (contextIsolation bleibt an — kein direkter Zugriff auf
// Node/fs aus der Webseite selbst, nur über diese gezielt freigegebenen
// Funktionen, die per IPC an den Hauptprozess durchgereicht werden).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  storeAll: (store) => ipcRenderer.invoke('store:all', store),
  storeGet: (store, key) => ipcRenderer.invoke('store:get', store, key),
  storePut: (store, obj) => ipcRenderer.invoke('store:put', store, obj),
  storeDelete: (store, key) => ipcRenderer.invoke('store:delete', store, key),
  openDataFolder: () => ipcRenderer.invoke('store:openFolder'),
  dataFolderPath: () => ipcRenderer.invoke('store:folderPath'),
  saveJsonFile: (suggestedName, content) => ipcRenderer.invoke('file:saveJson', suggestedName, content),
  openJsonFile: () => ipcRenderer.invoke('file:openJson')
});
