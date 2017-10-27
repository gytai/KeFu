    //用于生成uuid
    function S4() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }

    function guid() {
        return (S4()+S4()+"-"+S4()+S4()+S4());
    }

    function dateFormat(fmt,date) {
        if(!fmt){
            fmt = "yyyy-MM-dd hh:mm:ss";
        } 
        if(!date){
            date = new Date();
        }
        var o = {
            "M+": date.getMonth() + 1, //月份 
            "d+": date.getDate(), //日 
            "h+": date.getHours(), //小时 
            "m+": date.getMinutes(), //分 
            "s+": date.getSeconds(), //秒 
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
            "S": date.getMilliseconds() //毫秒 
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }