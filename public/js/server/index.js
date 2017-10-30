//一般直接写在一个js文件中
layui.use(['layer', 'form', 'jquery'], function () {
    var layer = layui.layer
        , form = layui.form
        , $ = layui.jquery;

    var currentUUID = '';
    var uuid = '';
    var socket = io.connect('http://'+document.domain+':9010');

    var uuids = [];

    //页面初始化函数
    function init() {
        $(".admin-index").addClass("layui-this");

        var height = document.body.clientHeight - 262;
        $(".message-container").css("height", height);

        window.onresize = function(){
            var height = document.body.clientHeight - 262;
            $(".message-container").css("height", height);
        }
    }

    //聊天窗口自动滚到底
    function scrollToBottom() {
        var div = document.getElementById('message-container');
       div.scrollTop = div.scrollHeight;
    }

    function insert_section(uid) {
        var html = '<section class="user-section" id="section-'+ uid +'" style="display: none;"></section>';
        $(".message-container").append(html);
    }

    function insert_agent_html(content){
        var date = dateFormat();
        var html = ' <div class="message-agent">\n' +
            '                <div class="message-agent-time-sender message-time-sender">\n' +
            '                    <span class="message-agent-time">' + date + '</span>\n' +
            '                    <span class="">我</span>\n' +
            '                </div>\n' +
            '                <div class="message-agent-content message-content">\n' +
            '                    <div>' + content + '</div>\n' +
            '                </div>\n' +
            '            </div>';
        $('#section-'+currentUUID).append(html);
    }


    function insert_client_html(uid,content){
        var date = dateFormat();
        var html = '<div class="message-client">\n' +
            '                <div class="message-time-sender">\n' +
            '                    <span class="message-client-time">' + date + '</span>\n' +
            '                    <span class="">客户</span>\n' +
            '                </div>\n' +
            '                <div class="message-client-content message-content">\n' +
            '                    <div>' + content + '</div>\n' +
            '                </div>\n' +
            '            </div>';
        $('#section-'+uid).append(html);
    }

    function insert_user_html(id,name) {
        var html = '<div class="user-info layui-row" id="' + id + '">\n' +
            '                <div class="layui-col-xs3 user-avatar">\n' +
            '                    <img src="/images/server/mine_fill.png">\n' +
            '                </div>\n' +
            '                <div class="layui-col-xs9 user-name">' + name + '-' + id + '</div>\n' +
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

    function getUsers() {
        $.get('/users',function (data) {
            if(data.code == 200){
                $('.chat-user').html('');

                var data = data.data;

                data.forEach(function (user) {
                    insert_user_html(user.uid,user.name);
                    //创建聊天section
                    insert_section(user.uid);
                });
                if(data.length > 0 && !currentUUID){
                    currentUUID = data[0].uid;
                }

                $(".user-info").css("background","#ffffff");
                $("#"+currentUUID).css("background","#f2f3f5");
                $(".user-section").hide();
                $("#section-"+currentUUID).show();
            }
        });
    }

    $(".btnMsgSend").click(function(){
        var msg = $("#msg-send-textarea").val();
        if(msg){
            var msg_sender = {
                "type":'private',
                "uid":currentUUID,
                "content":msg,
                "from_uid":uuid
            };
            socket.emit('message', msg_sender);
            insert_agent_html(msg);
            scrollToBottom();
            $("#msg-send-textarea").val('');
        }
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
        insert_client_html(msg.uid,msg.content);
        scrollToBottom();
    });

    //后端推送来消息时
    socket.on('update-users', function(msg){
        if(msg.type == 'offline'){
            $("#"+msg.uid).remove();
            arrayRemove(uuids,msg.uid);
            $("#section-" + msg.uid).remove();
            $(".chat-user").find("#"+msg.uid).remove();
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
        }
    });

    //更新用户在线数
    socket.on('update_online_count', function(msg){
        var count = (msg.online_count - 1) >= 0 ? (msg.online_count - 1) : 0;
       $(".friend-head-right").html( count + '人' );
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
    });


    init();
    getUsers();
});