var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs')



var indexRouter = require('./routes/index');
var ordersRouter = require('./routes/orders');
var paymentsRouter = require('./routes/payments');
var reserveNickRouter = require('./routes/reserveNick');
var ldapRouter = require('./routes/ldap');
var menuRouter = require('./routes/menu');
var pushModule = require('./push');

var app = express();

//http logs
// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
// setup the logger
app.use(logger('combined', {stream: accessLogStream}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Main variable to store table data.
app.locals.items = [];
app.locals.paymentTable = [];
app.locals.menuTable = [];

var fs = require('fs');

try {
   //file in format
   /*
    Dish1(every day different) - 4.50 $,
    Dish2(every day different) - 1.50 $,
    ...
   */
    var menu = fs.readFileSync(path.join(__dirname ,   'menu.txt'), 'utf8');
    let arr = menu.split('zł,');


    arr.forEach(function(element) {
      let index1 = element.lastIndexOf('-') + 1;
      let index2 = element.length - 1;
      let price = element.substr(index1,  index2);
      if(element !== undefined && element.length > 0){
        app.locals.menuTable.push( { name: element + ' zł', val: parseFloat(price.trim()).toFixed(2) });
        console.log(" add element to menu: *" + element + "*");
      }
    });
    //console.log(app.locals.menuTable);

} catch(e) {
    console.log('Error:', e.stack);
}


app.use('/', indexRouter);
app.use('/getOrders', ordersRouter);
app.use('/getPayments', paymentsRouter);
app.use('/reserveNick', reserveNickRouter);
app.use('/ldap', ldapRouter);
app.use('/getMenu', menuRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var server = require('http').createServer(app);

var io  = pushModule.pushMethods(server,  app);

server.listen(/*3602*/ process.env.PORT || 8080, () => console.log("all is ok!"));
logger ('server listen');

process.stdin.resume();

process.on('SIGINT', () => {
  console.log('Received SIGINT.');

  app.locals.items = [];
  io.sockets.emit("server exit");
  console.log('Exit of server');
  process.exit(1);
});


module.exports = app;
