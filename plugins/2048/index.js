const {remote, ipcRenderer} = require('electron')

const config = require('../../common/js/config').file('plugins/2048');

const $ = require('../../common/js/domUtils')

let gameState = config.get()

//同步state
function stateSync() {
    config.set(null, gameState)
}

function ID(id) {
    return document.getElementById(id)
}

//游戏大小
let size = 4
//初始化方块数量
let startTiles = 2
//本轮加分
let moveScore = 0

//游戏区域
let tilesNode = ID("tiles")

// 本次按键是否有可移动的方块
let movable = false

/**
 * 按键进行游戏 方向键 wsad
 */

//绑定按键事件
document.onkeydown = keydownFunc

// 按键事件
function keydownFunc(e) {
    //默认无方向
    let arrow = getPositionData(0, 0)
    switch(e.keyCode) {
        // 方向上 / W
        case $.keyCode.w_W :
        case $.keyCode.Up :
            arrow.y = 1
            break
        // 方向下 / S
        case $.keyCode.s_S :
        case $.keyCode.Down :
            arrow.y = -1
            break
        // 方向左 / A
        case $.keyCode.a_A :
        case $.keyCode.Left :
            arrow.x = 1
            break
        // 方向右 / D
        case $.keyCode.d_D :
        case $.keyCode.Right :
            arrow.x = -1
            break
        default :
            return
    }

    cleanUselessTiles()

    // 网格遍历方向
    let grid = {
        x: [],
        y: []
    }

    for (let i = 0; i < size; i++) {
        grid.x.push(i)
        grid.y.push(i)
    }

    // 根据方向修改遍历方向
    -1 === arrow.x && grid.x.reverse();
    -1 === arrow.y && grid.y.reverse();
    
    // 开始遍历方块
    if(arrow.x == 0) {
        for(let x of grid.x) {
            for(let y of grid.y) {
                moveTiles(x, y, arrow)
            }
        }
    }else if(arrow.y == 0) {
        for(let y of grid.y) {
            for(let x of grid.x) {
                moveTiles(x, y, arrow)
            }
        }
    }
    addScore()
    movable ? addRandomTile() : gameOver()
}

// 清理无用的方块
function cleanUselessTiles() {

    let nodes = tilesNode.getElementsByClassName("tile-merged")
    while(nodes.length > 0){
        nodes[0].classList.remove("tile-merged")
    }

    nodes = tilesNode.getElementsByClassName("tile-new")
    while(nodes.length > 0){
        nodes[0].classList.remove("tile-new")
    }

    nodes = tilesNode.getElementsByClassName("tile-useless")
    while(nodes.length > 0){
        nodes[0].remove()
    }

    movable = false
    moveScore = 0
}

// 移动方块判断逻辑
function moveTiles(x, y, arrow) {
    // 寻找下一个有值的方块
    let next = nextValuableTile(x, y, arrow)
    if(!next) return
    // 如果当前方块为空
    if(gameState.cells[x][y] == null) {
        // 移动位置,在当前位置再次寻找
        moveTile(next, getPositionData(x, y))
        moveTiles(x, y, arrow)
    // 当前方块有值
    }else if(gameState.cells[x][y].v == gameState.cells[next.x][next.y].v){
        moveTile(next, getPositionData(x, y), true)
    }
}

// 移动方块
function moveTile(oldPosition, newPosition, merged) {
    movable = true
    // 修改方块class
    let node = tilesNode.getElementsByClassName("tile-position-" + oldPosition.x + "-" + oldPosition.y)[0]
    
    //修改游戏状态
    let data = gameState.cells[oldPosition.x][oldPosition.y]
    gameState.cells[oldPosition.x][oldPosition.y] = null
    data.p = newPosition

    if(merged) {
        data.v = data.v * 2
        node.classList.add("tile-useless")
        tilesNode.getElementsByClassName("tile-position-" + newPosition.x + "-" + newPosition.y)[0].classList.add("tile-useless")
        addTile(newPosition, data.v, true)
        moveScore += data.v
    }
    gameState.cells[newPosition.x][newPosition.y] = data
    
    node.classList.add("tile-position-" + newPosition.x + "-" + newPosition.y)
    node.classList.remove("tile-position-" + oldPosition.x + "-" + oldPosition.y)
}

