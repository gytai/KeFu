/*
*介绍：socket.io 功能封装
*作者：TaiGuangYin
*时间：2017-09-09
* */
var redis = require('../utils/redis');
var msgType = require('./messageTpye');
var ioSvc = require('./ioHelper').ioSvc;
var AppConfig = require('../config');
var Common = require('../utils/common');
var msgModel = require('../model/message');

//服务端连接
function ioServer(io) {

    var _self = this;
    ioSvc.setInstance(io);

    var __uuids = [];

    //初始化连接人数
    redis.set('online_count',0,null,function (err,ret) {
        if(err){
            console.error(err);
        }
    });

    Array.prototype.remove = function(val) {
        var index = this.indexOf(val);
        if (index > -1) {
            this.splice(index, 1);
        }
    };

    io.on('connection', function (socket) {
        console.log('SocketIO有新的连接!');

        _self.updateOnlieCount(true);

        //用户与Socket进行绑定
        socket.on('login', function (msg) {
            var uid = msg.uid;
            console.log(uid+'登录成功');

            //通知用户上线
            if(uid != AppConfig.KEFUUUID){
                redis.get(AppConfig.KEFUUUID,function (err,sid) {
                    if(err){
                        console.error(err);
                    }
                    if(sid){
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

                            //var ip = socket.request.connection.remoteAddress;
                            //此处获取IP可能会有延迟，建议改成自己的IP库
                            Common.getIpLocation(msg.ip,function (err,location) {
                                if(err){
                                    location = '';
                                }
                                var info = {
                                    "uid":uid,
                                    "name":location + ' 客户',
                                    "type":'online'
                                };

                                redis.get('user-uuids',function (err,uuids) {
                                    if(err){
                                        console.error(err);
                                    }
                                    if(uuids){
                                        uuids =JSON.parse(uuids);
                                    }else{
                                        uuids = [];
                                    }

                                    if(__uuids.indexOf(uid) == -1){
                                        __uuids.push(uid);
                                        var d_user = {"uid":uid,"name":location + ' 客户'};
                                        uuids.push(d_user);
                                        uuids = JSON.stringify(uuids);
                                        redis.set('user-uuids',uuids,null,function (err,ret) {
                                            if(err){
                                                console.error(err);
                                            }
                                        });
                                    }
                                });

                                io.to(sid).emit('update-users',info);
                            });

                        });
                    }
                });
            }

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
                //通知用户下线
                if(val != AppConfig.KEFUUUID){
                    redis.get(AppConfig.KEFUUUID,function (err,sid) {
                        if(err){
                            console.error(err);
                        }
                        if(sid){
                            var info = {
                                "uid":val,
                                "name":'客户下线',
                                "type":'offline'
                            };
                            io.to(sid).emit('update-users',info);
                        }
                    });

                    redis.get('user-uuids',function (err,uuids) {
                        if(err){
                            console.error(err);
                        }
                        if(uuids){
                            uuids =JSON.parse(uuids);
                        }else{
                            uuids = [];
                        }
                        val = parseInt(val);
                        var idx = __uuids.indexOf(val);
                        if( idx != -1){
                            __uuids.remove(val);
                            //uuids.splice(idx,1);
                            var tmp = [];
                            uuids.forEach(function (user) {
                                if(user.uid != val){
                                    tmp.push(user);
                                }
                            });
                            uuids = JSON.stringify(tmp);
                            redis.set('user-uuids',uuids,null,function (err,ret) {
                                if(err){
                                    console.error(err);
                                }
                            });
                        }
                    });
                }
            });
        });

        //重连事件
        socket.on('reconnect', function() {
            console.log("重新连接到服务器");
        });

        //监听客户端发送的信息,实现消息转发到各个其他客户端
        socket.on('message',function(msg){
            msgModel.add(msg.from_uid,msg.uid,msg.content,msg.chat_type,msg.image,function (err) {
               if(err){
                   console.error(err);
               }
            });
            if(msg.type == msgType.messageType.public){
                var mg = {
                    "uid" : msg.from_uid  ,
                    "content": msg.content,
                    "chat_type" :  msg.chat_type?msg.chat_type:'text',
                    "image":msg.image
                };
                socket.broadcast.emit("message",mg);
            }else if(msg.type == msgType.messageType.private){
                var uid = msg.uid;
                redis.get(uid,function (err,sid) {
                   if(err){
                       console.error(err);
                   }
                   if(sid){
                       //给指定的客户端发送消息
                       var mg = {
                         "uid" : msg.from_uid,
                         "content": msg.content,
                         "chat_type" :  msg.chat_type?msg.chat_type:'text',
                         "image":msg.image
                       };
                       io.to(sid).emit('message',mg);
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