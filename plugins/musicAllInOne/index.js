const {remote, ipcRenderer, shell, nativeImage} = require('electron')
const http = require('http');
const request = require('request');
const path = require('path');
const fs = require('fs');
const { Menu, MenuItem } = remote

const config = require('../../common/js/config').file('plugins/musicAllInOne');

var playerConfig = config.get("playerConfig")
var playerStatus = config.get("playerStatus")
var musicSearch = config.get("musicSearch")
var musicLocal = config.get("musicLocal")
var musicHistory = config.get("musicHistory")

/**
 * 基础方法
 */

//同步播放设置
function configSync() {
    config.set("playerConfig", playerConfig)
}

//同步播放状态
function statusSync() {
    config.set("playerStatus", playerStatus)
}

//同步查询结果
function searchSync() {
    config.set("musicSearch", musicSearch)
}

//同步本地列表
function localSync() {
    config.set("musicLocal", musicLocal)
}

//同步播放历史
function historySync() {
    config.set("musicHistory", musicHistory)
}

//网站代码转名称
function siteCodeToName(site) {
    let name = ""
    switch (site) {
        case 'netease':
            name = "网易云"
            break;
        case 'qq':
            name = "QQ音乐"
            break;
    }
    return name
}

//时长格式化
function timeFormate(time) {
    return numAddZero(parseInt(time / 60)) + ":" + numAddZero(time % 60)
}

//上次收听时间格式化
function lastTimeFormat(time) {
    let between = Date.parse(new Date()) - time
    if(between < 1000 * 60) {
        return "刚刚"
    }else if(between < 1000 * 60 * 60) {
        return parseInt(between /(1000 * 60)) + "分钟前"
    }else if(between < 1000 * 60 * 60 * 24) {
        return parseInt(between /(1000 * 60 * 60)) + "小时前"
    }else {
        let last = new Date(time)
        return last.getFullYear() + "-" + numAddZero(last.getMonth() + 1) + "-" + numAddZero(last.getDate())
    }
}

//根据歌曲信息生成歌曲链接
function getLocalMusicFileInfo(data) {
    let file = data.name + "-" + data.author
    return {
        "file"  : file,
        "music" : playerConfig.localURL + "music/" + file + "." + data.mtype,
        "pic"   : playerConfig.localURL + "pic/" + file + "." + data.ptype,
        "lrc"   : playerConfig.localURL + "lrc/" + file + ".lrc",
    }
}

/**
 * 功能列表点击展示对应功能
 */

var currentContainer = "musicPlayFunc"
//正在播放功能点击
ID("musicPlayFunc").onclick = function(e) {
    if(currentContainer != "musicPlayFunc") {
        show("musicPlayContainer")
        hide("musicListContainer")
        hide("musicSearchCondition")
        this.classList.add("hover")
        ID(currentContainer).classList.remove("hover")
        currentContainer = "musicPlayFunc"
        ID("musicLrcUl").scrollTop = lrcNodes[currentLrcLine].offsetTop - 251
    }
}

//音乐搜索功能点击
ID("musicSearchFunc").onclick = function(e) {
    if(currentContainer != "musicSearchFunc") {
        hide("musicPlayContainer")
        show("musicListContainer")
        show("musicSearchCondition")
        this.classList.add("hover")
        ID(currentContainer).classList.remove("hover")
        currentContainer = "musicSearchFunc"

        ID("musicListOl").innerHTML = ""
        let ol = document.createElement("li")

        appendHTML(ol,"<span style='width: 30px;'>序号</span>")
        appendHTML(ol,"<span style='width: 200px;'>标题</span>")
        appendHTML(ol,"<span style='width: 130px;'>歌手</span>")
        appendHTML(ol,"<span style='width: 60px;'>网站</span>")
        appendHTML(ol,"<span style='width: 60px;'>时长</span>")
        appendHTML(ol,"<span style='width: 60px;'>操作</span>")

        ID("musicListOl").appendChild(ol)

        ID("musicListUl").innerHTML = ""
        
        buildSearchResultList()
    }
}

