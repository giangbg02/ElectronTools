const {remote, ipcRenderer} = require('electron')

const config = require('../common/js/config').file('config');

var plugins = config.get("plugins")

//同步插件信息
function sycnPlugins() {
    config.set("plugins", plugins)
}

//初始化页面元素
function creatItems() {
    var usable = document.getElementById("usable")
    var unusable = document.getElementById("unusable")

    usable.innerHTML = ""
    unusable.innerHTML = ""

    for(var i=0; i<plugins.length; i++) {
        let plugin = plugins[i]

        let pluginPath = "../plugins/" + plugin.code

        let div = document.createElement("div")
        let img = document.createElement("img")
        let span = document.createElement("span")
    
        span.appendChild(document.createTextNode(plugin.name))
        img.src = pluginPath + "/img/logo-64.png"
        div.title = plugin.name
        div.classList.add("item")
    
        div.appendChild(img)
        div.appendChild(span)
    
        plugin.usable ? usable.appendChild(div) : unusable.appendChild(div)

        div.onclick = function() {
           remote.getCurrentWindow().hide()
           ipcRenderer.send('hide-main-window', '')
           ipcRenderer.send('show-plugin-window', plugin.code)
        }

    }
}

creatItems()