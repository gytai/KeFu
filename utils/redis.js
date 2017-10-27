var redisSvc = {};
var redis = require("redis");

if(!client){
    var client = redis.createClient();
}

client.on("error", function (err) {
    console.log("Redis Error :" , err);
    client = null;
});

client.on('connect', function(){
    console.log('Redis连接成功.');
});

/**
 * 添加string类型的数据
 * @param key 键
 * @params value 值
 * @params expire (过期时间,单位秒;可为空，为空表示不过期)
 * @param callBack(err,result)
 */
redisSvc.set = function(key, value, expire, callback){

    client.set(key, value, function(err, result){

        if (err) {
            console.log(err);
            callback(err,null);
            return;
        }

        if (!isNaN(expire) && expire > 0) {
            client.expire(key, parseInt(expire));
        }

        callback(null,result)
    })
};

/**
 * 查询string类型的数据
 * @param key 键
 * @param callBack(err,result)
 */
redisSvc.get = function(key, callback){

    client.get(key, function(err,result){

        if (err) {
            console.log(err);
            callback(err,null);
            return;
        }

        callback(null,result);
    });
};

/*
*删除String 类型的key
 * @param key 键
 * @param callBack(err,result)
*/
redisSvc.del = function(key, callback){

    client.del(key, function(err,result){

        if (err) {
            console.log(err);
            callback(err,null);
            return;
        }

        callback(null,result);
    });
};


module.exports = redisSvc;