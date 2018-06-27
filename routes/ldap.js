var express = require('express');
var router = express.Router();
const dns = require('dns');
var Q = require('q');


router.get('/:cn/:dc1/:dc2', function (req, res, next) {

  const ldap = require('ldapjs');

  // Create client and bind to AD
  var client = ldap.createClient({url: 'ldap://ldap:389'});

  let search = undefined;
  let param = "cn=" + req.params.cn+'@' + req.params.dc1 + "." + req.params.dc2
              + ",dc=" + req.params.dc1
              + ",dc=" + req.params.dc2;
  let options = {scope: 'base'};

  Q.fcall( function( myObject ){
        var deferred = Q.defer();
        client.bind('', '', function (err) {
          console.log("*STEP");
          deferred.resolve( client );
        })
        return deferred.promise;
      }
    )
    .then(function( client ){
        var deferred = Q.defer();

          client.search(param, options, function (err, searchParam) {
              console.log("**STEP 1 ");
              search  = searchParam;
              deferred.resolve( search );
              console.log("**STEP 1A");
          })
          return deferred.promise;
        }
    )
    .then(function( search ){
        var deferred = Q.defer();
        search.on('searchEntry', function(entry) {
          console.log("***STEP 2 ");
          console.log('entry object: ' + JSON.stringify(entry.object));
          outputResult = { firstName: entry.object.givenName, lastName: entry.object.sn};
          deferred.resolve( outputResult );
          console.log("***STEP 2A");
        })
        return deferred.promise;
      }
    )
    .catch(function (error) {
        // Handle any error from all above steps
        console.log('Error outputResult' , error);
    })
    .done( function D(outputResult){
        console.log("**** STEP 3");
        console.log('outputResult', outputResult);
        res.send(outputResult);
      }
    );

  //console.log("res.send");
  //res.send( JSON.stringify( {nick:  'nothing'} ));

});

module.exports = router;
