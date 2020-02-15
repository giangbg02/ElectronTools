const {remote, ipcRenderer} = require('electron')

const $ = require('../../common/js/domUtils')

var size = 50
//页面赋值
function setValue(word){
    size = 50

    $("one_word").text(word.word).setClass(className(word.word))
    $("word_from").text('—— ' + word.from).setClass(className(word.from))

    reset_one_word()
}

//获取字符串的第一个文本, 判断中英文, 返回不同class
function className (str){
    if (escape(str[0]).indexOf( "%u" )<0){
        return 'days'
    }else{
        return 'youyuan'
    }
}

//解决字体过大导致的页面超高
function reset_one_word(){
    let one_word = $("one_word").node
    let height = one_word.offsetHeight
    console.log(height)
    if(height > 327){
        -- size
        reset_one_word(one_word)
    }else{
        margin = (327 - height) / 2 + 70
        one_word.style.fontSize = size + 'px'
        one_word.style.lineHeight = size * 2 * 0.85 + 'px'
        one_word.style.marginTop = margin + 'px'
    }
}

ipcRenderer.send("oneWordRefresh")

ipcRenderer.on("readyChange", (event, arg) => {
    setValue(arg)
})

document.addEventListener('keyup', function(e){
    if(e.keyCode == $.keyCode.Escape){
        ipcRenderer.send("oneWordRefresh")
    }
})