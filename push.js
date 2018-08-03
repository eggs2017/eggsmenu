exports.pushMethods = function(server, app){

var sio     = require("socket.io");

var io  = sio.listen(server);

  io.sockets.on('connection', function(socket){


      //send message to user
      socket.on("add order", function(msg) {

              logger.info("send message msg body: " + msg.body + " msg sender: " + msg.sender );

              let item = JSON.parse(msg.body);

              //check if already exists
              let existsItem ;
              app.locals.items.forEach(function(element) {
                  if(element.id === item.id){
                    existsItem = element;
                  }
              })

              if(existsItem != undefined ){
                existsItem.amount = item.amount
                logger.info("^update item: " + existsItem.id);
              }
              else{
                  app.locals.items.push(item);
                  logger.info("**insert item: " + item.id);
              }
              io.sockets.emit("update orders",  JSON.stringify(app.locals.items));

      });

      socket.on("removeItem", function(msg) {
        ;
              let itemId = msg.body;

              let index =  app.locals.items.findIndex(function(element){
                return element.id ===  itemId;
              });

              if(index != -1){
                logger.info("remove at index " + index );
                app.locals.items.splice(index, 1);
              }

              logger.info("rest of items " + JSON.stringify(app.locals.items) );

              //Emit
              io.sockets.emit("update orders", JSON.stringify(app.locals.items));

      });


      socket.on("doPayment", function(msg) {


            let index =  app.locals.paymentTable.findIndex(function(element){
              return element.paymentFor ===  msg.paymentFor;
            });

            //remove if exist
            if(index != -1){
              app.locals.paymentTable.splice(index, 1);
            }

            //insert
            app.locals.paymentTable.push(msg);
            logger.info("payment items " + JSON.stringify(app.locals.paymentTable) );

            io.sockets.emit("update payment", JSON.stringify(app.locals.paymentTable));
        });


        function removeByIndex(array, index){
            return array.filter(function(elem, _index){
                return index != _index;
            });
        }

        function removeByValue(array, value){
            return array.filter(function(elem, _index){
                return value != elem;
            });
        }

        socket.on("removePayment", function(msg) {
              let index =  app.locals.paymentTable.findIndex(function(element){
                return element.paymentFor ===  msg.paymentFor;
              });

              //remove if exist
              if(index != -1){
                logger.info("remove index " + index + " item: " +  JSON.stringify(app.locals.paymentTable[index]));
                app.locals.paymentTable = removeByIndex(app.locals.paymentTable, index);
              }

              //remove all items for it
              let itemsToRemove = [];
              app.locals.items.forEach(function(element) {
                if(element.nick === msg.paymentFor){
                  itemsToRemove.push(element);
                }
              });

              itemsToRemove.forEach(function(element) {
                app.locals.items = removeByValue(app.locals.items, element);
                logger.info("remove item " + JSON.stringify(element) + " By: " + msg.approvedBy);
              });

              //Emit
              io.sockets.emit("update payment", JSON.stringify(app.locals.paymentTable));
              io.sockets.emit("update orders", JSON.stringify(app.locals.items));
          });

   });
  return io;
}
