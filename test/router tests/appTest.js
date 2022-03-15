var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var cors = require('cors');
// var logger = require('morgan');
var mongoose = require('mongoose');
var Campaign = require('../../models/Campaign.js');
var Character = require('../../models/Character.js');
var Controls = require('../../models/Controls.js');
var Handout = require('../../models/Handout.js');
var IndexEntry = require('../../models/IndexEntry.js');
var JournalEntry = require('../../models/JournalEntry.js');
var Message = require('../../models/Message.js');
var Thread = require('../../models/Thread.js');
var User = require('../../models/User.js');
var dotenv = require('dotenv');

dotenv.config({
  path: '../../.env'
})

// console.log("In appTest");
// console.log(process.env.JWT_SECRET);

var passport = require('passport');
const events = require('events');
var eventEmitter = new events.EventEmitter();
const axios = require('axios');


var indexRouter = require('../../routes/index');
var usersRouter = require('../../routes/users');
var campaignsRouter = require('../../routes/campaigns');
// var messagesRouter = require('./routes/messages');
const initMessagesRouter = require('../../routes/messages')(eventEmitter);
var initStreamRouter = require('../../routes/stream');


// streamRouter.setEmitter(eventEmitter);
// eventEmitter.emit('TEST')

var app = express();


app.use(cors({
  'origin': ['http://localhost:3000'],
  'credentials': true,
  'exposedHeaders': ['set-cookie']
}))

// .env setup


// DB Config
const dbstring = "mongodb://localhost:27017/RolePlayingBaseTest?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false"


// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Passport config and use
require('../../config/passport');
app.use(passport.initialize());





// app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/campaigns', campaignsRouter);
// app.use('/messages', messagesRouter);
// app.use('/messages', initMessagesRouter(eventEmitter));
app.use('/messages', initMessagesRouter);

app.use('/stream', initStreamRouter(eventEmitter));

// basic test handling, in place of app.use('/', indexRouter)
app.get('/', (req, res) => {
  console.log('incoming test');
  console.log("ORIGIN", req.origin);
  console.log("HEADERS", req.rawHeaders);
  // console.trace(req.body);
  // console.trace(req.cookies["TEST"]);
  res.cookie("TEST", "I'm a cookie test", {httpOnly: true});
  res.send('home test');
})

// test
var testRouter = require('../../routes/test')
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

// Connect to Mongo


const shutdown = async (server, eSourceArr) => {
  await Promise.all([
    mongoose.connection.close(),
    server.close(),
    eSourceArr.forEach(es => es.close())
  ]);
}


const listenAndExecute = async (server, eSourceArr, cb) => {
  try {
    console.log("listening\n");
    // axios.get('http://localhost:3001/')
    // .then((resp) => {
    //   // console.log(resp.data);
    //   console.trace(resp.data);
    // })

    // let res = await axios.get('http://localhost:3001/');
    // console.trace(res.data);


    // await mongoose.connect(dbstring, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // })


    // console.log(mongoose.connection.readyState);

    let returnPromiseFunc = () => {
      new Promise();
    };

    // mongoose.connection.once('open', async () => {
    //   console.log("Connected to mongo");
    //   try {
    //     let cbResult = await cb();
    //     console.log(cbResult);
    //     console.log("ok should be done now");
    //     db.close();
    //     server.close();
    //     return cbResult;
    //   } catch(e) {
    //     return e;
    //   }
    // })

    mongoose.connection.on('error', console.error.bind(console, "connection error: "))

    // console.log(mongoose.connection.once, mongoose.connection.readyState);

    let [connect] = await Promise.all([
      // axios.get('http://localhost:3001/'),
      mongoose.connect(dbstring, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
    ]);

    await Promise.all([
      // Campaign.deleteMany({}),
      // Character.deleteMany({}),
      Handout.deleteMany({}),
      IndexEntry.deleteMany({}),
      JournalEntry.deleteMany({}),
      Message.deleteMany({}),
      Thread.deleteMany({}),
      User.deleteMany({}),   
    ]);

    console.log("\ntest database should be cleared\n");

    let cbResult = await cb();
    // console.log(cbResult);
    console.log("\nFrom appTest.js - listenAndExecute: Callback should be finished");

    // await Promise.all([mongoose.connection.close(), server.close()]);
    
    await shutdown(server, eSourceArr);

    console.log("\nFrom appTest.js - listenAndExecute: \nmongoose connection and server connection closed.");

    // console.log("\nFrom appTest.js - listenAndExecute: \nmongoose connection status", mongoose.connection._readyState, "\nserver connection status: ", server);
    
    return cbResult;

  } catch(e) {
    console.error(e);
    await shutdown(server, eSourceArr);
  }
}


app.start = async (cb, eSourceArr) => {
  let server = app.listen('3001', async () => {
    try {
      let finish = await listenAndExecute(server, eSourceArr, cb);
      // console.trace(finish);
      console.log("\nFrom test/router tests/appTest.js - app.start, returned from callback", finish);
      // console.log(server.listening);
    } catch(e) {
      console.log(e);
    }
  });
}

app.openServer = async () => {

  mongoose.connection.on('error', console.error.bind(console, "connection error: "))

  // console.log(mongoose.connection.once, mongoose.connection.readyState);

  let [connect] = await Promise.all([
    // axios.get('http://localhost:3001/'),
    mongoose.connect(dbstring, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
  ]);

  app.listen('3001', (e) => {
    console.log(e);
  });
}

module.exports = app;
