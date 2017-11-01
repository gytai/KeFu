//一般直接写在一个js文件中
layui.use(['layer', 'form', 'jquery'], function () {
    var layer = layui.layer
        , form = layui.form
        , $ = layui.jquery;

    var currentUUID = '';
    var uuid = '';
    var socket = io.connect('http://'+document.domain+':9010',{
        "transports":['websocket', 'polling']
    });

    var uuids = [];
    var online_num = 0;

    //页面初始化函数
    function init() {
        $(".admin-index").addClass("layui-this");

        var height = document.body.clientHeight - 292;
        $(".message-container").css("height", height);

        window.onresize = function(){
            var height = document.body.clientHeight - 292;
            $(".message-container").css("height", height);
        };

        document.getElementById("msg-send-textarea").onkeydown=function(e){
            if(e.keyCode == 13 && e.ctrlKey){
                // 这里实现换行
                document.getElementById("msg-send-textarea").value += "\n";
            }else if(e.keyCode == 13){
                // 避免回车键换行
                e.preventDefault();
                // 下面写你的发送消息的代码
                msg_send();
            }
        }
    }

    //聊天窗口自动滚到底
    function scrollToBottom() {
        var div = document.getElementById('message-container');
       div.scrollTop = div.scrollHeight;
    }

    function insert_section(uid) {
        var html = '<section class="user-section"  style="display:none;" id="section-'+ uid +'"></section>';
        $(".message-container").append(html);
        get_message(uid);
    }

    function insert_agent_html(msg){
        var time = dateFormat();
        if(msg.datetime){
            time = dateFormat("yyyy-MM-dd hh:mm:ss",new Date(msg.datetime));
        }
        if(!msg.chat_type){
            msg.chat_type = 'text';
        }
        var html = ' <div class="message-agent">\n' +
            '                <div class="message-agent-time-sender message-time-sender">\n' +
            '                    <span class="message-agent-time">' + time + '</span>\n' +
            '                    <span class="">我</span>\n' +
            '                </div>\n';

        if(msg.chat_type == "text"){
            html +=      '  <div class="message-agent-content message-content">\n' +
                        '        <div>' + msg.content + '</div>\n' +
                        '    </div>\n' ;
        }else if(msg.chat_type == "image"){
            html += ' <div class="msg-agent-img">' +
                '       <a href="'+ msg.image +'"target="_blank">' +
                '           <img src="' + msg.image + '" alt="photo">'+
                '       </a>' +
                '    </div>';
        }

        html +=   '            </div>';
        $('#section-'+msg.uid).append(html);
    }


    function insert_client_html(msg){
        var time = dateFormat();
        if(msg.datetime){
            time = dateFormat("yyyy-MM-dd hh:mm:ss",new Date(msg.datetime));
        }
        if(!msg.chat_type){
            msg.chat_type = 'text';
        }
        var html = '<div class="message-client">\n' +
            '                <div class="message-time-sender">\n' +
            '                    <span class="message-client-time">' + time + '</span>\n' +
            '                    <span class="">客户</span>\n' +
            '                </div>\n' ;
        if(msg.chat_type == "text"){
            html += '                <div class="message-client-content message-content">\n' +
                '                    <div>' + msg.content + '</div>\n' +
                '                </div>\n'  ;
        }else if(msg.chat_type == "image"){
            html += ' <div class="msg-client-img">' +
                '       <a href="'+ msg.image +'"target="_blank">' +
                '           <img src="' + msg.image + '" alt="photo">'+
                '       </a>' +
                '    </div>';
        }

        html += '            </div>';
        $('#section-'+msg.uid).append(html);
    }

    function insert_user_html(id,name) {
        var html = '<div class="user-info layui-row" id="' + id + '">\n' +
            '                <div class="layui-col-xs3 user-avatar">\n' +
            '                    <img src="/images/server/mine_fill_blue.png">\n' +
            '                </div>\n' +
            '                <div class="layui-col-xs8 user-name">' + name + '-' + id + '</div>\n' +
            '                <span class="layui-badge-dot layui-col-xs1 msg-tips"></span>'+
            '            </div>';
        $('.chat-user').append(html);
    }

    function msg_sender_status(status){
        if(status){
            $(".btnMsgSend").removeClass("layui-btn-disabled");
            $("#msg-send-textarea").removeAttr("disabled");
            $(".empty-status").hide();
        }else{
            $(".btnMsgSend").addClass("layui-btn-disabled");
            $("#msg-send-textarea").attr("disabled","disabled");
            $(".empty-status").show();
        }
    }

    function msg_notification(msg) {
        $(".chat-user #"+msg.uid+" .msg-tips").show();
        if(window.Notification && Notification.permission !== "denied") {
            Notification.requestPermission(function(status) {
                var n = new Notification('您有新的消息', { body: msg.content });
            });
        }
    }

    function update_online_status() {
        var num = uuids.length;
        if(online_num > num){
            num = online_num;
        }
        $(".friend-head-right").html( online_num + ' / ' + num + ' 人' );
    }

    //发送消息
    function msg_send() {
        var msg = $("#msg-send-textarea").val();
        if(msg){
            var msg_sender = {
                "type":'private',
                "uid":currentUUID,
                "content":msg,
                "from_uid":uuid,
                "chat_type":'text'
            };
            socket.emit('message', msg_sender);
            insert_agent_html(msg_sender);
            scrollToBottom();
            $("#msg-send-textarea").val('');
        }
    }

    //获取在线用户
    function get_users() {
        $.get('/users',function (data) {
            if(data.code == 200){
                $('.chat-user').html('');

                var data = data.data;

                data.forEach(function (user) {
                    insert_user_html(user.uid,user.name + '#'+ (uuids.length + 1));
                    //创建聊天section
                    insert_section(user.uid);
                    uuids.push(user.uid);
                });
                if(data.length > 0 && !currentUUID){
                    currentUUID = data[0].uid;
                }

                $(".user-info").css("background","#ffffff");
                $("#"+currentUUID).css("background","#f2f3f5");
                $(".user-section").hide();
                msg_sender_status(true);
                $("#section-"+currentUUID).show();
                update_online_status();
            }
        });
    }

    //获取最新的五条数据
    function get_message(uid) {
        $.get('/message?uid='+uid,function (data) {
            if(data.code == 200){
                data.data.reverse().forEach(function (msg) {
                    if(msg.from_uid == uid){
                        msg.uid = msg.from_uid;
                        insert_client_html(msg);
                    }else{
                        msg.uid = msg.to_uid;
                        insert_agent_html(msg);
                    }

                    scrollToBottom();
                });
            }
        });
    }

    $(".btnMsgSend").click(function(){
        msg_send();
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
                        "uid":currentUUID,
                        "content":'图片消息',
                        "from_uid":uuid,
                        "chat_type":'image',
                        "image":sourceLink
                    };
                    socket.emit('message', msg_sender);
                    insert_agent_html(msg_sender);
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

    //连接服务器
    socket.on('connect', function () {
        console.log('连接成功...');
        uuid = 'chat-kefu-admin';
        var ip = $("#keleyivisitorip").html();
        var msg = {
            "uid" : uuid,
            "ip" : ip
        };
        socket.emit('login', msg);
    });

    //后端推送来消息时
    socket.on('message', function(msg){
        insert_client_html(msg);
        scrollToBottom();
        msg_notification(msg);
    });

    //后端推送来消息时
    socket.on('update-users', function(msg){
        if(msg.type == 'offline'){
            //arrayRemove(uuids,msg.uid);
            $(".chat-user #"+msg.uid+" .user-avatar img").attr("src","/images/server/mine_fill.png");
            $("#section-" + msg.uid).hide();
            //$(".chat-user").find("#"+msg.uid).remove();
            msg_sender_status(false);
        }else if(msg.type == 'online'){
            if(!currentUUID){
                currentUUID = msg.uid;
            }

            if(currentUUID == uuid){
                return false;
            }

            var index = uuids.indexOf(msg.uid);
            if( index ==  -1){
                uuids.push(msg.uid);
                insert_user_html(msg.uid,msg.name + '#'+ (uuids.length + 1));
                //创建聊天section
                insert_section(msg.uid);
            }else{
                if($(".chat-user").find("#"+msg.uid).length == 0){
                    insert_user_html(msg.uid,msg.name + '#'+ (uuids.length + 1));
                    //创建聊天section
                    insert_section(msg.uid);
                }
            }

            $(".chat-user #"+msg.uid+" .user-avatar img").attr("src","/images/server/mine_fill_blue.png");
        }
        update_online_status();
    });

    //更新用户在线数
    socket.on('update_online_count', function(msg){
        online_num = (msg.online_count - 1) >= 0 ? (msg.online_count - 1) : 0;
        update_online_status();
    });

    //切换用户
    $(document).on('click','.user-info',function(){
        var uid = $(this).attr("id");
        currentUUID = uid;
        $(".user-info").css("background","#ffffff");
        $("#"+uid).css("background","#f2f3f5");
        $(".user-section").hide();
        $("#section-"+uid).show();
        msg_sender_status(true);
        $(".chat-user #"+uid+" .msg-tips").hide();
    });

    init();
    get_users();
});