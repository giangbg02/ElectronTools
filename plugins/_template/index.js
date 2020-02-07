const {remote, ipcRenderer} = require('electron')

const config = require('../../common/js/config').file('plugins/_template');

/**
 * 标题栏按钮
 */

//设置
// document.getElementById("setting").onclick = toggleSetting

//最小化
ID("min").onclick = function() {
    remote.getCurrentWindow().minimize()
}
//最大化
ID("max").onclick = function() {
    max.classList.toggle("hide")
    resize.classList.toggle("hide")
    remote.getCurrentWindow().maximize()
}
//取消最大化
ID("resize").onclick = function() {
    max.classList.toggle("hide")
    resize.classList.toggle("hide")
    remote.getCurrentWindow().unmaximize()
}
//关闭
ID("close").onclick = function() {
    remote.getCurrentWindow().hide()
}