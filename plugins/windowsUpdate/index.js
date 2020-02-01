const {remote} = require('electron')

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
            document.getElementById("timer").innerHTML=count +'%';
        }else{
            if(count == 100){
                document.getElementById("ref").innerHTML=nextRef +'';
                count ++;
            }
            if(stage < 100){
                stage ++;
                document.getElementById("timer").innerHTML=stage +'%';
            }else{
                if(stage == 100){
                    document.getElementById("ref").innerHTML=finalRef +'';
                    stage ++;
                }
                if(stage1 < 100){
                    stage1 ++;
                    document.getElementById("timer").innerHTML=stage1 +'%';
                }else{
                    clearInterval(interval);
                    clearInterval(counter);
                    document.getElementById("ref").innerHTML=complateRef + '';
                    document.getElementById("timer").innerHTML='';
                    document.getElementById("completd").innerHTML='';
                    document.getElementById("warn").innerHTML='';
                    document.getElementById("bottom").innerHTML='';

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
    if(e.keyCode == 13 && updateError){
        updateError = null
        changeToUpdateErrorPage()
    }else if(e.keyCode == 27 && (updateSuccess || (updateError == null))){
        remote.getCurrentWindow().hide()
    }
})

function changeToUpdateErrorPage() {

    clearInterval(counter);
    document.getElementById("updating").classList.toggle("hide")
    document.getElementById("updateError").classList.toggle("hide")
}