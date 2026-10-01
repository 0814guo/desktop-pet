const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { GlobalKeyboardListener } = require('node-global-key-listener');

let win;
let vListener = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workArea;

  win = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    focusable: true,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  win.setAlwaysOnTop(true, 'screen-saver');

  // 默认开启鼠标穿透
  win.setIgnoreMouseEvents(true, { forward: true });

  // 移入桌宠区域恢复可点击，移出恢复穿透
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const targetWin = BrowserWindow.fromWebContents(event.sender);
    if (targetWin) {
      targetWin.setIgnoreMouseEvents(ignore, options);
    }
  });

  // 启动零配置的 Windows 底层全局按键监听服务
  try {
    vListener = new GlobalKeyboardListener();
    vListener.addListener(function (e, down) {
      if (e.state === 'DOWN' && win && !win.isDestroyed()) {
        let keyName = null;
        const name = e.name ? e.name.toUpperCase() : '';

        if (name === 'TAB') keyName = 'Tab';
        else if (name === 'SPACE') keyName = ' ';
        else if (name === 'RETURN' || name === 'ENTER') keyName = 'Enter';
        else if (name.includes('CONTROL') || name.includes('CTRL')) keyName = 'Control';
        else if (name.includes('ALT')) keyName = 'Alt';
        else if (name === 'A') keyName = 'a';
        else if (name === 'S') keyName = 's';
        else if (name === 'D') keyName = 'd';

        win.webContents.send('global-input-event', { type: 'key', key: keyName });
      }
    });
  } catch (err) {
    console.error('全局键盘监听初始化失败:', err);
  }
}

app.whenReady().then(createWindow);

app.on('will-quit', () => {
  if (vListener) {
    vListener.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});