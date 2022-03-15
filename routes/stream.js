const express = require('express');
const {issueToken, checkToken} = require('../config/authentication')
const events = require('events');
// const receiver = new events.EventEmitter()
// var router = express.Router();

// var emitter;

// router.setEmitter = (e) => {
//   emitter = e;
//   console.log(emitter);
// }

// if (typeof emitter === "Object") {
//   emitter.on('TEST', () => {
//     console.log('test');
//   })
// }

// // hook up to eventStream
// router.get('/:userid', checkToken, (req, res) => {
//   // method of sending is res.write
//   res.write()



// })



// // module.exports = router;



// // alternate setup
// var altRouter = express.Router();

// // emitter to be initialized by initStreamRouter
// // please note all caps to be treated as constant, though it is declared as a var due to requirement that it be declared before it can be initialized
// var EMITTER; 


// altRouter.get('/:userid', (req, res, next) => {
//   console.log("test");
//   next();
// }, checkToken, (req, res) => {
//   // you're connected
//   console.log("connection!")

//   res.writeHead(200, {
//     'Content-Type': 'text/event-stream',
//     'Cache-Control': 'no-cache',
//     'Connection': 'keep-alive'
//   })
//   res.write(`event: message\nid: ${new Date()}\ndata: content on taskstream event\n\n`);

//   /* 
//   // set headers
//   res.set({
//     'Cache-Control' : 'no-cache',
//     'Content-Type' : 'text/event-stream',
//     'connection' : 'keep-alive'
//   });
//   // res.flushHeaders();

//   // time to write something
//   res.write('test message\n\n');
  
//   setInterval(()=>{
//     res.write('test message\n\n');
//     console.log('message written');
//   },1000);
  
//   setTimeout(()=>{
//     console.log('final transmission');
//     res.send('that\'s all');
//   }, 10000)

//   emitter.on(req.params.userid, ()=> {
//     res.write()
//   })
//   */
// })

// // set emitter
// initStreamRouter = (eEmit) => {
//   emitter = eEmit; 
//   // console.log(emitter);
//   return altRouter;
// }



// module.exports = initStreamRouter;



var router = express.Router();

// emitter to be initialized by initStreamRouter
// please note all caps to be treated as constant, though it is declared as a var due to requirement that it be declared before it can be initialized
var EMITTER; 

router.get('/:userid', 
  (req, res, next)=>{
    console.log("\nFrom routes/stream.js - router.get(:/userid)\n")
    console.log("req.cookies: ", req.cookies);
    console.log("Moving on");
    next();
  }, 
  checkToken, 
  (req, res) => {
    try {
      console.log(`\nFrom routes/stream.js - router.get(:/userid)\nIncoming attempt for user ${req.params.userid}`);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      })

      if (req.params.userid !== String(req.user._id)) {
        console.log("Wrong user");
        console.log("req.params.userid: ", req.params.userid, "req.user._id: ", String(req.user._id));
        res.write(`event: message\nid: ${new Date().valueOf()}\ndata: You may only access your own eventStream\n\n`);
        res.end();
      } else {
        console.log("From stream.js");
        console.log("Correct User: ", req.params.userid);
        res.write(`event: message\nid: ${new Date().valueOf()}\ndata: You are connected to the event stream\n\n`);

        EMITTER.on(req.params.userid, (doc) => {
          res.write(`event:\nid: ${new Date()}, \ndata:${doc}`);
        })
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  
  }
)

module.exports = (eEmit) => {
  EMITTER = eEmit;
  return router;
}