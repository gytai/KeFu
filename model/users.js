var mongoose = require('../mongoose').mongoose;
var crypto = require('crypto');

var Schema = mongoose.Schema;

var UsersSchema = new Schema({
    username : { type:String },
    password : { type:String },
    time : { type:Date, default:Date.now }
});

var UsersModel = mongoose.model("users", UsersSchema);

function login(username,password,callback) {
    var md5 = crypto.createHash('md5');
    password = md5.update(password).digest('hex');
    var condition = {'username' : username,'password':password};

    UsersModel.findOne(condition, function(err, res){
        var _err = null;
        if (err) {
            _err = err;
        }
        if(!res){
            _err = '用户名密码不正确';
        }
        return callback(_err,res);
    })
}

function reset_psw(username,psw_old,psw_new,callback) {
    psw_old = crypto.createHash('md5').update(psw_old).digest('hex');
    UsersModel.find({username:username,password:psw_old},function (err,info) {
        if (err) {
            return callback(err,null);
        }

        if(!info || info.length == 0){
            return callback('原密码不正确',null);
        }
        psw_new = crypto.createHash('md5').update(psw_new).digest('hex');
        UsersModel.findOneAndUpdate({username:username,password:psw_old}, {password:psw_new}, callback);
    });
}

exports.login = login;
exports.reset_psw = reset_psw;