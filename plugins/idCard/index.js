const {remote, ipcRenderer} = require('electron')

const $ = require('../../common/js/domUtils')

const config = require('../../common/js/config').file('plugins/idCard');

let cityJsonData = config.get("city")
let nameJsonData = config.get("name")
let configJsonData = config.get("config")

function syncConfig() {
    config.set("config", configJsonData)
}

/**
 * 出生地
 */

// 出生地选择框 点击
$("birthPlace").click(_ => {
    let birthSelect = $("birthSelect")
    birthSelect.isShow() ? hideBirthSelect() : (birthSelect.show(),$("birthPlace").addClass("hover"))
})

// 失去焦点时 判断当前获得焦点的节点
$("birthPlace").blur(selectClick)
$("birthSelect").blur(selectClick) 

function selectClick() {
    setTimeout(_ => {
        if(document.activeElement.id == "birthPlace" || document.activeElement.id == "birthSelect") {
            return
        }else {
            hideBirthSelect()
        }
    }, 50)
}

//隐藏 出生地选择
function hideBirthSelect() {
    $("birthSelect").hide()
    let birthPlace = $("birthPlace")
    birthPlace.removeClass("hover")
    if(birthPlace.attr("countyCode")) {
        birthPlace.removeClass("error")
    }else {
        birthPlace.addClass("error")
    }
}

// 构建省信息
function buildProvinceUl() {
    let birthPlace = $("birthPlace")
    let birthPlaceBack = configJsonData.birthPlace

    birthPlace.attr("provinceindex", birthPlaceBack.provinceindex)
    birthPlace.attr("provincecode", birthPlaceBack.provincecode)
    birthPlace.attr("provincename", birthPlaceBack.provincename)
    birthPlace.attr("cityindex", birthPlaceBack.cityindex)
    birthPlace.attr("citycode", birthPlaceBack.citycode)
    birthPlace.attr("cityname", birthPlaceBack.cityname)
    birthPlace.attr("countyindex", birthPlaceBack.countyindex)
    birthPlace.attr("countycode", birthPlaceBack.countycode)
    birthPlace.attr("countyname", birthPlaceBack.countyname)
    birthPlace.text(birthPlaceBack.text)

    buildCountyUl()
    buildCityUl()

    let provinceUl = $("provinceUl")
    cityJsonData.forEach((province, index) => {
        provinceUl.append(getLiHTML(province.c, province.v, true, province.c == birthPlaceBack.provincecode), function() {
            let li = $(this)
            if(li.attr("c") == birthPlace.attr("provinceCode")) return
            li.siblings.forEach(node => {
                $(node).removeClass("hover")
            })
            li.addClass("hover")
            $("countyUl").html("").parent().hide()
            $("cityUl").html("")

            birthPlace.attr("countyCode", "")
                        .attr("cityCode", "")
                        .attr("provinceIndex", index)
                        .attr("provinceCode", li.attr("c"))
                        .attr("provinceName", li.attr("v"))
            buildCityUl()
            birthPlace.text(li.attr("v"))
        })
    })
}

// 构建市信息
function buildCityUl() {
    let birthPlace = $("birthPlace")
    let provinceIndex = birthPlace.attr("provinceIndex")
    let cities = cityJsonData[provinceIndex].l
    let cityUl = $("cityUl")
    cities.forEach((city, index) => {
        cityUl.append(getLiHTML(city.c, city.v, true, city.c == birthPlace.attr("citycode")), function() {
            let li = $(this)
            if(li.attr("c") == birthPlace.attr("cityCode")) return
            li.siblings.forEach(node => {
                $(node).removeClass("hover")
            })
            li.addClass("hover")
            $("countyUl").html("")
            birthPlace.attr("countyCode", "")
                        .attr("cityIndex", index)
                        .attr("cityCode", li.attr("c"))
                        .attr("cityName", li.attr("v"))
            buildCountyUl()
            birthPlace.text(birthPlace.attr("provinceName") + " - " + li.attr("v"))
        })
    })
    cityUl.parent().show().scrollTop(0)
}

