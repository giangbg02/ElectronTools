const {remote, ipcRenderer} = require('electron')
const cheerio = require('cheerio')
const iconv = require('iconv-lite')
const request = require('request')

const config = require('../../common/js/config').file('plugins/bookSpider');

const $ = require('../../common/js/domUtils')

let bookSourcesConfig = config.get("bookSources")

// 查询按钮点击
$("searchButton").click(function() {
    // 清空各个 form
    searchBook()
})

let nodes = {
    resultSourceUl: $("resultSourceUl"),
    resultBookUl: $("resultBookUl"),
    bookReplaceUl: $("bookReplaceUl"),
    bookChapterUl: $("bookChapterUl"),
    bookPreviewContainer: $("bookPreviewContainer")
}

// 查询书
function searchBook() {
    let searchName = $("searchName").value()
    let promises = []
    let bookSources = config.get("bookSources")
    for(let index = 0; index < bookSources.length; index ++) {
        let bookSource = bookSources[index]
        promises.push(
            new Promise((resolve, reject) => {
                searchBookRequest(bookSource, searchName, resolve)
            })
        )
    }
    Promise.all(promises).then((results) => {
        nodes.resultSourceUl.html("")
        for(let index = 0; index < results.length; index ++) {
            let bookSource = results[index]
            if(bookSource && bookSource.bookListInfo.maxIndex) {
                buildBookSource(bookSource)
            }
        }
    }).catch((error) => {
        console.log(error)
    })
}

// 根据书源查询
function searchBookRequest(bookSource, searchName, resolve) {
    // 搜索网址
    let ruleSearchUrl = bookSource.ruleSearchUrl

    searchName = convertAndEncode(searchName, bookSource.bookSourceEncoding)

    request({
        url: ruleSearchUrl + searchName,
        timeout: 3000
    }).on('response',function(res){
        if(res && res.statusCode != 200) {
            console.log("response")
            console.log(res.statusCode)
            resolve(null)
        }else {
            var chunks = [];
            res.on('data',function(chunk){
                chunks = chunks.concat(chunk);
            })

            res.on('end',function(){
                var buf = Buffer.concat(chunks);
                if(buf) {
                    //编码判断   // 转码
                    body = iconv.decode(buf, bookSource.bookSourceEncoding)
                    let $$ = cheerio.load(body)
                    let ruleSearchList = $$(bookSource.ruleSearchList)
                    let ruleSearchListLength = ruleSearchList.length
                    bookSource.bookListInfo = {
                        maxIndex: ruleSearchListLength,
                        currIndex: -1,
                        bookList: []
                    }
                    for(let index = 0; index < ruleSearchListLength; index ++) {
                        let book = ruleSearchList.eq(index)
                        bookSource.bookListInfo.bookList.push({
                            // TODO 公共解析方法
                            ruleSearchName: book.find(".s2 a").text(),
                            ruleSearchAuthor: book.find(".s4").text(),
                            ruleSearchKind: book.find(".s1").text(),
                            ruleSearchLastChapter: book.find(".s3 a").text(),
                            ruleSearchNoteUrl: book.find(".s2 a").attr("href")
                        })
                    }
                    resolve(bookSource)
                }else {
                    resolve(null)
                }
            })
        }
    }).on("error", function(error) {
        console.log("error")
        console.log(error)
        resolve(null)
    })
}

// 查询章节
function searchChapter(bookSource) {
    let ruleSearchNoteUrl = bookSource.bookListInfo.bookList[bookSource.bookListInfo.currIndex].ruleSearchNoteUrl
    new Promise((resolve, reject) => {
        searchChapterRequest(bookSource, ruleSearchNoteUrl, resolve)
    }).then(result => {
        console.log(result)
        buildBookChapter(bookSource)
    })
}

// 章节查询请求
function searchChapterRequest(bookSource, ruleSearchNoteUrl, resolve) {
    request({
        url: ruleSearchNoteUrl,
        timeout: 3000
    }).on('response',function(res){
        if(res && res.statusCode != 200) {
            console.log("response")
            console.log(res.statusCode)
            resolve(null)
        }else {
            var chunks = [];
            res.on('data',function(chunk){
                chunks = chunks.concat(chunk);
            })

            res.on('end',function(){
                var buf = Buffer.concat(chunks);
                if(buf) {
                    //编码判断   // 转码
                    body = iconv.decode(buf, bookSource.bookSourceEncoding)
                    let $$ = cheerio.load(body)
                    let ruleChapterList = $$(bookSource.ruleChapterList)
                    let ruleChapterListLength = ruleChapterList.length
                    let book = bookSource.bookListInfo.bookList[bookSource.bookListInfo.currIndex]
                    book.chapterInfo = {
                        maxIndex: ruleChapterListLength,
                        currIndex: -1,
                        chapterList: []
                    }
                    for(let index = 0; index < ruleChapterListLength; index ++) {
                        let chapter = ruleChapterList.eq(index)
                        book.chapterInfo.chapterList.push({
                            // TODO 公共解析方法
                            ruleChapterName: chapter.find("a").text(),
                            ruleContentUrl: chapter.find("a").attr("href")
                        })
                    }
                    resolve(bookSource)
                }else {
                    resolve(null)
                }
            })
        }
    }).on("error", function(error) {
        console.log("error")
        console.log(error)
        resolve(null)
    })
}

