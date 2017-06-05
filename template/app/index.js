const electron = require('electron')

const app = electron.app

const Tray = electron.Tray

const Menu = electron.Menu

const nativeImage = electron.nativeImage

const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

const isDev = require('electron-is-dev')

let mainWindow
let appIcon

function createWindow () {
  mainWindow = new BrowserWindow({ width: 800, height: 600 })
  const index = isDev ? `http://localhost:3780` : `file://${path.join(__dirname, 'dist/index.html')}`
  mainWindow.loadURL(index)
  
  if (isDev) {
    //打开DevTools
    const installExtension = require('electron-devtools-installer')
    console.log(installExtension.VUEJS_DEVTOOLS)
    installExtension.default(installExtension.VUEJS_DEVTOOLS)
                    .then(name => console.log(`添加扩展:  ${name}`))
                    .catch(err => console.log('发生错误: ', err))
  }
  
  // 关闭窗口时候释放
  mainWindow.on('closed', function () {
    mainWindow = null
  })
  //创建一个右下角菜单
  createTrayMenu()
}
function createTrayMenu () {
  appIcon = new Tray(nativeImage.createFromPath(path.join(__dirname, 'icons/icon')))
  let menuList = (process.env.NODE_ENV === 'development') ? [ {
    label: '调试模式', click: () => {
      mainWindow.webContents.openDevTools()
    }
  } ] : []
  menuList.push({
    label: '退出应用', click: () => {
      app.quit()
    }
  })
  let contextMenu = Menu.buildFromTemplate(menuList)
  appIcon.setToolTip('右键弹出菜单')
  appIcon.on('click', () => {
    mainWindow.show()
  })
  appIcon.setContextMenu(contextMenu)
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

