const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const JSZip = require('jszip');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  }
};

const isXmlFile = (filePath) => filePath.toLowerCase().endsWith('.xml');

const walkDirectory = async (dir, status, collection) => {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDirectory(fullPath, status, collection);
    } else if (entry.isFile() && isXmlFile(fullPath)) {
      collection.push({
        name: entry.name,
        path: fullPath,
        status
      });
    }
  }
};

ipcMain.handle('dialog:select-directory', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('fs:list-xml', async (_event, { envPath, cancPath }) => {
  const files = [];
  try {
    if (envPath) {
      if (!fs.existsSync(envPath)) {
        throw new Error(`Pasta ENV não encontrada: ${envPath}`);
      }
      await walkDirectory(envPath, 'processado', files);
    }
    if (cancPath) {
      if (!fs.existsSync(cancPath)) {
        throw new Error(`Pasta CANC não encontrada: ${cancPath}`);
      }
      await walkDirectory(cancPath, 'cancelado', files);
    }
    return { success: true, files };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('fs:read-file', async (_event, filePath) => {
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

const ensureDir = async (dirPath) => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};

const buildZip = async (sourceDir) => {
  const zip = new JSZip();
  const addFolderToZip = async (zipInstance, folderPath, folderName = '') => {
    const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      const relativePath = folderName ? `${folderName}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        const folder = zipInstance.folder(relativePath);
        await addFolderToZip(folder, fullPath, relativePath);
      } else {
        const content = await fs.promises.readFile(fullPath);
        zipInstance.file(relativePath, content);
      }
    }
  };

  await addFolderToZip(zip, sourceDir);
  return zip.generateAsync({ type: 'nodebuffer' });
};

ipcMain.handle('export:prepare', async (_event, payload) => {
  const { baseName, reportContent, items } = payload;
  const timestamp = Date.now();
  const tempRoot = path.join(os.tmpdir(), `${baseName}_${timestamp}`);
  try {
    await ensureDir(tempRoot);
    for (const item of items) {
      const destination = path.join(tempRoot, item.relativePath);
      await ensureDir(path.dirname(destination));
      await fs.promises.copyFile(item.source, destination);
    }

    const reportPath = path.join(tempRoot, 'relatorio.txt');
    await fs.promises.writeFile(reportPath, reportContent, 'utf-8');

    const zipBuffer = await buildZip(tempRoot);
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Salvar pacote ZIP',
      defaultPath: path.join(app.getPath('documents'), `${baseName}.zip`),
      filters: [{ name: 'ZIP', extensions: ['zip'] }]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Exportação cancelada pelo usuário.' };
    }

    await fs.promises.writeFile(filePath, zipBuffer);
    return { success: true, zipPath: filePath };
  } catch (error) {
    return { success: false, message: error.message };
  }
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
