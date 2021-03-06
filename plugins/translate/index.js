const {ipcRenderer, remote} = require('electron');
const https = require('https');

const $ = require('../../common/js/domUtils')

var queryText = $('queryText')
var transText = $('transText')

var isTransing = false;

document.addEventListener('keydown', e => {
    if(e.keyCode == $.keyCode.Escape) {
        remote.getCurrentWindow().hide()
    }
})

//翻译区域回车
queryText.keydown(e => {
    if(e.keyCode == $.keyCode.Enter) {
        if(isTransing) {
            //正在翻译
        }else {
            isTransing = true;
            e.preventDefault();
            e.stopPropagation();
            let query = trim(queryText.value());
            if(query)
                translate(query);
        }
    }
})

//删除左右两端的空格
function trim(str){
    return str.replace(/(^\s*)|(\s*$)/g, "");
}

//翻译方法
function translate(query){
    var appid = '20181226000252452';
    var key = 'fJyoWT8kiqw9VDehVVW7';
    var salt = (new Date).getTime();
    var from = queryLangValue.value() ? queryLangValue.value() : 'auto'
    var to = transLangValue.value() ? transLangValue.value() : (isIncludeChinese(query) ? 'en' : 'zh');
    var str1 = appid + query + salt +key;
    var sign = MD5(str1);
    var queryString = 'q=' + encodeURIComponent(query) + '&from=' + from + '&to=' + to + '&appid=' + appid + '&salt=' + salt + '&sign=' + sign;
    var resData = '';
    var req = https.get('https://fanyi-api.baidu.com/api/trans/vip/translate?' + queryString, function(res){  
        res.on('data',function(data){
            try {
                resData += data;
            } catch (error) {
                isTransing = false;
                // console.log(error);
            }
            
        })
        res.on('end',function(){  
            let resJson = JSON.parse(resData);
            // console.log(resJson);
            if(resJson.error_code){
                switch (resJson.error_code) {
                    case '54000':
                        // console.log('54000')
                        break;
                
                    default:
                        break;
                }
            }else{
                let resArray = resJson.trans_result;
                let resStr = '';
                for(let transResult in resArray){
                    resStr += resArray[transResult].dst + '\n';
                }
                transText.value(resStr);
                remote.getCurrentWindow().focus()
            }
            isTransing = false;
        })
    })
    req.on('error',function(err){
        isTransing = false;
        //TODO 异常报告
    })
}

// icp translate window ready show
ipcRenderer.on('translateQuery', function(event, arg) {
    let query = trim(arg);
    if(query){
        queryText.value(query)
        transText.value(" ")
        translate(query);
    }
})

// 判断是否包含中文
function isIncludeChinese(str){
    var reg = /[\u4e00-\u9fa5]/g;
    if(reg.test(str)){
        return true;
    }else{
        return false;
    }
}

var queryLangName = $('queryLangName');
var transLangName = $('transLangName');

var queryLangValue = $('queryLangValue');
var transLangValue = $('transLangValue');

var selectUl = $('selectUl');

var isTransSelect = false
var liList = selectUl.children();
queryLangName.focus(_ => {
    showUlSelect(false)
})
queryLangName.blur(_ => {
    hideUlSelect(false)
})

transLangName.focus(_ => {
    showUlSelect(true)
})
transLangName.blur(_ => {
    hideUlSelect(true)
})

function showUlSelect(flag) {
    selectUl.removeClass("hide")
    selectUl.toggle(flag ? "transSelect" : "querySelect")
    isTransSelect = flag
}

function hideUlSelect(flag) {
    setTimeout(function(){
        selectUl.scrollTop(0)
        selectUl.hide()
        selectUl.toggle(flag ? "transSelect" : "querySelect")
    },200)
    
}

//模拟option点击事件
for(var i=0;i<liList.length;i++){
    liList[i].onclick = function(){
        var to = this.getAttribute('to');
        var languageName = isTransSelect ? transLangName : queryLangName
        var languageValue = isTransSelect ? transLangValue : queryLangValue
        var languageOld = languageValue.value()
        languageName.value(this.innerText)
        languageValue.value(to)
        selectUl.hide()
        var query = trim(queryText.value());
        if(query && (languageOld != to)){
            translate(query);
        }
    }
}

//点击复制按钮复制到剪切板并弹出通知
var queryCopy = $('queryCopy');
var transCopy = $('transCopy');
queryCopy.click(copyContent)
transCopy.click(copyContent)

function copyContent(){
    let textArea = (this.id == "transCopy") ? transText : queryText
    if(textArea.value()){
        this.innerText = '已复制';
        textArea.node.select();
        textArea.node.setSelectionRange(0, textArea.value().length);
        document.execCommand("copy"); 
        window.getSelection().removeAllRanges()
        setTimeout(_ => {
            this.innerText = '复制';
        }, 5000);
    }
}

//点击发音按钮获取发音并播放
var queryTTS = $('queryTTS');
var transTTS = $('transTTS');

var sound = $('sound').node;

queryTTS.click(TTS)
transTTS.click(TTS)

function TTS(){
    let textArea = (this.id == "transTTS") ? transText : queryText
    let language = (this.id == "transTTS") ? transLangValue : queryLangValue
    if(textArea.value){
        var to = language.value() ? language.value() : (isIncludeChinese(textArea.value()) ? 'zh' : 'en');
        sound.pause();
        sound.src = "https://fanyi.baidu.com/gettts?lan=" + to + "&text=" + encodeURI(textArea.value()) + "&spd=3&source=web";
        sound.play();
    }
}