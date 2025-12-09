const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

const isMac = process.platform === 'darwin';
const parser = new XMLParser({ ignoreAttributes: false });

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  mainWindow.loadFile(indexPath);
}

async function collectXmlFiles(dirPath, list = []) {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await collectXmlFiles(fullPath, list);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.xml')) {
        list.push(fullPath);
      }
    }
  } catch (error) {
    // Directory not found or inaccessible; ignore
  }
  return list;
}

function findTagValue(target, key) {
  if (!target || typeof target !== 'object') return undefined;
  if (Object.prototype.hasOwnProperty.call(target, key)) {
    return target[key];
  }

  for (const value of Object.values(target)) {
    if (value && typeof value === 'object') {
      const found = findTagValue(value, key);
      if (found !== undefined) return found;
    }
  }

  return undefined;
}

async function parseXmlFile(filePath, status) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = parser.parse(content);

    const numero = findTagValue(parsed, 'nNF');
    const serie = findTagValue(parsed, 'serie');
    const modelo = findTagValue(parsed, 'mod');
    const data = findTagValue(parsed, 'dhEmi');
    const valor = findTagValue(parsed, 'vNF');

    return {
      numero: numero ? String(numero) : '',
      serie: serie ? String(serie) : '',
      modelo: modelo ? String(modelo) : '',
      data: data ? String(data) : '',
      valor: valor ? Number(valor) : 0,
      status
    };
  } catch (error) {
    throw new Error(`Erro ao ler ${path.basename(filePath)}: ${error.message}`);
  }
}

async function scanXml(rootPath) {
  const envDir = path.join(rootPath, 'NFE', 'ENV');
  const cancDir = path.join(rootPath, 'NFE', 'CANC');

  const notes = [];
  const errors = [];

  const [envFiles, cancFiles] = await Promise.all([
    collectXmlFiles(envDir),
    collectXmlFiles(cancDir)
  ]);

  for (const file of envFiles) {
    try {
      const note = await parseXmlFile(file, 'processado');
      notes.push(note);
    } catch (error) {
      errors.push({ file, message: error.message });
    }
  }

  for (const file of cancFiles) {
    try {
      const note = await parseXmlFile(file, 'cancelado');
      notes.push(note);
    } catch (error) {
      errors.push({ file, message: error.message });
    }
  }

  const processados = notes.filter((note) => note.status === 'processado').length;
  const cancelados = notes.filter((note) => note.status === 'cancelado').length;
  const somaValores = notes.reduce((acc, note) => acc + (Number(note.valor) || 0), 0);

  return {
    notes,
    totals: {
      processados,
      cancelados,
      somaValores
    },
    errors
  };
}

ipcMain.handle('select-root', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('scan-xml', async (_event, rootPath) => {
  if (!rootPath) throw new Error('Nenhuma pasta raiz informada.');
  return scanXml(rootPath);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});
