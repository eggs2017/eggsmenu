var express = require('express');
var router = express.Router();
  const dns = require('dns');



function getName( cn, dc1, dc2 ){
  console.log("getName start");
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

    let param = "cn=" + cn+'@' + dc1 + "." + dc2
                + ",dc=" +dc1
                + ",dc=" +dc2;
    console.log(param);

    client.search(param, searchOptions, function (err, search) {
        console.log("search success");
        console.log("error" , err);
        console.log(search);
        //res.send( JSON.stringify( {nick:  search} ));

        search.on('searchEntry', function(entry) {
          console.log('entry: ' + JSON.stringify(entry.object));
          //res.send( { firstName: entry.object.givenName, lastName: entry.object.sn} );

          let name =  { firstName: entry.object.givenName, lastName: entry.object.sn} ;
          console.log("getName return" ,name);
          return name;
        });

        search.on('end', function(result) {
          console.log('status: ' + result.status);
        });
    });
  });
}

router.get('/', function (req, res, next) {
    let nick = '';
    let domain = '';

    console.log("remote address is " + req.connection.remoteAddress);
    dns.lookupService(req.connection.remoteAddress, 22, (err, hostname, service) => {
      console.log("&&&&&&&&&&" ,hostname, service);
      let host ='';
      if(hostname !== undefined)
        host = hostname;
      else {
        host = req.connection.remoteAddress + ".pl";
      }

      host = host.toLowerCase();
      //remove pc, remove - rest
      let pcSuff = "pc";

      if(host.indexOf(pcSuff) == 0 && host.substring(0,2) === pcSuff){

        //remove pc
        host = host.substring(2, host.length);

        let index =  host.indexOf("-");
        let dotIndex =  host.indexOf(".");

        if(index > 0)
          nick = host.substring(0, index);
        else if(dotIndex > 0)
          nick = host.substring(0, dotIndex);

          //search domain
          index = host.indexOf(".") + 1;
          let domain = host.substring(index);
          let domain1 = domain.substring(0, domain.indexOf(".") );
          let domain2 = domain.substring(domain.indexOf(".")+1);

          console.log("nick: " + nick);
          console.log("host: " + host);
          console.log("domain: " + domain);
          console.log("domain1: " + domain1);
          console.log("domain2: " + domain2);

          let name = getName(nick, domain1, domain2) ;
          
          console.log("new reserved Nick is: "+  nick, "name is " + name);
          res.send( JSON.stringify( {nick: nick, name: name.firstName + ", " + name.lastName } ));

      }
    });
  });


module.exports = router;
