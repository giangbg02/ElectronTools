const {BrowserWindow, ipcMain} = require('electron')
const url = require('url')
const path = require('path')

const mainWindow = {
    creat: function(){
        this.win = new BrowserWindow({
            width: 500, 
            height: 550, 
            frame: false,
            show: false,
            resizable: false,
            maximizable: false,
            minimizable: false,
            fullscreenable: false,
            closable: false,
            // skipTaskbar: true,
            // transparent: true,
            webPreferences: {
                nodeIntegration: true
            },
            icon: path.join(__dirname, './img/logo-32.png')
        })
        this.win.loadURL(url.format({
            pathname: path.join(__dirname, './index.html'),
            protocol: 'file:',
            slashes: true
        }))
        this.win.once('ready-to-show', () => {
            this.win.webContents.openDevTools()
            this.win.show()
        })
        this.win.on('hide', _ => {
            this.callback()
        })
    },
    show: function() {
        this.win ? this.win.show() : this.creat()
    },
    init: function(callback) {
        this.callback = callback
    }
}

module.exports = mainWindow