var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var morgan = require('morgan')
var winston = require('winston')
var fs = require('fs')
var compression = require('compression')


logger = winston.createLogger(
  {
    level: 'info',
    format: winston.format.json(),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log`
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ]
  }
)


var indexRouter     = require('./routes/index')
var ordersRouter    = require('./routes/orders')
var paymentsRouter  = require('./routes/payments')
var reserveNickRouter = require('./routes/reserveNick')
var ldapRouter = require('./routes/ldap')
var menuRouter = require('./routes/menu')
var pushModule = require('./push')

var app = express()



app.use(compression({
        //threshold: 15,
        filter: function(req,res) {
            logger.info("Compression...");
            return compression.filter(req, res);
        }
    }));


//http logs
// create a write stream (in append mode)
// setup the logger
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'})
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


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
        app.locals.menuTable.push( { name: element + '', val: parseFloat(price.trim()).toFixed(2) });
        logger.info(" add element to menu: *" + element + "*");
      }
    });
    //console.log(app.locals.menuTable);

} catch(e) {
    logger.error('Error:' +  e.stack);
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

var pushModuleBlock  = pushModule.pushMethods(server,  app);

server.listen(/*3602*/ process.env.PORT || 8080, () => logger.info("all is ok!"));

process.stdin.resume();

process.on('SIGINT', () => {
  logger.info('Received SIGINT.');

  app.locals.items = [];
  pushModuleBlock.sockets.emit("server exit");
  logger.info('Exit of server');
  process.exit(1);
});


module.exports = app;
