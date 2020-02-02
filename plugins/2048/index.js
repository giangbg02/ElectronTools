const {remote, ipcRenderer} = require('electron')

const config = require('../../common/js/config').file('plugins/2048');

let gameState = config.get()

//同步state
function stateSync() {
    config.set(null, gameState)
}

//游戏大小
let size = 4
//初始化方块数量
let startTiles = 2

//游戏区域
let tilesNode = ID("tiles")

/**
 * 初始化页面
 */

//初始化状态
function initState() {
    let cells = []
    let i,k = new Array(size);
    for (i of k) {
        let cell = []
        for (i of k) {
            cell.push(null)
        }
        cells.push(cell)
    }
    gameState = {
        "cells" : cells,
        "score" : 0,
        "over"  : false,
        "best"  : gameState.best || 0
    }
}

//游戏开始初始化方块
function addStartTiles() {
    for (let i of new Array(startTiles))
        addRandomTile()
}

//游戏开始加载方块
function loadState() {
    for(let cells of gameState.cells) {
        for(let cell of cells) {
            cell && addTile(cell.p, cell.v)
        }
    }
}

//随机添加方块
function addRandomTile() {
    let tileValue = 0.9 > Math.random() ? 2 : 4
    let cells = getAvailableCells()
    addTile(cells[Math.floor(Math.random() * cells.length)], tileValue)
    
}

//获取当前为空的块
function getAvailableCells() {
    let cells = []
    for (let x = 0; x < size; x ++) {
        for (let y = 0; y < size; y ++) {
            if(gameState.cells[x][y] == null) {
                cells.push({
                    "x": x,
                    "y": y
                })
            }
        }
    }
    return cells
}

//添加方块
function addTile(cell, value) {
    gameState.cells[cell.x][cell.y] = {
        "p": cell,
        "v": value
    }

    let tile = document.createElement("div")
    let inner = document.createElement("div")

    inner.classList.add("tile-inner")
    inner.textContent = value

    tile.appendChild(inner)

    tile.classList.add("tile")
    tile.classList.add("tile-" + value)
    tile.classList.add("tile-position-" + cell.x + "-" + cell.y)
    tile.classList.add("tile-new")

    tilesNode.appendChild(tile)
}

//获取上次状态
if(gameState.over) {
    //创建新游戏
    initState()
    addStartTiles()
    stateSync()
}else {
    //加载上次游戏进度
    loadState()
}