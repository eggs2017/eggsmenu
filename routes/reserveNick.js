

var express = require('express');
var router = express.Router();
const dns = require('dns');
var logger = require('../libs/logger')

const ldap = require('ldapjs');

let vipName = [
  { name: 'gmacial' , prefix: 'Sz. Pan'}
];

function findByPerson(array, value){
    return array.filter(function(elem, _index){
        return value === elem.name;
    });
}

let nick = '';


router.get('/', function (req, res, next) {

    logger.info("remote address is " + req.connection.remoteAddress);


          //callback hell maintain
            function prepareDns(address, port){
              return new Promise((resolve, reject) => {

                dns.lookupService(address, port, (err, hostname, service) => {

                  let domain = '';

                  if(err)
                    reject(err);
                  else {
                      let host ='';
                      if(hostname !== undefined)
                        host = hostname;
                      else {
                        host = req.connection.remoteAddress + ".pl";
                      }

                      host = host.toLowerCase();
                      //remove pc, remove - rest

                        //remove pc
                      host = host.substring(2, host.length);

                      let index =  host.indexOf("-");
                      let dotIndex =  host.indexOf(".");

                      if(index > 0)
                        this.nick = host.substring(0, index);
                      else if(dotIndex > 0)
                        this.nick = host.substring(0, dotIndex);

                      //search domain
                      index = host.indexOf(".") + 1;
                      let domain = host.substring(index);
                      let domain1 = domain.substring(0, domain.indexOf(".") );
                      let domain2 = domain.substring(domain.indexOf(".")+1);


                      let cn = this.nick;
                      let dc1 =  domain1;
                      let dc2 =  domain2;

                      let search = undefined;
                      param = "cn=" + cn+'@' + dc1 + "." + dc2
                                  + ",dc=" + dc1
                                  + ",dc=" + dc2;


                      resolve( {nick : this.nick, param : param } );
                  }

              });
            });
          }


          function bindClient(url){
              return new Promise((resolve, reject) => {
                var client = ldap.createClient({url: url});
                client.bind('', '', function (error) {
                  if(error)
                    reject(error);
                  else{
                    console.log('resolve client ' + client);
                    resolve( client );
                  }
                });
              });
          }

          function searchUser(client, param){
              return new Promise((resolve, reject) => {

                client.search(param, {scope: 'base'}, function (error, ret) {
                if(error)
                  reject(error);
                else
                  resolve(ret);
              });
            });
          }


          function searchEntry(search){
            return new Promise((resolve, reject) => {
              search.on('searchEntry', function(entry) {
                resolve(
                      {
                          firstName : entry.object.givenName,
                          lastName  : entry.object.sn
                      });
              });
            });
          }

            //Promises

            Promise.all(
            [
                bindClient('ldap://ldap:389'),//prepare ldap client
                prepareDns(req.connection.remoteAddress ,22), //get nick and params to ask ldap
            ])
            .then(resp => searchUser(resp[0], resp[1].param))
			
            .then(ret => {searchEntry(ret)}).catch( err=>{
				console.error(err)
				var vip = vipName[0]
							res.send( JSON.stringify(
                                { nick: vip.name,
                                  person: vip.prefix + " " + vip.name
                                } )
                              );
			})
            .then(ret => {
                  let vipPerson =  findByPerson(vipName, this.nick);
                  let vipPrefix = "";
                  if(vipPerson.length > 0 )
                    vipPrefix =  vipPerson[0].prefix;

                  res.send( JSON.stringify(
                                { nick: this.nick,
                                  person: vipPrefix + " " + ret.firstName + " " + ret.lastName
                                } )
                              );
                })
                .catch(err=> {
						console.error(err)
						
						var vip = vipName[0]
							res.send( JSON.stringify(
                                { nick: vip.name,
                                  person: vip.prefix + " " + vip.name
                                } )
                              );
				});
				
						
  });


//export reserveNick;
module.exports = router;
