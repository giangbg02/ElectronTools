const {BrowserWindow, ipcMain, globalShortcut} = require('electron')
const url = require('url')
const path = require('path')

const config = require('../common/js/config').file('config');

var plugins = config.get("plugins")

//同步插件信息
function sycnPlugins() {
    config.set("plugins", plugins)
}

var pluginWindows = {}

const mainWindow = {
    creat: function(){
        this.win = new BrowserWindow({
            width: 800, 
            height: 600, 
            frame: false,
            show: false,
            resizable: false,
            maximizable: false,
            minimizable: false,
            fullscreenable: false,
            // transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true
            }
        })
        this.win.loadURL(url.format({
            pathname: path.join(__dirname, './index.html'),
            protocol: 'file:',
            slashes: true
        }))
        this.win.once('ready-to-show', () => {
            // this.win.webContents.openDevTools()
            // this.show()
        })
        this.win.on('blur', () => {
            this.hide()
        })
    },
    init: function(){
        this.creat()
        globalShortcut.register("Alt+Space", _ => {
            this.show()
        })
        for(var i=0; i<plugins.length; i++) {
            let plugin = plugins[i]
            if(plugin.usable) {
                let pluginWindow = require("../plugins/" + plugin.code + '/main')
                
                let destroy = function() {
                    pluginWindow.win.destroy()
                    pluginWindow.win = null
                }
                //init初始化传入hide触发时的callback
                pluginWindow.init(_ => {
                    if(plugin.destroy == 0) {
                        destroy()
                    }else if(plugin.destroy > 0) {
                        pluginWindow.timeout = setTimeout(_ => {
                            destroy()
                        }, plugin.destroy * 1000 * 60)
                    }
                })
                if(plugin.shortcut != "") {
                    globalShortcut.register(plugin.shortcut, _ => {
                        this.pluginShow(pluginWindow)
                    })
                }
                pluginWindows[plugin.code] = pluginWindow
            }
        }
    },
    pluginShow: function(plugin) {
        plugin.show()
        if(plugin.timeout) {
            clearTimeout(plugin.timeout)
            plugin.timeout = undefined
        }
    },
    show: function(){
        this.win.show()
    },
    hide: function(){
        this.win.hide()
    }
}

//ipc隐藏主窗口
ipcMain.on('hide-main-window', (event, arg) => {
    mainWindow.hide()
})

//ipc打开插件窗口
ipcMain.on('show-plugin-window', (event, arg) => {
    let pluginWindow = pluginWindows[arg]
    mainWindow.pluginShow(pluginWindow)
})

module.exports = mainWindow