//本地音乐功能点击
ID("musicLocalFunc").onclick = function(e) {
    hide("musicPlayContainer")
    show("musicListContainer")
    hide("musicSearchCondition")
    if(currentContainer != "musicLocalFunc") {
        this.classList.add("hover")
        ID(currentContainer).classList.remove("hover")
        currentContainer = "musicLocalFunc"
        ID("musicListOl").innerHTML = ""
        let ol = document.createElement("li")

        appendHTML(ol,"<span style='width: 30px;'>序号</span>")
        appendHTML(ol,"<span style='width: 230px;'>标题</span>")
        appendHTML(ol,"<span style='width: 180px;'>歌手</span>")
        appendHTML(ol,"<span style='width: 60px;'>时长</span>")
        appendHTML(ol,"<span style='width: 60px;'>操作</span>")

        ID("musicListOl").appendChild(ol)

        ID("musicListUl").innerHTML = ""
        
        for (let index = 0; index < musicLocal.length; index++) {
            let data = musicLocal[index]
    
            let li = document.createElement("li")
    
            appendHTML(li, "<span style='width: 30px;'>" + (index + 1) + "</span>")
            appendHTML(li, "<span style='width: 230px;'>" + data.name + "</span>")
            appendHTML(li, "<span style='width: 180px;'>" + data.author + "</span>")
            appendHTML(li, "<span style='width: 60px;'>" + timeFormate(data.time) + "</span>")
            appendHTML(li, "<div class='delete'></div>", _ =>{
                remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                    // type        : "question",
                    buttons     : ["删除", "取消"],
                    defaultId   : 1,
                    title       : "删除歌曲",
                    message     : "是否删除歌曲" + data.name,
                    // detail      : "detail",
                    // icon        : nativeImage.createFromPath(path.join(__dirname, "./img/delete-hover.png")),
                    cancelId    : 1,
                    noLink      : true
                }).then(data => {
                    return new Promise(resolve => {
                        console.log(data.response)
                        if(data.response == 0) {
                            musicDelete(index)
                        }
                        resolve()
                    })
                    
                })
            })
            
            li.ondblclick = function(e) {
                buildSetMusicInfo(index, true)
            }
    
            ID("musicListUl").appendChild(li)
        }
    }
}

//播放历史功能点击
ID("musicHistoryFunc").onclick = function(e) {
    hide("musicPlayContainer")
    show("musicListContainer")
    hide("musicSearchCondition")
    if(currentContainer != "musicHistoryFunc") {
        this.classList.add("hover")
        ID(currentContainer).classList.remove("hover")
        currentContainer = "musicHistoryFunc"
        ID("musicListOl").innerHTML = ""
        let ol = document.createElement("li")

        appendHTML(ol,"<span style='width: 30px;'>序号</span>")
        appendHTML(ol,"<span style='width: 230px;'>标题</span>")
        appendHTML(ol,"<span style='width: 180px;'>歌手</span>")
        appendHTML(ol,"<span style='width: 120px;'>上次收听</span>")

        ID("musicListOl").appendChild(ol)

        ID("musicListUl").innerHTML = ""

        for (let index = 0; index < musicHistory.length; index++) {
            let data = musicHistory[index]
    
            let li = document.createElement("li")
    
            appendHTML(li, "<span style='width: 30px;'>" + (index + 1) + "</span>")
            appendHTML(li, "<span style='width: 230px;'>" + data.name + "</span>")
            appendHTML(li, "<span style='width: 180px;'>" + data.author + "</span>")
            appendHTML(li, "<span style='width: 120px;'>" + lastTimeFormat(data.last) + "</span>")
    
            ID("musicListUl").appendChild(li)
        }
    }
}

