var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var morgan = require('morgan')
var fs = require('fs')

var logger = require('./libs/logger')
var menuTable = require('./libs/menuReader')
var compression = require('compression')

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
