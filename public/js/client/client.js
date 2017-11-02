$(function(){
    //Socket.IO 连接
    var socket = io.connect('http://'+document.domain+':9010',{
        "transports":['websocket', 'polling']
    });
    var uuid = '';

    function insert_client_html(msg){
        var time = dateFormat();
        if(msg.time){
            time = dateFormat("yyyy-MM-dd hh:mm:ss",new Date(msg.time));
        }
        if(!msg.chat_type){
            msg.chat_type = 'text';
        }
        var tpl = '<div class="msg-box">'+
                    '<div  class="msg-client">'+
                    '<div  class="date">' + time + ' 我' + '</div>';

        if(msg.chat_type == "text"){
            tpl += '<div class="bubble rich-text-bubble">'+
                        '<span class="arrow"></span>'+
                        '<div class="text">' + msg.content + '</div>'+
                        '<span class="status icon"></span>'+
                    '</div>';
        }else if(msg.chat_type == "image"){
            tpl += ' <div class="msg-client-img">' +
                '       <a href="'+ msg.image +'"target="_blank">' +
                '           <img src="' + msg.image + '" alt="photo">'+
                '       </a>' +
                '    </div>';
        }

        tpl += '</div>'+
                '</div>';
        $(".msg-container").append(tpl);
    }

    function insert_agent_html(msg){
        var time = dateFormat();
        if(msg.time){
            time = dateFormat("yyyy-MM-dd hh:mm:ss",new Date(msg.time));
        }
        if(!msg.chat_type){
            msg.chat_type = 'text';
        }
        var tpl = '<div class="msg-box">'+
                        '<div class="msg-agent">'+
                        '<div class="agent-avatar">'+
                            '<img src="https://s3-qcloud.meiqia.com/pics.meiqia.bucket/avatars/20170929/972a7c64426ed82da1de67ac3f16bd07.png">'+ 
                        '</div>'+
                        '<div class="date">' + time + ' 客服' + '</div>';

        if(msg.chat_type == "text"){
            tpl += '<div class="bubble rich-text-bubble">'+
                        '<span class="arrow-bg"></span>'+
                        '<span class="arrow"></span>'+
                        '<div class="text">' + msg.content + '</div>'+
                    '</div>';
        }else if(msg.chat_type == "image"){
            tpl += ' <div class="msg-agent-img">' +
                '       <a href="'+ msg.image +'"target="_blank">' +
                '           <img src="' + msg.image + '" alt="photo">'+
                '       </a>' +
                '    </div>';
        }
        tpl += '</div>'+
            '</div>';
        $(".msg-container").append(tpl);
    }

    //聊天窗口自动滚到底
    function scrollToBottom() {
        var div = document.getElementById('msg-container');
        div.scrollTop = div.scrollHeight;
    }

    //获取最新的五条数据
    function get_message(uid) {
        $.get('/message?uid='+uid,function (data) {
            if(data.code == 200){
                data.data.reverse().forEach(function (msg) {
                    if(msg.from_uid == uid){
                        insert_client_html(msg);
                    }else{
                        insert_agent_html(msg);
                    }

                    scrollToBottom();
                });
            }
        });
    }


    $("#btnSend").click(function(){
        var msg = $("#textarea").val();
        if(msg){
            var msg_sender = {
                "type":'private',
                "uid":'chat-kefu-admin',
                "content":msg,
                "from_uid":uuid,
                "chat_type":'text'
            };
            socket.emit('message', msg_sender);
            insert_client_html(msg_sender);
            scrollToBottom();
            $("#textarea").val('');
        }
    });

    $(".picture-upload").click(function () {
        var uploader = Qiniu.uploader({
            runtimes: 'html5,flash,html4',      // 上传模式，依次退化
            browse_button: 'pickfiles',         // 上传选择的点选按钮，必需
            uptoken_url: '/uptoken',         // Ajax请求uptoken的Url，强烈建议设置（服务端提供）
            get_new_uptoken: false,             // 设置上传文件的时候是否每次都重新获取新的uptoken
            domain: 'http://kefuimg.chinameyer.com/',     // bucket域名，下载资源时用到，必需
            container: 'btn-uploader',             // 上传区域DOM ID，默认是browser_button的父元素
            max_file_size: '10mb',             // 最大文件体积限制
            flash_swf_url: 'path/of/plupload/Moxie.swf',  //引入flash，相对路径
            max_retries: 3,                     // 上传失败最大重试次数
            dragdrop: false,                     // 开启可拖曳上传
            drop_element: 'btn-uploader',          // 拖曳上传区域元素的ID，拖曳文件或文件夹后可触发上传
            chunk_size: '4mb',                  // 分块上传时，每块的体积
            auto_start: true,                   // 选择文件后自动上传，若关闭需要自己绑定事件触发上传
            unique_names: true,
            filters : {
                max_file_size : '10mb',
                prevent_duplicates: true,
                // Specify what files to browse for
                mime_types: [
                    {title : "Image files", extensions : "jpg,gif,png,bmp"}, // 限定jpg,gif,png后缀上传
                ]
            },
            init: {
                'FilesAdded': function(up, files) {
                    plupload.each(files, function(file) {
                        // 文件添加进队列后，处理相关的事情
                    });
                },
                'BeforeUpload': function(up, file) {
                    // 每个文件上传前，处理相关的事情
                },
                'UploadProgress': function(up, file) {
                    // 每个文件上传时，处理相关的事情
                },
                'FileUploaded': function(up, file, info) {
                    // 查看简单反馈
                     var domain = up.getOption('domain');
                     var res = JSON.parse(info);
                     var sourceLink = domain +"/"+ res.key;

                    var msg_sender = {
                        "type":'private',
                        "uid":'chat-kefu-admin',
                        "content":'图片消息',
                        "from_uid":uuid,
                        "chat_type":'image',
                        "image":sourceLink
                    };
                    socket.emit('message', msg_sender);
                    insert_client_html(msg_sender);
                    scrollToBottom();


                },
                'Error': function(up, err, errTip) {
                    //上传出错时，处理相关的事情
                    $.toast("上传失败");
                },
                'UploadComplete': function() {
                    //队列文件处理完毕后，处理相关的事情
                }
            }
        });

    });

    $(".emoji-list li").click(function () {
        var content = $("#textarea").val();
        $("#textarea").val(content + " " +$(this).html()+ " " );
        $(".emoji-list").toggle();
    });

    $(".emoji-send").click(function () {
        $(".emoji-list").toggle();
    });

    //连接服务器
    socket.on('connect', function () {
        //uuid = 'chat'+ guid();
        var fp1 = new Fingerprint();
        uuid = fp1.get();
        console.log('连接成功...'+uuid);

        var ip = $("#keleyivisitorip").html();
        var msg = {
            "uid" : uuid,
            "ip" : ip
        };
        socket.emit('login', msg);
        get_message(uuid);
    });

    // /* 后端推送来消息时
    //     msg:
    //         type 消息类型 image,text
    //         content 消息
    // */
    socket.on('message', function(msg){
        insert_agent_html(msg);
        scrollToBottom();
    });


});