//构建查询结果列表
function buildSearchResultList(startIndex) {

    if(ID("musicListUl").children.length == 0 && musicSearch.data.length > 0) {
        appendHTML(ID("musicListUl"), "<li><span style='width: 600px;text-align: center;'>加载下一页</span></li>", _ => {
            musicSearch.page = musicSearch.page + 1
            musicSearchResult()
        })
    }

    var loadPageLi = ID("musicListUl").lastElementChild

    for (let index = startIndex || 0; index < musicSearch.data.length; index++) {
        let data = musicSearch.data[index]

        let li = document.createElement("li")

        appendHTML(li, "<span style='width: 30px;'>" + (index + 1) + "</span>")
        appendHTML(li, "<span style='width: 200px;'>" + data.name + "</span>")
        appendHTML(li, "<span style='width: 130px;'>" + data.author + "</span>")
        appendHTML(li, "<span style='width: 60px;'>" + siteCodeToName(data.site) + "</span>")
        appendHTML(li, "<span style='width: 60px;'>" + timeFormate(data.time) + "</span>")
        appendHTML(li, "<div class='link'></div>", _ => {
            openLink(data.link)
        })

        var localIndex = musicLocal.length ? musicLocal.findIndex(item => { return item.name == data.name && item.author == data.author }) : -1

        if(localIndex < 0) {
            //歌曲信息可能过期,需要重新获取
            // data = getNewMusicDataInfo()
            appendHTML(li, "<div class='download'></div>", _ => {
                musicLocal.unshift({
                    "name"  : data.name,
                    "author": data.author,
                    "mtype" : data.mtype,
                    "ptype" : data.ptype,
                    "time"  : data.time
                })
                downloadMusicFiles(data, _ => {
                    li.lastChild.remove()
                })
                localSync()
                playerStatus.index = playerStatus.index + 1
                statusSync()
            })
        }
        
        li.ondblclick = function(e) {
            setMusicInfo(data.name, data.author, data.time, data.url, data.pic, data.lrc, true, false)
        }

        ID("musicListUl").insertBefore(li, loadPageLi)
    }
    ID("musicListUl").scrollTop = ID("musicListUl").scrollHeight
}

/**
 * 标题栏功能
 */

//最小化
ID("min").onclick = function() {
    remote.getCurrentWindow().minimize()
}

//关闭
ID("close").onclick = function() {
    remote.getCurrentWindow().hide()
}

//选择网站select
ID("musicSearchSite").onfocus = function(){
    show("musicSearchSiteUl")
}
ID("musicSearchSite").onblur = function(){
    setTimeout(_ => {
        hide("musicSearchSiteUl")
    }, 200)
}

//模拟option点击事件
let musicSearchSiteLiList = ID("musicSearchSiteUl").children
for(var i=0;i<musicSearchSiteLiList.length;i++){
    musicSearchSiteLiList[i].onclick = function(){
        ID("musicSearchSite").value = this.innerText
        ID("musicSearchSiteValue").value = this.getAttribute('to')
    }
}

//选择查询方式select
ID("musicSearchType").onfocus = function(){
    show("musicSearchTypeUl")
}
ID("musicSearchType").onblur = function(){
    setTimeout(_ => {
        hide("musicSearchTypeUl")
    }, 200)
}

//模拟option点击事件
let musicSearchTypeLiList = ID("musicSearchTypeUl").children
for(var i=0;i<musicSearchTypeLiList.length;i++){
    musicSearchTypeLiList[i].onclick = function(){
        ID("musicSearchType").value = this.innerText
        ID("musicSearchTypeValue").value = this.getAttribute('to')
    }
}

//输入框回车
ID("musicSearchInput").onkeydown = function(e) {
    if(e.keyCode == keyCode.enter) {
        ID("musicSearchBtn").click()
    }
}

//点击查询按钮
ID("musicSearchBtn").onclick = function(e) {

    if(ID("musicSearchInput").value.trim() == "") {
        ID("musicSearchInput").value = ""
        return
    }

    musicSearch = {
        "query" : ID("musicSearchInput").value,
        "type"  : ID("musicSearchTypeValue").value,
        "site"  : ID("musicSearchSiteValue").value,
        "page"  : 1,
        "data"  : []
    }

    ID("musicListUl").innerHTML = ""

    musicSearchResult()
}

