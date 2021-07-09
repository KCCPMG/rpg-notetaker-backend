var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var cors = require('cors');
// var logger = require('morgan');
var mongoose = require('mongoose');
var dotenv = require('dotenv');
var passport = require('passport');
const events = require('events');
var eventEmitter = new events.EventEmitter();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var campaignsRouter = require('./routes/campaigns');
// var messagesRouter = require('./routes/messages');
const initMessagesRouter = require('./routes/messages');
var initStreamRouter = require('./routes/stream');


// streamRouter.setEmitter(eventEmitter);
// eventEmitter.emit('TEST')

var app = express();


app.use(cors({
  'origin': ['http://localhost:3000'],
  'credentials': true
}))

// .env setup
dotenv.config({
  path: './.env'
})

// DB Config
const dbstring = process.env.MongoURI;

// Connect to Mongo
mongoose.connect(dbstring, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error: "))
db.once('open', function() {
  console.log("Connected to mongo")
})

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Passport config and use
require('./config/passport');
app.use(passport.initialize());

// app.use('/', indexRouter);
app.get('/', (req, res) => {
  console.log('incoming test');
  console.log(req.body);
  console.log(req.cookies["TEST"]);
  res.cookie("TEST", "I'm a cookie test", {httpOnly: true});
  res.send('home test');
})
app.use('/users', usersRouter);
app.use('/campaigns', campaignsRouter);
// app.use('/messages', messagesRouter);
app.use('/messages', initMessagesRouter(eventEmitter));
app.use('/stream', initStreamRouter(eventEmitter));

// test
var testRouter = require('./routes/test')
app.use('/test', testRouter("trout"))

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
  // res.render('error');
});

app.listen('3001', ()=>{
  console.log("listening");
});

module.exports = app;
