var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send(JSON.stringify(req.app.locals.items));
});

module.exports = router;
