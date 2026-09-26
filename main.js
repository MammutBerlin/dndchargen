// Electron-Hauptprozess. Verwaltet einen echten, sichtbaren Speicherordner
// im Dateisystem des Nutzers (standardmaessig ~/Dokumente/Charakterkompendium)
// statt Browser-IndexedDB. Vier "Stores" (Charaktere, eigene Spezies/
// Hintergruende/Klassen), jeweils eine JSON-Datei mit einem Array darin —
// einfach genug, um Lese-Aendern-Schreiben-Wettlaeufe gar nicht erst zu
// riskieren, und trotzdem ein "richtiger" Ordner mit echten Dateien.

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const STORE_FILES = {
  characters: 'charaktere.json',
  customSpecies: 'eigene-spezies.json',
  customBackgrounds: 'eigene-hintergruende.json',
  customClasses: 'eigene-klassen.json'
};

function dataDir(){
  return path.join(app.getPath('documents'), 'Charakterkompendium');
}
function storeFilePath(store){
  const name = STORE_FILES[store];
  if(!name) throw new Error('Unbekannter Store: ' + store);
  return path.join(dataDir(), name);
}
function ensureDataDir(){
  fs.mkdirSync(dataDir(), { recursive: true });
}
function readStore(store){
  ensureDataDir();
  const file = storeFilePath(store);
  if(!fs.existsSync(file)) return [];
  try{
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch(e){
    // Kaputte/leere Datei nicht zum Absturz fuehren lassen — als leer behandeln.
    console.error('Konnte', file, 'nicht lesen:', e.message);
    return [];
  }
}
function writeStore(store, arr){
  ensureDataDir();
  const file = storeFilePath(store);
  // Erst in eine Temp-Datei schreiben, dann umbenennen — vermeidet eine
  // halb geschriebene/kaputte Datei, falls die App waehrenddessen abstuerzt.
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(arr, null, 2), 'utf-8');
  fs.renameSync(tmp, file);
}

const KEY_FIELD = { characters:'id', customSpecies:'key', customBackgrounds:'key', customClasses:'key' };

ipcMain.handle('store:all', (ev, store) => readStore(store));
ipcMain.handle('store:get', (ev, store, key) => {
  const kf = KEY_FIELD[store];
  return readStore(store).find(x => x[kf] === key) || null;
});
ipcMain.handle('store:put', (ev, store, obj) => {
  const kf = KEY_FIELD[store];
  const arr = readStore(store);
  const idx = arr.findIndex(x => x[kf] === obj[kf]);
  if(idx >= 0) arr[idx] = obj; else arr.push(obj);
  writeStore(store, arr);
  return obj;
});
ipcMain.handle('store:delete', (ev, store, key) => {
  const kf = KEY_FIELD[store];
  const arr = readStore(store).filter(x => x[kf] !== key);
  writeStore(store, arr);
});
ipcMain.handle('store:openFolder', () => { shell.openPath(dataDir()); });
ipcMain.handle('store:folderPath', () => dataDir());

// Datei-Dialoge fuers Exportieren/Importieren einzelner Charaktere (echte
// Speichern-unter/Oeffnen-Dialoge statt des Browser-Downloads).
ipcMain.handle('file:saveJson', async (ev, suggestedName, content) => {
  const res = await dialog.showSaveDialog({ defaultPath: suggestedName, filters: [{ name:'JSON', extensions:['json'] }] });
  if(res.canceled || !res.filePath) return { ok:false };
  fs.writeFileSync(res.filePath, content, 'utf-8');
  return { ok:true, path: res.filePath };
});
ipcMain.handle('file:openJson', async () => {
  const res = await dialog.showOpenDialog({ properties:['openFile'], filters:[{ name:'JSON', extensions:['json'] }] });
  if(res.canceled || !res.filePaths.length) return { ok:false };
  const content = fs.readFileSync(res.filePaths[0], 'utf-8');
  return { ok:true, content, fileName: path.basename(res.filePaths[0]) };
});

function createWindow(){
  const win = new BrowserWindow({
    width: 1200, height: 900,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation:true, nodeIntegration:false }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if(BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if(process.platform !== 'darwin') app.quit(); });