// 查找下一个有值的方块
function nextValuableTile(x, y, arrow) {
    x = x + arrow.x
    y = y + arrow.y
    if(x < 0 || x == size || y < 0 || y == size)
        return null
    if(gameState.cells[x][y] == null) {
        return nextValuableTile(x, y, arrow)
    }else {
        return getPositionData(x, y)
    }
}

//加分
let addScoreTimeout
function addScore() {
    if(moveScore > 0) {
        ID("moveScore").textContent = "+" + moveScore
        addScoreTimeout = undefined
        ID("moveScore").classList.add("hide")
        ID("moveScore").classList.remove("hide")
        addScoreTimeout = setTimeout(_ => {
            ID("moveScore").classList.add("hide")
        }, 800)
        let score = gameState.score + moveScore
        gameState.score = score
        ID("score").textContent = score
        if(score > gameState.best) {
            ID("best").textContent = score
            gameState.best = score
        }
    }
}

// 游戏结束判断
function gameOver() {
    // 当前无空的格子
    if(getAvailableCells().length == 0) {
        for (let x = 0; x < size; x ++) {
            for (let y = 0; y < size; y ++) {
                let tileValue = gameState.cells[x][y].v
                let sides = []
                sides.push(nextValuableTile(x, y, getPositionData(0, 1)))
                sides.push(nextValuableTile(x, y, getPositionData(0, -1)))
                sides.push(nextValuableTile(x, y, getPositionData(1, 0)))
                sides.push(nextValuableTile(x, y, getPositionData(-1, 0)))
                for(let side of sides) {
                    if(side && tileValue == gameState.cells[side.x][side.y].v) {
                        // 存在可移动的块
                        return
                    }
                }
            }
        }
        // 游戏结束
        gameState.over = true
        ID("message").classList.remove("hide")
        document.onkeydown = null
        stateSync()
    }
}

// 创建位置位置对象
function getPositionData(x, y) {
    return {
        "x": x,
        "y": y
    }
}

// 创建位置位置对象
function getTileData(position, value) {
    return {
        "p": position,
        "v": value
    }
}

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

// 初始化计分板
function initScore() {
    ID("score").textContent = gameState.score
    ID("best").textContent = gameState.best
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
    let tile = cells[Math.floor(Math.random() * cells.length)]
    addTile(tile, tileValue)
    gameState.cells[tile.x][tile.y] = getTileData(tile, tileValue)
    stateSync()
}

//获取当前为空的块
function getAvailableCells() {
    let cells = []
    for (let x = 0; x < size; x ++) {
        for (let y = 0; y < size; y ++) {
            if(gameState.cells[x][y] == null) {
                cells.push(getPositionData(x, y))
            }
        }
    }
    return cells
}

//添加方块
function addTile(cell, value, merged) {
    gameState.cells[cell.x][cell.y] = getTileData(cell, value)

    let tile = document.createElement("div")
    let inner = document.createElement("div")

    inner.classList.add("tile-inner")
    inner.textContent = value

    tile.appendChild(inner)

    tile.classList.add("tile")
    tile.classList.add("tile-" + value)
    tile.classList.add("tile-position-" + cell.x + "-" + cell.y)
    merged ? tile.classList.add("tile-merged") : tile.classList.add("tile-new")

    tilesNode.appendChild(tile)
}

//获取上次状态
if(gameState.over) {
    //创建新游戏
    initState()
    addStartTiles()
}else {
    //加载上次游戏进度
    loadState()
}

initScore()

// 重新开始游戏
ID("replay").onclick = function() {
    ID("message").classList.add("hide")
    document.onkeydown = keydownFunc
    tilesNode.innerHTML = ""
    initState()
    initScore()
    addStartTiles()
}

// 退出游戏
ID("close").onclick = ID("quit").onclick = function() {
    remote.getCurrentWindow().hide()
}