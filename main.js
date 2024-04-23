'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Global Shortcut
const globalShortcut = electron.globalShortcut;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// Module ipc
const ipcMain = electron.ipcMain;
// Module Session
const session = electron.session;
// Class Cookie
const cookieElectronClass = require('./src/classes/CookieElectron.js');
// Class Pocket
const pocketAuthClass = require('./src/classes/PocketAuth.js');
// Class Pocket Request
const pocketRequestClass = require('./src/classes/PocketRequest.js');

const path = require('path');

const chokidar = require('chokidar');

const nativeImage = require('electron').nativeImage;

const Menu = electron.Menu;
const Tray = electron.Tray;

var trayIcon = null;

var tokenUser = null;

// Keep a global reference
let cookieElectron = new cookieElectronClass();
// Keep a global reference to use the data of the authentication
let pocketAuth = new pocketAuthClass('');
// Keep a global reference to make request
let pocketRequest = new pocketRequestClass(pocketAuth);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, authWindow, addWindow = null;

// make the app single instance
const shouldQuit = app.makeSingleInstance(() => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

if (shouldQuit) {
  app.quit();
  return;
}

function createWindow () {
  cookieElectron.getCookie('access_token', function(error, cookies) {
    let access_token = '';
    if (cookies.length) {
      access_token = cookies[0].value;
      tokenUser = access_token;
    }

    if (access_token.length) {
      // create main window
      createMainWindow();
      // cookieElectron.clearCookies();
    } else {
      let serverClass = require('./src/classes/Server.js');

      let server = new serverClass();
      let urlServer = server.url;

      // get Request token to redirect to pocket site
      pocketAuth.getRequestToken(urlServer, function(requestToken) {
          // set requestToken in pocketAuth for keep token through the app
          pocketAuth.requestToken = requestToken;
          // redirect to pocket site
          createAuthWindow(requestToken, urlServer);
      });

      // create a server to listen pocket's request after auth by website
      server.createServer(function(request, response) {
        // get username, access_token
        pocketAuth.getPocketAcess(function(access_token, username) {
          // save access_token and username
          if (access_token.length && username.length) {
            // tokenUser = access_token;
            cookieElectron.setCookie('access_token', access_token);
            cookieElectron.setCookie('username', username);
          }
          // calls main window
          createMainWindow();
          // close auth window. We don't need it more
          authWindow.close();
          // close server
          server.shutdown();
        });
      });
    }
  });

}

function createMainWindow() {

  let width = 1200,
      height = 600;

  /* set x and y for add window */
  let firstScreen = electron.screen.getPrimaryDisplay();
  let x = (firstScreen.bounds.width - width) * .5;
  let y = (firstScreen.bounds.height - height) * .5;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: x,
    y: y,
    width: width,
    height: height,
    acceptFirstMouse: true,
    show: false
    // titleBarStyle: 'hidden-inset'
  });

  /* improves usability */
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // and load the index.html of the app.
  let url = 'file://' + __dirname + '/public/index.html';
  mainWindow.loadURL(url);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // it already have one tray and it already registered shortcuts
  if (trayIcon !== null) {
    return;
  }

  // shortcut to open add window
  // registerGlobalShortcuts();

  let image = nativeImage.createFromPath(path.join(__dirname, 'tray.png'));
  trayIcon = new Tray(image);
  var contextMenu = Menu.buildFromTemplate([
    // {
    //   label: 'Add Item',
    //   type: 'normal',
    //   accelerator: 'CmdOrCtrl+Shift+Alt+O',
    //   'click': function(menuItem, browserWindow) {
    //     createWindow();
    //   }
    // },
    // { label: 'Separator', type: 'separator' },
    {
      label: 'Open',
      type: 'normal',
      'click': () => { createWindow(); }
    },
    {
      label: 'Logout',
      type: 'normal',
      'click': function(menuItem, focusedWindow) {
        cookieElectron.clearCookies(function() {
          // closes current window
          focusedWindow.close();
          trayIcon.destroy();
          // starts the app as the first time
          createWindow();
        });
      }
    },
    {
      label: 'Quit',
      type: 'normal',
      'click': function(menuItem, browserWindow) {
        app.quit();
      }
    }
  ]);
  trayIcon.setContextMenu(contextMenu);
}

