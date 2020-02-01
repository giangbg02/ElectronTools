const {BrowserWindow, ipcMain} = require('electron')
const url = require('url');
const path = require('path');
const https = require('https');

const config = require('../../common/js/config').file('plugins/oneWord');
let oneWord = config.get("oneWord")

const oneWordWindow = {
    creat: function(){
        this.win = new BrowserWindow({
            width: 800,
            height: 550,
            frame: false,
            show: false,
            // resizable: false,
            maximizable: false,
            minimizable: false,
            closable: false,
            fullscreenable: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            // transparent: true,
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
            this.win.show()
        })
        this.win.on('blur', () => {
            this.callback()
        })
    },
    hitokoto: function() {
        let resData = ""
        let req = https.get("https://v1.hitokoto.cn/?c=" + oneWord.hitokoto, res => {
            res.on('data',function(data){
                try {
                    resData += data;
                } catch (error) {
                    // console.log(error);
                }
            })
            res.on('end',function(){  
                let resJson = JSON.parse(resData);
                // console.log(resJson);
                oneWordWindow.win.webContents.send("readyChange", {
                    "word": resJson.hitokoto,
                    "from": resJson.from
                })
            })
        })
        req.on("error", _ => {

        })
    },
    show: function(){
        this.creat()
    },
    init: function(callback){
        this.callback = callback
    }
}

ipcMain.on("oneWordRefresh", (event, arg) => {
    oneWordWindow.hitokoto()
})

module.exports = oneWordWindow