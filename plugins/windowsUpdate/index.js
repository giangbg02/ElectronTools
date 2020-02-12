const {remote} = require('electron')

const $ = require('../../common/js/domUtils')

var count=0;
var stage=0;
var stage1=0;
var loopTime = 1000
var counter=setInterval(timer, loopTime);
var nextRef="正在安装更新";
var finalRef="正在应用更新";
var complateRef="正在重新启动";

function timer() {
    let nums = Math.ceil(Math.random()*10)
    let loopNum = 0
    let interval = setInterval(_ => {
        if (count < 100){
            count ++;
            $("timer").html(count +'%')
        }else{
            if(count == 100){
                $("ref").html(nextRef +'')
                count ++;
            }
            if(stage < 100){
                stage ++;
                $("timer").html(stage +'%')
            }else{
                if(stage == 100){
                    $("ref").html(finalRef +'')
                    stage ++;
                }
                if(stage1 < 100){
                    stage1 ++;
                    $("timer").html(stage1 +'%')
                }else{
                    clearInterval(interval);
                    clearInterval(counter);
                    $("ref").html(complateRef + '')
                    $("timer").html("")
                    $("completd").html("")
                    $("warn").html("")
                    $("bottom").html("")

                    if(updateError){
                        changeToUpdateErrorPage()
                    }else{
                        updateSuccess = true
                    }

                    return;
                }
            }
        }
        if(nums == ++loopNum){
            clearInterval(interval);
        }
    }, Math.ceil(loopTime/nums))
}

var exit = 0
var timeOut = null
var updateError = false
var updateSuccess = false
document.addEventListener('click', function(){
    exit ++
    if(exit == 5){
        updateError = true
    }else{
        clearTimeout(timeOut)
        timeOut = setTimeout(function(){
            exit = 0
        }, 500)
    }
})
document.addEventListener('keyup', function(e){
    if(e.keyCode == $.keyCode.Enter && updateError){
        updateError = null
        changeToUpdateErrorPage()
    }else if(e.keyCode == $.keyCode.Escape && (updateSuccess || (updateError == null))){
        remote.getCurrentWindow().hide()
    }
})

function changeToUpdateErrorPage() {

    clearInterval(counter);
    $("updating").toggle("hide")
    $("updateError").toggle("hide")
}