/**
 * 音乐播放页
 */

//设置歌词
let currentLrcLine = -1
let currentLrcContext = ""
let lrcLines = []
let lrcNodes = []
function setMusicLrc(lrc) {
    // console.log(lrc)
    let musicLrcUl = ID("musicLrcUl")
    musicLrcUl.innerHTML = ""
    //将文本分隔成一行一行，存入数组
    var lines = lrc.split('\n'),
    //用于匹配时间的正则表达式，匹配的结果类似[xx:xx.xx]
    pattern = /\[\d{2}:\d{2}(.\d{1,3})?\]/g;
    //切换歌曲时初始化所有状态
    currentLrcLine = -1
    currentLrcContext = ""
    lrcLines = []
    lrcNodes = []
    musicLrcUl.classList.remove("noPadding")
    //去掉头尾不含时间的行 同一个正则多次test会有问题 所以加了个 !(pattern.lastIndex = 0) 重置 index
    while (lines.length > 0 && !(pattern.lastIndex = 0) && !pattern.test(lines[0])) {
        lines = lines.slice(1);
    };
    while (lines.length > 0 && !(pattern.lastIndex = 0) && !pattern.test(lines[lines.length - 1])) {
        lines.pop();
    };
    if(lines.length > 0){
        lines.forEach(function(v /*数组元素值*/ , i /*元素索引*/ , a /*数组本身*/ ) {
            //提取出时间[xx:xx.xx]
            var time = v.match(pattern),
                //提取歌词
                value = v.replace(pattern, '');
            //因为一行里面可能有多个时间，所以time有可能是[xx:xx.xx][xx:xx.xx][xx:xx.xx]的形式，需要进一步分隔
            time.forEach(function(v1, i1, a1) {
                //去掉时间里的中括号得到xx:xx.xx
                var t = v1.slice(1, -1).split(':');
                //将结果压入最终数组
                //空行是否需要排除,暂时先排除了  注意文件行尾格式为 LF
                if(value != ""){
                    lrcLines.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]), value]);
                }
            });
        });
        //最后将结果数组中的元素按时间大小排序，以便保存之后正常显示歌词
        lrcLines.sort(function(a, b) {
            return a[0] - b[0];
        });
        for(var i=0;i<lrcLines.length;i++){
            appendHTML(musicLrcUl, "<li>" + lrcLines[i][1] + "</li>")
        }
        lrcNodes = musicLrcUl.children
        currentLrcContext = lrcLines[0][0] == 0 ? lrcLines[0][1] : ""
        // musicLrcUl.firstChild.classList.add("current")
    }else{
        //当歌词内无时间。全部展示
        lines = lrc.split('\n')
        if(lines.length > 0){
            for(var i=0;i<lines.length;i++){
                appendHTML(musicLrcUl, "<li>" + lines[i] + "</li>")
            }
            musicLrcUl.classList.add("noPadding")
            currentLrcContext = "请打开主界面查看歌词"
            if(playerStatus.desktopLrc) {
                currentLrcFunc()
            }
        }else{
            appendHTML(musicLrcUl, "<li>暂无歌词</li>")
            musicLrcUl.firstChild.classList.add("current")
            currentLrcContext = "暂无歌词"
            if(playerStatus.desktopLrc) {
                currentLrcFunc()
            }
        }
    }
}

/**
 * 音乐列表页
 */

//查询歌曲构建列表
function musicSearchResult() {
    
    let queryString  =  "query=" + musicSearch.query + 
                        "&type=" + musicSearch.type + 
                        "&site=" + musicSearch.site + 
                        "&page=" + musicSearch.page

    let resData = ""
    var req = http.get("http://localhost:8088/music?" + queryString, function(res){  
        res.on('data',function(data){
            try {
                resData += data;
            } catch (error) {
                console.log(error);
            }
        })
        res.on('end',function(){
            let resJson = JSON.parse(resData);
            console.log(resJson)
            if(resJson.code == 200) {
                let datas = resJson.data
                musicSearch.data.push(...datas)
                buildSearchResultList(musicSearch.page * 10 - 10)
                searchSync()
            }
        })
    })
    req.on('error',function(err){
        console.log(err)
    })
}