function createAuthWindow(requestToken, redirect_uri) {
  let pocketApiUrlClass = require('./src/classes/PocketApiUrl.js');
  let pocketApiUrl = new pocketApiUrlClass();

  authWindow = new BrowserWindow({
    useContentSize: true,
    center:true,
    plugins: true,
    nodeIntegration: false
  });

  const url = pocketApiUrl.getAuthorize(requestToken, redirect_uri)
  console.log(url)
  // load external url.
  authWindow.loadURL(url);

  // show window
  authWindow.show();

  // Emitted when the window is closed.
  authWindow.on('closed', function() {
    authWindow = null;
  });
}

function registerGlobalShortcuts() {
  let add = globalShortcut.register('CommandOrControl+Shift+A', function() {
    if (addWindow !== null) {
      addWindow.focus();
      return;
    }

    let width = 500,
        height = 343;

    /* set x and y for add window */
    let firstScreen = electron.screen.getPrimaryDisplay();
    let x = (firstScreen.bounds.width - width) * .5;
    let y = (firstScreen.bounds.height - height) * .5;

    addWindow = new BrowserWindow({
      x: parseInt(x),
      y: parseInt(y),
      width: width,
      height: height,
      resizable: false,
      nodeIntegration: false,
      plugins: true,
      title: 'Add an Item',
      acceptFirstMouse: true,
      alwaysOnTop: true,
      frame: false,
      center: false,
      show: false
    });

    /* improves usability */
    addWindow.once('ready-to-show', () => {
      addWindow.show();
    })

    addWindow.loadURL('file://' + __dirname + '/web/add.html');

    // addWindow.show();

    // addWindow.webContents.openDevTools();

    addWindow.on('closed', () => {
      addWindow = null;
    })
  });

  if (!add) {
    console.error('Conflit global shortcut');
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', function() {
  globalShortcut.unregisterAll();
});

/*
 * Get Items
 */
ipcMain.on('getItems', function(event, arg) {
  pocketRequest.getItems({
    count: arg.count,
    offset: arg.offset,
    since: (arg.since) ? true : false,
    search: (arg.search && arg.search.length) ? arg.search : false
  }, function(body) {

    let list = Object.keys(body.list).map(function(key) { return body.list[key] });

    event.sender.send('retrieveItems', list);
  });
});

/*
 * Save Items
 */
ipcMain.on('saveItem', function(event, arg) {
  pocketRequest.saveItem({
    url: arg.url,
    title: arg.title,
    tags: arg.tags
  }, function(body) {
    if (body.status != 1) {
      console.error('Status != 1');
      return;
    }

    event.sender.send('savedItem');
  });
})

/*
 * Modify Items
 */
ipcMain.on('modifyItem', function(event, arg) {
  pocketRequest.modifyItem({
    item_id: arg.item_id,
    action: arg.action,
    tags: arg.tags
  }, function(body) {

    if (body.status != 1 || body.action_results == false) {
      console.error('modifyItem error');
    }

    event.sender.send('modifiedItem', body.status);
  });
});

ipcMain.on('request_token_user', function(event) {
  event.sender.send('get_token_user', tokenUser);
});

/** @task: just in dev */
chokidar.watch([
  // path.join(__dirname, 'src/*.*'),
  path.join(__dirname, 'public/dist/*.*'),
  path.join(__dirname, 'public/*/*.css'),
  path.join(__dirname, 'public/*.html')
  ])
.on('change', () => {
  if (mainWindow) {
    mainWindow.reload();
  }
});
