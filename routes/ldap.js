var express = require('express');
var router = express.Router();
var logger = require('../libs/logger')

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
    .then(function( search ){
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
        logger.error('Error outputResult' , error);
    })
    .done( function D(outputResult){

        logger.info('outputResult', outputResult);
        res.send(outputResult);
      }
    );

  //console.log("res.send");
  //res.send( JSON.stringify( {nick:  'nothing'} ));

});

module.exports = router;
