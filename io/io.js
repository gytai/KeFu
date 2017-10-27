/*
*介绍：socket.io 功能封装
*作者：TaiGuangYin
*时间：2017-09-09
* */
var redis = require('../utils/redis');
var msgType = require('./messageTpye');
var ioSvc = require('./ioHelper').ioSvc;

//服务端连接
function ioServer(io) {

    var _self = this;
    ioSvc.setInstance(io);

    //初始化连接人数
    redis.set('online_count',0,null,function (err,ret) {
        if(err){
            console.error(err);
        }
    });

    io.on('connection', function (socket) {
        console.log('SocketIO有新的连接!');

        _self.updateOnlieCount(true);

        //用户与Socket进行绑定
        socket.on('login', function (uid) {
            console.log(uid+'登录成功');
            redis.set(uid,socket.id,null,function (err,ret) {
                if(err){
                    console.error(err);
                }
            });
            redis.set(socket.id,uid,null,function (err,ret) {
                if(err){
                    console.error(err);
                }
            });
        });

        //断开事件
        socket.on('disconnect', function() {
            console.log("与服务其断开");
            _self.updateOnlieCount(false);
            redis.get(socket.id,function (err,val) {
                if(err){
                    console.error(err);
                }
                redis.del(socket.id,function (err,ret) {
                    if(err){
                        console.error(err);
                    }

                });
                redis.del(val,function (err,ret) {
                    if(err){
                        console.error(err);
                    }
                });
            });
        });

        //重连事件
        socket.on('reconnect', function() {
            console.log("重新连接到服务器");
        });

        //监听客户端发送的信息,实现消息转发到各个其他客户端
        socket.on('message',function(msg){
            if(msg.type == msgType.messageType.public){
                socket.broadcast.emit("message",msg.content);
            }else if(msg.type == msgType.messageType.private){
                var uid = msg.uid;
                redis.get(uid,function (err,sid) {
                   if(err){
                       console.error(err);
                   }
                   if(sid){
                       //给指定的客户端发送消息
                       io.sockets.socket(sid).emit('message', msg.content);
                   }
                });
            }

        });
    });

    this.updateOnlieCount = function (isConnect) {
        //记录在线客户连接数
        redis.get('online_count',function (err,val) {
            if(err){
                console.error(err);
            }
            if(!val){
                val = 0;
            }
            if(typeof val == 'string'){
                val = parseInt(val);
            }
            if(isConnect){
                val += 1;
            }else{
                val -= 1;
                if(val<=0){
                    val = 0;
                }
            }

            console.log('当前在线人数：'+val);
            io.sockets.emit('update_online_count', { online_count: val });

            redis.set('online_count',val,null,function (err,ret) {
                if(err){
                    console.error(err);
                }
            });
        });
    };

}


//模块导出
exports.ioServer = ioServer;