exports.pushMethods = function(server, app){

var sio     = require("socket.io");

var io  = sio.listen(server);

  io.sockets.on('connection', function(socket){


      //send message to user
      socket.on("add order", function(msg) {

              console.log("send message msg body: " + msg.body + " msg sender: " + msg.sender );

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
                console.log("^update item: " + existsItem.id);
              }
              else{
                  app.locals.items.push(item);
                  console.log("**insert item: " + item.id);
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
                console.log("remove at index " + index );
                app.locals.items.splice(index, 1);
              }

              console.log("rest of items " + JSON.stringify(app.locals.items) );

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
            console.log("payment items " + JSON.stringify(app.locals.paymentTable) );

            io.sockets.emit("update payment", JSON.stringify(app.locals.paymentTable));
        });


        socket.on("removePayment", function(msg) {
              let index =  app.locals.paymentTable.findIndex(function(element){
                return element.paymentFor ===  msg.paymentFor;
              });

              //remove if exist
              if(index != -1){
                app.locals.paymentTable.splice(index, 1);
              }

              //remove all items for it
              let itemsToRemove = [];
              app.locals.items.forEach(function(element) {
                if(element.nick === msg.paymentFor){
                  itemsToRemove.push(element);
                  console.log("remove item " + JSON.stringify(element) + " By: " + msg.approvedBy);
                }
              });

              itemsToRemove.forEach(function(element) {
                app.locals.items.splice(element ,1);
              });

              //Emit
              io.sockets.emit("update payment", JSON.stringify(app.locals.paymentTable));
              io.sockets.emit("update orders", JSON.stringify(app.locals.items));
          });

   });
  return io;
}
