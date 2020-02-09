const {remote, ipcRenderer} = require('electron')

const config = require('../../common/js/config').file('plugins/idCard');

let cityJsonData = config.get("city")

/**
 * 出生地
 */

// 出生地选择框 点击
ID("birthPlace").onclick = function() {
    let birthSelect = ID("birthSelect")
    isShow(birthSelect) ? hide(birthSelect) : hide(birthSelect)
    isShow(birthSelect) ? hide(birthSelect) : hide(birthSelect)
    ID("birthPlace").classList.add("hover")
}

// 失去焦点时 判断当前获得焦点的节点
ID("birthPlace").onblur = ID("birthSelect").onblur = function() {
    setTimeout(_ => {
        if(document.activeElement.id == "birthPlace" || document.activeElement.id == "birthSelect") {
            return
        }else {
            hide("birthSelect")
            ID("birthPlace").classList.remove("hover")
            if(ID("birthPlace").getAttribute("countyCode")) {
                ID("birthPlace").classList.remove("error")
            }else {
                ID("birthPlace").classList.add("error")
            }
        }
    }, 50)
}

// 构建省信息
function buildProvinceUl() {
    let provinceUl = ID("provinceUl")
    cityJsonData.forEach((province, index) => {
        appendHTML(provinceUl, getLiHTML(province.c, province.v, true), function() {
            if(this.getAttribute("c") == ID("birthPlace").getAttribute("provinceCode")) return
            siblings(this, node => {
                node.classList.remove("hover")
            })
            this.classList.add("hover")
            ID("birthPlace").setAttribute("countyCode", "")
            ID("birthPlace").setAttribute("cityCode", "")
            ID("countyUl").innerHTML = ""
            ID("cityUl").innerHTML = ""
            hide(ID("countyUl").parentElement)
            ID("birthPlace").setAttribute("provinceIndex", index)
            ID("birthPlace").setAttribute("provinceCode", this.getAttribute("c"))
            ID("birthPlace").setAttribute("provinceName", this.getAttribute("v"))
            buildCityUl()
            show(ID("cityUl").parentElement)
            ID("birthPlace").innerText = this.getAttribute("v")
        })
    })
}

// 构建市信息
function buildCityUl() {
    let provinceIndex = ID("birthPlace").getAttribute("provinceIndex")
    let cities = cityJsonData[provinceIndex].l
    let cityUl = ID("cityUl")
    cities.forEach((city, index) => {
        appendHTML(cityUl, getLiHTML(city.c, city.v, true), function() {
            if(this.getAttribute("c") == ID("birthPlace").getAttribute("cityCode")) return
            siblings(this, node => {
                node.classList.remove("hover")
            })
            this.classList.add("hover")
            ID("birthPlace").setAttribute("countyCode", "")
            ID("countyUl").innerHTML = ""
            ID("birthPlace").setAttribute("cityIndex", index)
            ID("birthPlace").setAttribute("cityCode", this.getAttribute("c"))
            ID("birthPlace").setAttribute("cityName", this.getAttribute("v"))
            buildCountyUl()
            show(ID("countyUl").parentElement)
            ID("birthPlace").innerText = ID("birthPlace").getAttribute("provinceName") + " - " + this.getAttribute("v")
        })
    })
    cityUl.parentElement.scrollTop = 0
}

// 构建区信息
function buildCountyUl() {
    let provinceIndex = ID("birthPlace").getAttribute("provinceIndex")
    let cityIndex = ID("birthPlace").getAttribute("cityIndex")
    let counties = cityJsonData[provinceIndex].l[cityIndex].l
    let countyUl = ID("countyUl")
    counties.forEach((county, index) => {
        appendHTML(countyUl, getLiHTML(county.c, county.v, false), function() {
            siblings(this, node => {
                node.classList.remove("hover")
            })
            this.classList.add("hover")
            ID("birthPlace").setAttribute("countyIndex", index)
            ID("birthPlace").setAttribute("countyCode", this.getAttribute("c"))
            ID("birthPlace").setAttribute("countyName", this.getAttribute("v"))
            ID("birthPlace").innerText = ID("birthPlace").getAttribute("provinceName") + " - " + ID("birthPlace").getAttribute("cityName") + " - " + this.getAttribute("v")
            hide("birthSelect")
        })
    })
    countyUl.parentElement.scrollTop = 0
}

// li html
function getLiHTML(code, value, hasI) {
    return "<li c='" + code + "' v='" + value + "'>"
            + "<span>" + value + "</span>"
            + (hasI ? "<i>></i>" : "")
            + "</li>"
}

/**
 * 出生年月日 日期选择 日历
 */

// 出生年月日选择框 点击
ID("birthDay").onclick = function() {
    toggle("birthPicker")
    ID("birthDay").classList.add("hover")
}

// 失去焦点时 判断当前获得焦点的节点
ID("birthDay").onblur = ID("birthPicker").onblur = function() {
    setTimeout(_ => {
        if(document.activeElement.id == "birthDay" || document.activeElement.id == "birthPicker") {
            return
        }else {
            hide("birthPicker")
            ID("birthDay").classList.remove("hover")
        }
    }, 50)
}

/**
 * 生成
 */

// 点击生成
ID("creat").onclick = function() {

    let county = ID("birthPlace").getAttribute("countyCode")
    
    if(!county) return

    let birthDay = ID("birthDay").value.replace(/-/g,"")

    let preStr = county + birthDay

    let sex = ID("sex").value

    let creater = ID("creater")

    for(let index = parseInt(sex); index < 1000; index += 2) {

        let nextStr = index

        if(index < 10) {
            nextStr = "00" + index
        }else if(index < 100) {
            nextStr = "0" + index
        }

        let preCode = preStr + nextStr

        let sum = parseInt(preCode[0]) * 7
                + parseInt(preCode[1]) * 9
                + parseInt(preCode[2]) * 10
                + parseInt(preCode[3]) * 5
                + parseInt(preCode[4]) * 8
                + parseInt(preCode[5]) * 4
                + parseInt(preCode[6]) * 2
                + parseInt(preCode[7]) * 1
                + parseInt(preCode[8]) * 6
                + parseInt(preCode[9]) * 3
                + parseInt(preCode[10]) * 7
                + parseInt(preCode[11]) * 9
                + parseInt(preCode[12]) * 10
                + parseInt(preCode[13]) * 5
                + parseInt(preCode[14]) * 8
                + parseInt(preCode[15]) * 4
                + parseInt(preCode[16]) * 2

        let lastCode = ""
        switch(sum % 11) {
            case 0:
                lastCode = "1";
                break;
            case 1:
                lastCode = "0";
                break;
            case 2:
                lastCode = "X";
                break;
            case 3:
                lastCode = "9";
                break;
            case 4:
                lastCode = "8";
                break;
            case 5:
                lastCode = "7";
                break;
            case 6:
                lastCode = "6";
                break;
            case 7:
                lastCode = "5";
                break;
            case 8:
                lastCode = "4";
                break;
            case 9:
                lastCode = "3";
                break;
            case 10:
                lastCode = "2";
                break;
        }
        let code = preCode + lastCode
        let p = document.createElement("p")
        p.innerText = code
        creater.appendChild(p)
    }

}

/**
 * 页面初始化
 */

// 初始化省 ul
buildProvinceUl()

/**
 * 标题栏按钮
 */

//设置
// document.getElementById("setting").onclick = toggleSetting

//最小化
ID("min").onclick = function() {
    remote.getCurrentWindow().minimize()
}

//关闭
ID("close").onclick = function() {
    remote.getCurrentWindow().hide()
}