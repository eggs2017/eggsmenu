var express = require('express');
var router = express.Router();
const dns = require('dns');

router.get('/:cn/:dc1/:dc2', function (req, res, next) {

  const ldap = require('ldapjs');

  // Create client and bind to AD
  var client = ldap.createClient({
    url: 'ldap://ldap:389'
  });

  // Search AD for user
  const searchOptions = {
      scope: 'base'
  };


  client.bind('', '', function (err) {
    console.log("bind success");
    let param = "cn=" + req.params.cn+'@' + req.params.dc1 + "." + req.params.dc2
                + ",dc=" + req.params.dc1
                + ",dc=" + req.params.dc2;
    console.log(param);

    client.search(param, searchOptions, function (err, search) {
        console.log("search success");
        console.log(err);
        console.log(search);
        //res.send( JSON.stringify( {nick:  search} ));

        search.on('searchEntry', function(entry) {
          console.log('entry: ' + JSON.stringify(entry.object));
          res.send( { firstName: entry.object.givenName, lastName: entry.object.sn} );
        });

        search.on('end', function(result) {
          console.log('status: ' + result.status);
        });
    });
  });

  console.log("res.send");
  //res.send( JSON.stringify( {nick:  'nothing'} ));

});

module.exports = router;
