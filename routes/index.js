var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('./server/index');
});

router.get('/admin', function(req, res, next) {
  res.render('./server/index');
});

router.get('/client', function(req, res, next) {
    res.render('./client/index');
});

router.get('/admin/users', function(req, res, next) {
    res.render('./server/users');
});

router.get('/admin/setup', function(req, res, next) {
    res.render('./server/setup');
});

module.exports = router;
