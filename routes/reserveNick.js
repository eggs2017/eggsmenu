var express = require('express');
var router = express.Router();
  const dns = require('dns');



router.get('/', function (req, res, next) {
    let nick = '';

    console.log("remote address is " + req.connection.remoteAddress);
    dns.lookupService(req.connection.remoteAddress, 22, (err, hostname, service) => {
      console.log(hostname, service);
      if(hostname !== undefined)
        nick = hostname;
      else {
        nick = req.connection.remoteAddress + ".pl";
      }

      console.log("new reserved Nick is: "+  nick);
      res.send( JSON.stringify( {nick: nick } ));
    });
  });


module.exports = router;
