$(function(){
    //Socket.IO 连接
    var socket = io.connect('http://'+document.domain+':9010');

    function insert_client_html(time,content){
        var tpl = '<div class="msg-box">'+
                    '<div  class="msg-client">'+
                    '<div  class="date">' + time + '</div>'+
                    '<div class="bubble rich-text-bubble">'+
                        '<span class="arrow"></span>'+
                        '<div class="text">' + content + '</div>'+
                        '<span class="status icon"></span>'+
                    '</div>'+
                    '</div>'+
                '</div>';
        $(".msg-container").append(tpl);
    }

    function insert_agent_html(time,content){
        var tpl = '<div class="msg-box">'+
                        '<div class="msg-agent">'+
                        '<div class="agent-avatar">'+
                            '<img src="https://s3-qcloud.meiqia.com/pics.meiqia.bucket/avatars/20170929/972a7c64426ed82da1de67ac3f16bd07.png">'+ 
                        '</div>'+
                        '<div class="date">' + time + '</div>'+
                        '<div class="bubble rich-text-bubble">'+
                            '<span class="arrow-bg"></span>'+
                            '<span class="arrow"></span>'+
                            '<div class="text">' + content + '</div>'+
                        '</div>'+
                        '</div>'+
                    '</div>';
        $(".msg-container").append(tpl);
    }


    $("#btnSend").click(function(){
        var date = dateFormat();
        var msg = $("#textarea").val();
        insert_client_html(date,msg);  
    });

    //连接服务器
    socket.on('connect', function () {
        console.log('连接成功...');
        var uuid = 'chat'+ guid();
        socket.emit('login', uuid);
    });

    // /* 后端推送来消息时
    //     msg:
    //         type 消息类型 image,text
    //         content 消息
    // */
    socket.on('message', function(msg){
        insert_agent_html(dateFormat(),msg.content);
    });

});