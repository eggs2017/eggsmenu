var express = require('express');
var router = express.Router();
var menuTable = require('../libs/menuReader')
var logger = require('../libs/logger')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send(menuTable);
});

module.exports = router;
