var express = require('express');
var router = express.Router();
var redis = require('../utils/redis');

/* GET users listing. */
router.get('/', function(req, res, next) {
    redis.get('user-uuids',function (err,uuids) {
        if(err){
            console.error(err);
            return res.send({code:400,msg:'获取失败'});
        }
        if(uuids){
            uuids =JSON.parse(uuids);
        }else{
            uuids = [];
        }

        return res.send({code:200,msg:'获取成功',data:uuids});
    });
});

module.exports = router;