// 构建区信息
function buildCountyUl() {
    let birthPlace = $("birthPlace")
    let provinceIndex = birthPlace.attr("provinceIndex")
    let cityIndex = birthPlace.attr("cityIndex")
    let counties = cityJsonData[provinceIndex].l[cityIndex].l
    let countyUl = $("countyUl")
    counties.forEach((county, index) => {
        countyUl.append(getLiHTML(county.c, county.v, false, county.c == birthPlace.attr("countyCode")), function() {
            let li = $(this)
            li.siblings.forEach(node => {
                $(node).removeClass("hover")
            })
            li.addClass("hover")
            birthPlace.attr("countyIndex", index)
                        .attr("countyCode", li.attr("c"))
                        .attr("countyName", li.attr("v"))
                        .text(birthPlace.attr("provinceName") 
                            + " - " + birthPlace.attr("cityName") 
                            + " - " + li.attr("v"))
            $("birthSelect").hide()
            // 同步数据
            configJsonData.birthPlace = {
                "provinceindex": birthPlace.attr("provinceindex"),
                "provincecode": birthPlace.attr("provincecode"),
                "provincename": birthPlace.attr("provincename"),
                "cityindex": birthPlace.attr("cityindex"),
                "citycode": birthPlace.attr("citycode"),
                "cityname": birthPlace.attr("cityname"),
                "countyindex": birthPlace.attr("countyindex"),
                "countycode": birthPlace.attr("countycode"),
                "countyname": birthPlace.attr("countyname"),
                "text": birthPlace.text()
            }
            syncConfig()
        })
    })
    countyUl.parent().show().scrollTop(0)
}

// li html
function getLiHTML(code, value, hasI, curr) {
    return "<li c='" + code + "' v='" + value + "' class='" + (curr ? "hover" : "") + "'>"
            + "<span>" + value + "</span>"
            + (hasI ? "<i>></i>" : "")
            + "</li>"
}

/**
 * 出生年月日 日期选择 日历
 */

// 出生年月日选择框 点击
$("birthDay").click(_ =>{
    let birthPicker = $("birthPicker")
    birthPicker.isShow() ? hideBirthPicker() : (birthPicker.show(),$("birthDay").addClass("hover"))
})

// 失去焦点时 判断当前获得焦点的节点
$("birthDay").blur(pickerClick)
$("birthPicker").blur(pickerClick)

function pickerClick() {
    setTimeout(_ => {
        if(document.activeElement.id == "birthDay" || document.activeElement.id == "birthPicker") {
            return
        }else {
            hideBirthPicker()
        }
    }, 50)
}

//隐藏日历选择
function hideBirthPicker() {
    $("birthPicker").hide()
    let birthDay = $("birthDay")
    birthDay.removeClass("hover")
    if(birthDay.attr("day")) {
        birthDay.removeClass("error")
    }else {
        birthDay.addClass("error")
    }
}

// 构建当前日期的日历
function buildDatePicker() {
    let birthDay = $("birthDay")
    birthDay.attr("year", configJsonData.birthDay.year)
    birthDay.attr("month", configJsonData.birthDay.month)
    birthDay.attr("day", configJsonData.birthDay.day)
    birthDay.attr("date", configJsonData.birthDay.date)
    birthDay.text(configJsonData.birthDay.text)
    let year = parseInt(configJsonData.birthDay.year)
    let month = parseInt(configJsonData.birthDay.month)
    let day = parseInt(configJsonData.birthDay.day)
    $("yearSpan").text(year + " 年")
    $("monthSpan").text(month + 1 + " 月")
    buildPickerDate(year, month, day)
}

// 构建年份

// 构建月份

// 构建日历
function buildPickerDate(year, month, day) {
    let birthDay = $("birthDay")
    let birthPicker = $("birthPicker")
    let dateTable = $("dateTable")
    let tbody = document.createElement("tbody")
    let weekHeadTr = document.createElement("tr")
    for(let week of ["一","二","三","四","五","六","日"]) {
        let th = document.createElement("th")
        th.innerText = week
        weekHeadTr.appendChild(th)
    }
    tbody.appendChild(weekHeadTr)

    let prevDay = new Date(year, month, 0).getDay()
    let maxDay = new Date(year, month + 1, 0).getDate()
    let nextDay = 7 - (maxDay + prevDay) % 7

    let weekCount = (prevDay + maxDay + nextDay) / 7
    let index = 1 - prevDay

    for(let week = 0; week < weekCount; week ++) {
        let weekTr = document.createElement("tr")
        for(let weekDay = 0; weekDay < 7; weekDay ++) {
            let td = document.createElement("td")
            if(index < 1 || index > maxDay) {
                td.innerHTML = "<div><span></span></div>"
                $(td).addClass("empty")
            }else {
                td.innerHTML = "<div><span>" + index + "</span></div>"
                let date = index
                td.onclick = _ => {
                    birthDay.attr("year", year)
                            .attr("month", month)
                            .attr("day", date)
                            .attr("date", "" + year + $.numFill(month + 1) + $.numFill(date))
                            .text(year + " 年 " + (month + 1) + " 月 " + date + " 日")
                    $(dateTable.children()[0]).children().forEach((nodetr, indextr) => {
                        $(nodetr).children().forEach((nodetd, indextd) => {
                            $(nodetd).removeClass("current")
                            if(Math.ceil((date + prevDay) / 7) == indextr && (date + prevDay) % 7 == indextd + 1) {
                                $(nodetd).addClass("current")
                            }
                        })
                    })
                    birthPicker.hide()
                    // 同步数据
                    configJsonData.birthDay = {
                        "year": birthDay.attr("year"),
                        "month": birthDay.attr("month"),
                        "day": birthDay.attr("day"),
                        "date": birthDay.attr("date"),
                        "text": birthDay.text()
                    }
                    syncConfig()
                }
                if(index == day && birthDay.attr("year") == year && birthDay.attr("month") == month) {
                    $(td).addClass("current")
                }
            }
            index ++
            weekTr.appendChild(td)
        }
        tbody.appendChild(weekTr)
    }
    dateTable.append(tbody)
}

