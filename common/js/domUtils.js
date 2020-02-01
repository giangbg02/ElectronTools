//根据ID查询node
function ID(id) {
    return document.getElementById(id)
}

//显示隐藏节点
function show(id) {
    let node = typeof id == "string" ? ID(id) : id
    node.classList.remove("hide")
}

//隐藏节点
function hide(id) {
    let node = typeof id == "string" ? ID(id) : id
    node.classList.add("hide")
}

//添加向节点末尾添加HTML
function appendHTML(node, html, clickCallback) {
    let temp = document.createElement("div")
    temp.innerHTML = html
    targetNode = temp.lastElementChild
    if(clickCallback) {
        targetNode.onclick = clickCallback
    }
    node.appendChild(targetNode)
}

//数字补位 一位数变两位数
function numAddZero(number) {
    return (Array(2).join(0) + number).slice(-2)
}

var keyCode = {
    "enter" : 13,
    "esc"   : 27
}