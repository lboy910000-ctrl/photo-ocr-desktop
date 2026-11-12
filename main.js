const { app, BrowserWindow, Menu } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'app');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.wasm': 'application/wasm',
  '.css': 'text/css', '.gz': 'application/octet-stream' };

// Tiny local server (127.0.0.1 only) so the OCR engine can load its workers and language files.
function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const file = path.normalize(path.join(root, p));
      if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function createWindow() {
  const port = await serve();
  const win = new BrowserWindow({
    width: 1000, height: 800, title: 'Photo OCR to Word', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  win.loadURL('http://127.0.0.1:' + port + '/index.html');
}

if (!app.requestSingleInstanceLock()) app.quit();
app.whenReady().then(() => { Menu.setApplicationMenu(null); createWindow(); });
app.on('window-all-closed', () => app.quit());