/**
 * 性别选择
 */

//
function buildSexLabel() {
    $("sexLabel").attr("sex", configJsonData.sex.sex)
    $("sexLabel").text(configJsonData.sex.text)
}

// 性别选择框 点击
$("sexLabel").click(_ => {
    let sexSelect = $("sexSelect")
    sexSelect.isShow() ? hideSexSelect() : (sexSelect.show(),$("sexLabel").addClass("hover"))
})

// 失去焦点时 判断当前获得焦点的节点
$("sexLabel").blur(sexSelectClick)
$("sexSelect").blur(sexSelectClick) 

function sexSelectClick() {
    setTimeout(_ => {
        if(document.activeElement.id == "sexLabel" || document.activeElement.id == "sexSelect") {
            return
        }else {
            hideSexSelect()
        }
    }, 50)
}

//隐藏 性别选择
function hideSexSelect() {
    $("sexSelect").hide()
    let sexLabel = $("sexLabel")
    sexLabel.removeClass("hover")
    if(sexLabel.attr("sex")) {
        sexLabel.removeClass("error")
    }else {
        sexLabel.addClass("error")
    }
}

// 点击性别
function sexClick() {
    let sexLabel = $("sexLabel")
    let li = $(this)
    sexLabel.attr("sex", li.attr("c"))
    sexLabel.text(li.attr("v"))
    $("sexSelect").hide()
    // 同步数据
    configJsonData.sex = {
        "sex": sexLabel.attr("sex"),
        "text": sexLabel.text()
    }
    syncConfig()
}

$("male").click(sexClick)
$("female").click(sexClick)

/**
 * 生成
 */

// 点击生成
$("creat").click(_ => {

    let county = $("birthPlace").attr("countyCode")
    let birthDay = $("birthDay").attr("date")
    
    if(!county || !birthDay) return

    let preStr = county + birthDay
    
    let sex = $("sexLabel").attr("sex")
    let creater = $("creater")

    creater.html("")

    for(let index = parseInt(sex); index < 1000; index += 2) {

        let preCode = preStr + $.numFill(index, 3)

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

        let name = nameJsonData.familyNamesSin[$.random(nameJsonData.familyNamesSin.length)]
        if(sex == "1") {
            name += nameJsonData.maleNames[$.random(nameJsonData.maleNames.length)] + nameJsonData.maleNames[$.random(nameJsonData.maleNames.length)]
        }else{
            name += nameJsonData.femaleNames[$.random(nameJsonData.femaleNames.length)] + nameJsonData.femaleNames[$.random(nameJsonData.femaleNames.length)]
        }

        let tr = document.createElement("tr")
        let nameTd = document.createElement("td")
        $(nameTd).text(name)
        let cardTd = document.createElement("td")
        $(cardTd).text(code)

        $(tr).append(nameTd).append(cardTd)

        creater.append(tr)
    }
})

/**
 * 页面初始化
 */

// 初始化省 ul
buildProvinceUl()

// 初始化日历插件
buildDatePicker()

// 初始化性别
buildSexLabel()

/**
 * 标题栏按钮
 */

//设置
// document.getElementById("setting").onclick = toggleSetting

//最小化
$("min").click(_ => {
    remote.getCurrentWindow().minimize()
})

//关闭
$("close").click(_ => {
    remote.getCurrentWindow().hide()
})