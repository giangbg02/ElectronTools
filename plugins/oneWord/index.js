const {remote, ipcRenderer} = require('electron')

var size = 50
//页面赋值
function setValue(word){
    size = 50

    let one_word = document.getElementById('one_word')
    one_word.innerText = word.word
    one_word.className = className(word.word)

    let word_from = document.getElementById('word_from')
    word_from.innerText = '—— ' + word.from
    word_from.className = className(word.from)

    one_word.style.fontSize = size + 'px'

    reset_one_word(one_word)
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
function reset_one_word(one_word){
    let width = one_word.offsetHeight
    console.log(width)
    if(width > 327){
        one_word.style.fontSize = -- size + 'px'
        one_word.style.lineHeight = size * 2 * 0.85 + 'px'
        reset_one_word(one_word)
    }else{
        margin = (327 - width) / 2 + 70
        one_word.style.marginTop = margin + 'px'
    }
}

ipcRenderer.send("oneWordRefresh")

ipcRenderer.on("readyChange", (event, arg) => {
    setValue(arg)
})

document.addEventListener('keyup', function(e){
    if(e.keyCode == 27){
        ipcRenderer.send("oneWordRefresh")
    }
})