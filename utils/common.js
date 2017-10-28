var http=require('http');

function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};

function getIpLocation(ip,callback) {
    http.get('http://ip.taobao.com/service/getIpInfo.php?ip='+ip,function(req,res){
        var html='';
        req.on('data',function(data){
            html+=data;
        });
        req.on('end',function(){
            console.info(html);
            var json = JSON.parse(html);
            if(json.code == 0){
                return callback(null,json.data.region + json.data.city);
            }

        });
    });
}

exports.getClientIp = getClientIp;
exports.getIpLocation = getIpLocation;