//下载歌曲相关文件
function downloadMusicFiles(data, callback) {

    let musicInfo = getLocalMusicFileInfo(data)

    new Promise(resolve => {
        request(data.url).pipe(fs.createWriteStream(musicInfo.music)).on('finish', () => {
            console.log(musicInfo.file + '歌曲完成');
            resolve()
        })
    }).then( _ => {
        return new Promise(resolve => {
            request(data.pic).pipe(fs.createWriteStream(musicInfo.pic)).on('finish', () => {
                console.log(musicInfo.file + '封面完成');
                resolve()
            })
        })
    }).then( _ => {
        return new Promise(resolve => {
            fs.writeFileSync(musicInfo.lrc, data.lrc)
            console.log(musicInfo.file + '歌词完成');
            resolve()
        })
    }).finally( _ => {
        if(callback) {
            callback()
            console.log('回调');
        }
    })
}

//组建设置歌曲信息
function buildSetMusicInfo(index, autoPlay) {
    
    let data = musicLocal[index]
    let musicInfo = getLocalMusicFileInfo(data)
    setMusicInfo(data.name, data.author, data.time, musicInfo.music, musicInfo.pic, musicInfo.lrc, autoPlay, true)
    if(index != playerStatus.index) {
        playerStatus.index = index
        statusSync()
    }
}

//设置歌曲
function setMusicInfo(name, author, time, musicURL, picURL, lrcURL, autoPlay, lrcNeedTrans) {

    if(lrcNeedTrans){
        lrcURL = fs.readFileSync(lrcURL, "UTF-8")
    }
    
    ID("musicAudio").pause()
    setMusicLrc(lrcURL)
    ID("musicAudio").src = musicURL
    ID("funcMusicPic").src = picURL
    ID("funcMusicName").innerText = name
    ID("funcMusicAuthor").innerText = author
    document.title = name + "-" + author
    setMusicTime(time)
    if(autoPlay) {
        ID("musicAudio").play()
        ID("playMusic").classList.add("pause")
        musicHistorySort(name, author)
    }
}

//播放历史排序
function musicHistorySort(name, author) {
    let index = musicHistory.length ? musicHistory.findIndex(item => { return item.name == name && item.author == author }) : -1
    if(index < 0) {
        musicHistory.unshift({
            "name": name,
            "author": author,
            "last": Date.parse(new Date())
        })
    }else {
        let data = musicHistory.splice(index, 1)[0]
        data.last = Date.parse(new Date())
        musicHistory.unshift(data)
    }
    if(musicHistory.length > 100){
        musicHistory.pop()
    }
    historySync()
}

//设置歌曲时间
function setMusicTime(time) {
    ID("playRange").max = time
    ID("musicDuraTime").innerText = timeFormate(time)
}

//在浏览器中打开链接
function openLink(url) {
    shell.openExternal(url);
}

//音乐删除
function musicDelete(index) {

    let data = musicLocal.splice(index, 1)[0]

    if(playerStatus.index == index) {
        unlinkLocalMusic()
        playerStatus.index = playerStatus.index - 1
        nextMusic()
    }else if(playerStatus.index > index) {
        playerStatus.index = playerStatus.index - 1
        statusSync()
    }


    let musicInfo = getLocalMusicFileInfo(data)
    fs.unlinkSync(musicInfo.music)
    fs.unlinkSync(musicInfo.pic)
    fs.unlinkSync(musicInfo.lrc)

    localSync()
}

//解除本地文件占用
function unlinkLocalMusic() {
    ID("musicAudio").pause()
    ID("musicAudio").src = ""
}

/**
 * 底部播放功能
 */

//上一曲
ID("prevMusic").onclick = prevMusic

//上一曲方法
function prevMusic() {
    
    let index = -1

    if(musicLocal.length == 0) {
        return
    }else if(musicLocal.length == 1){
        buildSetMusicInfo(0, true)
        return
    }
    if(playerStatus.mode == "random") {
        while(index == playerStatus.index || index == -1) {
            index = Math.floor(Math.random() * musicLocal.length)
        }
    }else {
        index = playerStatus.index - 1
        if(index < 0) {
            index = musicLocal.length - 1
        }
    }
    buildSetMusicInfo(index, true)
}

//播放 暂停
ID("playMusic").onclick = function(e) {
    if(this.classList.contains("pause")) {
        ID("musicAudio").pause()
    }else {
        ID("musicAudio").play()
    }
    this.classList.toggle("pause")
}

//下一曲 按钮点击
ID("nextMusic").onclick = nextMusic

//下一曲方法
function nextMusic() {

    let index = -1

    if(musicLocal.length == 0) {
        return
    }else if(musicLocal.length == 1){
        buildSetMusicInfo(0, true)
        return
    }

    if(playerStatus.mode == "random") {
        while(index == playerStatus.index || index == -1) {
            index = Math.floor(Math.random() * musicLocal.length)
        }
    }else {
        index = playerStatus.index + 1
        if(index == musicLocal.length) {
            index = 0
        }
    }
    buildSetMusicInfo(index, true)
}

//播放进度条
ID("playRange").oninput = function(e) {
    isMoving = true
    playRangeInput()
}

//正在移动进度条
var isMoving = false
function playRangeInput() {
    let playRange = ID("playRange")
    ID("musicCurrTime").innerText = timeFormate(playRange.value)
    playRange.style.backgroundSize = playRange.value / playRange.max * 100 + "% 100%"
}

//停止移动进度条
ID("playRange").onmouseup = function(e) {
    ID("musicAudio").pause();
    ID("musicAudio").currentTime = this.value;
    ID("musicAudio").play();
    ID("playMusic").classList.add("pause")
    isMoving = false
}

//静音
ID("musicMute").onclick = function(e) {
    let volumeRange = ID("volumeRange")
    if(this.classList.contains("mute")){
        volumeRange.value = playerStatus.volume
    }else {
        volumeRange.value = 0
    }
    volumeRangeInput()
    statusSync()
}

//音量调节
ID("volumeRange").oninput = volumeRangeInput
function volumeRangeInput() {
    let volume =  ID("volumeRange")
    let volumeVal =  volume.value
    if(volumeVal != "0") {
        ID("musicMute").classList.remove("mute")
        playerStatus.mute = false
    }else {
        ID("musicMute").classList.add("mute")
        playerStatus.mute = true
    }
    ID("musicVolume").innerText = volumeVal
    volume.style.backgroundSize = volumeVal + "% 100%"
    ID("musicAudio").volume = (volumeVal - 0) / 100
}

//音量调节完成
ID("volumeRange").onmouseup = function() {
    playerStatus.volume = this.value
    statusSync()
}

//播放模式
ID("playMode").onclick = function(e) {
    if(this.classList.contains("list")){
        this.classList.remove("list")
        this.classList.add("random")
        playerStatus.mode = "random"
    }else if(this.classList.contains("random")){
        this.classList.remove("random")
        this.classList.add("single")
        playerStatus.mode = "single"
    }else if(this.classList.contains("single")){
        this.classList.remove("single")
        this.classList.add("list")
        playerStatus.mode = "list"
    }
    statusSync()
}

//桌面歌词
ID("musicLrc").onclick = function(e) {
    if(this.classList.contains("hover")) {
        destroyLrcWindow()
        playerStatus.desktopLrc = false
    }else {
        creatLrcWindow()
        playerStatus.desktopLrc = true
    }
    statusSync()
    this.classList.toggle("hover")
}

//播放完成
ID("musicAudio").onended = function(e) {
    if(playerStatus.mode == "single") {
        ID("musicAudio").play()
    }else {
        nextMusic()
    }
}

