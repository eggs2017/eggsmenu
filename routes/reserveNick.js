var express = require('express');
var router = express.Router();
const dns = require('dns');

const ldap = require('ldapjs');
var Q = require('q');

let vipName = [
  { name: 'gmacial' , prefix: 'Sz. Pan'}
];

function findByPerson(array, value){
    return array.filter(function(elem, _index){
        return value === elem.name;
    });
}

router.get('/', function (req, res, next) {
    let nick = '';
    let domain = '';

    console.log("remote address is " + req.connection.remoteAddress);
    dns.lookupService(req.connection.remoteAddress, 22, (err, hostname, service) => {
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

          console.log("nick: " + nick, "host: " + host, "domain: " + domain, "domain1: " + domain1 , "domain2: " + domain2);

          let cn = nick;
          let dc1 =  domain1;
          let dc2 =  domain2;
          //ldap
          var client = ldap.createClient({url: 'ldap://ldap:389'});

          let search = undefined;
          let param = "cn=" + cn+'@' + dc1 + "." + dc2
                      + ",dc=" + dc1
                      + ",dc=" + dc2;
          let options = {scope: 'base'};

          Q.fcall( function( myObject ){
                var deferred = Q.defer();
                client.bind('', '', function (err) {
                  deferred.resolve( client );
                })
                return deferred.promise;
              }
            )
            .then(function( client ){
                  var deferred = Q.defer();

                  client.search(param, options, function (err, searchParam) {
                      search  = searchParam;
                      deferred.resolve( search );
                  })
                  return deferred.promise;
                }
            )
            .then(function(search){
                  var deferred = Q.defer();
                  search.on('searchEntry', function(entry) {
                  outputResult = { firstName: entry.object.givenName, lastName: entry.object.sn};
                  deferred.resolve( outputResult );
                })
                return deferred.promise;
              }
            )
            .catch(function (error) {
                // Handle any error from all above steps
                console.log('Error outputResult' , error);
            })
            .done( function D(outputResult){
                let vipPerson =  findByPerson(vipName, nick);
                let vipPrefix = "";
                if(vipPerson.length > 0 )
                  vipPrefix =  vipPerson[0].prefix;

                res.send( JSON.stringify(
                                          { nick: nick,
                                            person: vipPrefix + " " + outputResult.firstName + ", " + outputResult.lastName
                                          } ));
              }
            );
      }
    });
  });


module.exports = router;