// 书内容
function searchContent(bookSource, ruleContentUrl) {
    nodes.bookPreviewContainer.text(ruleContentUrl)
}

// 书源列表
function buildBookSource(bookSource) {
    let li = $.creat("li")
    li.html("<span>" + bookSource.bookSourceName + "</span>")
    nodes.resultSourceUl.append(li, function() {
        buildBookInfo(bookSource)
    })
}

// 搜索书结果列表
function buildBookInfo(bookSource) {
    nodes.resultBookUl.html("")
    let bookList = bookSource.bookListInfo.bookList
    for(let index = 0; index < bookList.length; index ++) {
        let book = bookList[index]
        let li = $.creat("li")
        li.html("<span>" + book.ruleSearchName + "</span>")
        nodes.resultBookUl.append(li, function() {
            bookSource.bookListInfo.currIndex = index
            searchChapter(bookSource)
        })
    }
}

// 文字替换列表
function buildBookReplace() {

}

// 目录章节列表
function buildBookChapter(bookSource) {
    let chapterList = bookSource.bookListInfo.bookList[bookSource.bookListInfo.currIndex].chapterInfo.chapterList
    nodes.bookChapterUl.html("")
    for(let index = 0; index < chapterList.length; index ++) {
        let chapter = chapterList[index]
        let li = $.creat("li")
        li.html("<span>" + chapter.ruleChapterName + "</span>")
        nodes.bookChapterUl.append(li, function() {
            searchContent(bookSource, chapter.ruleContentUrl)
        })
    }
}

// utf8 转 gbk and encode
function convertAndEncode(utf8, encoding) {
    let convert = iconv.encode(utf8, encoding)
    let returnStr = ""
    for(let index = 0; index < convert.length; index ++) {
        returnStr = returnStr + "%" + convert[index].toString(16)
    }
    return returnStr
}



// let ipPageIndex = 1
// function getIP() {
//     request("https://www.xicidaili.com/nn/" + ipPageIndex, {
//         timeout: 5000
//     }, (error, response, body) => {
//         if(error) return
//         if(!response && response.statusCode != 200) return
        
//         let $$ = cheerio.load(body)
//         let ipTrNodes = $$("#ip_list tbody tr")

//         for(let index = 1; index < ipTrNodes.length; index ++) {
//             let ipTrNode = $$(ipTrNodes[index])
//             let ipTdNodes = ipTrNode.find('td')
//             let ip = ipTdNodes.eq(1).text()
//             let port = ipTdNodes.eq(2).text()
//             // let address = ipTdNodes.eq(3).text()
//             let type = ipTdNodes.eq(5).text()
//             // let speed = Number(ipTdNodes.eq(6).find('.bar_inner').attr('style').replace(/[^\d]/g, ''))
//             testSpeed(ip, port, type)
//         }
//     })
// }

// function testSpeed(ip, port, type) {
//     const protocol = type.toLowerCase()
//     const proxyUrl = `${protocol}://${ip}:${port}`
//     const testUrl = `${protocol}://www.baidu.com`
//     const time = Date.now()
//     request({
//       url: testUrl,
//       timeout: 5000,
//       proxy: proxyUrl
//     }, (err, response, body) => {
//       if (err) {
//           console.log(err)
//         return;
//       }
//       const speed = Date.now() - time;

//       console.log(ip + ":" + port + ":" + speed);
//     });
//   }

// getIP()


// let promises = []

// for(let i=0;i< 100 ; i++) {
//     promises.push(_ => {
//         return new Promise((resolve, reject) => {
//             setTimeout(_ => {
//                 console.log(i)
//                 resolve(i)
//             }, 1000)
//         })
//     })
// }

// function getResult(){
//     var res=[];
//     // 构建队列
//     function queue(arr) {
//       var sequence = Promise.resolve();
//       arr.forEach(function (item) {
//         sequence = sequence.then(item).then(data=>{
//             res.push(data);
//             return res
//         })
//       })
//       return sequence
//     }

//     // 执行队列
//     queue(promises).then(data=>{
//         return data
//     })
//     .then(data => {
//         console.log(data)
//     })
//     .catch(e => console.log(e));

// }

// getResult();





// 多核 CPU 多线程 cluster






/**
 * 标题栏按钮
 */

//设置
// document.getElementById("setting").onclick = toggleSetting

//最小化
$("min").click(_ => {
    remote.getCurrentWindow().minimize()
})
//最大化
$("max").click(_ => {
    max.classList.toggle("hide")
    resize.classList.toggle("hide")
    remote.getCurrentWindow().maximize()
})
//取消最大化
$("resize").click(_ => {
    max.classList.toggle("hide")
    resize.classList.toggle("hide")
    remote.getCurrentWindow().unmaximize()
})
//关闭
$("close").click(_ => {
    remote.getCurrentWindow().hide()
})