//播放进度随时间变化
ID("musicAudio").ontimeupdate = function(e) {
    let currentTime = this.currentTime
    if(!isMoving){
        ID("playRange").value = currentTime
        playRangeInput()
    }
    if(lrcLines.length > 0) {
        //歌词偏移量 正数提前 负数延迟
        let lrcOffset = 0.1
        let currentIndex = -1
        for (var index = 0; index < lrcLines.length; index++) {
            //当前时间 < 歌词行
            if (currentTime < lrcLines[index][0] - lrcOffset) {
                currentIndex = index - 1
                break
            }
            //最后一行
            if(index == lrcLines.length - 1) {
                currentIndex = index
                break
            }
        }
        if(currentIndex >= 0 && currentLrcLine != currentIndex) {
            if(currentLrcLine >= 0) {
                lrcNodes[currentLrcLine].classList.remove("current")
            }
            lrcNodes[currentIndex].classList.add("current")
            ID("musicLrcUl").scrollTop = lrcNodes[currentIndex].offsetTop - 251
            currentLrcContext = lrcLines[currentIndex][1]
            if(playerStatus.desktopLrc) {
                currentLrcFunc()
            }
        }
        currentLrcLine = currentIndex
    }
}

//创建桌面歌词 向主进程通信
function creatLrcWindow() {
    ipcRenderer.send("creatLrcWindow", {
        "lrc": currentLrcContext,
        "position": playerStatus.desktopLrcPosition,
        "locked": playerStatus.desktopLrcLocked
    })
}

//同步桌面歌词 向主进程通信
function currentLrcFunc() {
    ipcRenderer.send("currentLrc", currentLrcContext)
}

//销毁桌面歌词 向主进程通信
function destroyLrcWindow() {
    ipcRenderer.send("destroyLrcWindow")
}

//桌面歌词移动时 记录移动后位置
ipcRenderer.on("lrcWindowMovePosition", (event, args) => {
    if(args[0] != playerStatus.desktopLrcPosition[0] || args[1] != playerStatus.desktopLrcPosition[1]) {
        playerStatus.desktopLrcPosition = args
        statusSync()
    }
})

/**
 * 页面右键上下文菜单
 */

document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    let menu = new Menu()

    console.log(e.srcElement.id)

    //桌面歌词 解锁/锁定 时 记录状态
    if(e.srcElement.id == "musicLrc") {
        if(playerStatus.desktopLrcLocked) {
            menu.append(new MenuItem({
                label: '解锁桌面歌词',
                click(){
                    playerStatus.desktopLrcLocked = false
                    ipcRenderer.send("lockLrcWindow", false)
                    statusSync()
                }
            }))
        }else {
            menu.append(new MenuItem({
                label: '锁定桌面歌词',
                click(){
                    playerStatus.desktopLrcLocked = true
                    ipcRenderer.send("lockLrcWindow", true)
                    statusSync()
                }
            }))
        }
        menu.popup({ window: remote.getCurrentWindow() })
    }

}, false)

/**
 * 页面初始化
 */

show("musicPlayContainer")

//初始化播放设置


//初始化音量
ID("volumeRange").value = playerStatus.mute ? "0" : playerStatus.volume
volumeRangeInput()

//初始化音乐列表播放模式
ID("playMode").classList.add(playerStatus.mode)

//初始化歌曲
if(playerStatus.index >= 0) {
    buildSetMusicInfo(playerStatus.index, false)
}

//初始化桌面歌词
if(playerStatus.desktopLrc) {
    ID("musicLrc").classList.add("hover")
    creatLrcWindow()
}

/**
 * TODO
 * 
 * 任务栏鼠标悬停图片和按钮
 * 迷你模式
 * 从歌词当前位置播放
 * 背景 字体颜色 设置 
 *      背景 body background-img 
 *      .body background #fffffff5
 * 
 * 歌词空行删除 setMusicLrc
 * 歌词偏移设置 ontimeupdate
 * 当前歌词逻辑优化,减少循环,减轻cpu负担
 */