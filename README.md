# Charakterkompendium — Desktop-App

Electron-basierte Desktop-Version des Charakterkompendiums. Speichert Charaktere
und eigene Inhalte als echte JSON-Dateien in einem sichtbaren Ordner
(standardmäßig `Dokumente/Charakterkompendium`) statt in Browser-Speicher.

## Für Mitspieler: Installation

- **Linux:** `Charakterkompendium-1.0.0.AppImage` herunterladen, ausführbar
  machen (`chmod +x Charakterkompendium-1.0.0.AppImage`, oder Rechtsklick →
  Eigenschaften → Ausführbar), dann per Doppelklick starten. Kein Installer,
  keine Rechte nötig.
- **Windows:** `Charakterkompendium Setup 1.0.0.exe` herunterladen und
  ausführen. Windows SmartScreen wird vermutlich warnen (unsignierte App) —
  „Weitere Informationen" → „Trotzdem ausführen". Das ist normal bei nicht
  kommerziell signierten Kleinanwendungen, kein Hinweis auf ein Problem.

## Datenordner

Über den Button „📁 Datenordner öffnen" in der App direkt erreichbar. Enthält:
- `charaktere.json` — alle gespeicherten Charaktere
- `eigene-spezies.json`, `eigene-hintergruende.json`, `eigene-klassen.json` —
  selbst angelegte Inhalte

Diese Dateien lassen sich normal kopieren/sichern/synchronisieren (z. B. über
Dropbox) — sind aber nicht dafür gedacht, von Hand bearbeitet zu werden.

## Bauen (für Entwicklung/Updates)

```bash
npm install
npm start              # App direkt starten, ohne zu bauen
npm run build:linux    # AppImage erzeugen
npm run build:win      # Windows-Installer erzeugen (braucht wine unter Linux)
```

## Lizenz

Siehe [`LICENSE`](./LICENSE): eigener Code unter MIT, SRD-5.2-Spieldaten unter
CC-BY-4.0 (Wizards of the Coast, bezogen über [Open5e](https://open5e.com),
fest in `renderer/index.html` eingebacken), deutsche Kurztexte als eigene,
unabhängig formulierte Bearbeitung — keine offizielle Übersetzung.

## Architektur

- `main.js` — Electron-Hauptprozess: Fenster, Datei-basierter Speicher (liest/
  schreibt die JSON-Dateien im Datenordner), Datei-Dialoge für Export/Import.
- `preload.js` — sichere Brücke zwischen Hauptprozess und Seite
  (`contextIsolation` bleibt an, kein direkter Node-Zugriff aus der Seite).
- `renderer/index.html` — die eigentliche App. Identisch zur reinen
  Browser-Standalone-Version, bis auf die Speicherschicht (vier Funktionen
  `idbAll/idbGet/idbPut/idbDelete`, die hier per `window.electronAPI` an
  `main.js` durchreichen statt an IndexedDB).
