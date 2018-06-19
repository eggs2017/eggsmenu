var express = require('express');
var router = express.Router();
var path = require("path");

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
    res.sendFile( path.join(__dirname, '../views', 'react_index.html'));
    console.log("REQ:: "+req.headers.host);
});

module.exports = router;
