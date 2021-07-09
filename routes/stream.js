const express = require('express');
const {issueToken, checkToken} = require('../config/authentication')
const events = require('events');
const receiver = new events.EventEmitter()
var router = express.Router();

var emitter;

router.setEmitter = (e) => {
  emitter = e;
  console.log(emitter);
}

if (typeof emitter === "Object") {
  emitter.on('TEST', () => {
    console.log('test');
  })
}

// hook up to eventStream
router.get('/:userid', checkToken, (req, res) => {
  // method of sending is res.write
  res.write()


})



// module.exports = router;



// alternate setup
var altRouter = express.Router();

// emitter to be initialized by initStreamRouter
var emitter; 


altRouter.get('/:userid', (req, res, next) => {
  console.log("test");
  next();
}, checkToken, (req, res) => {
  // you're connected
  console.log("connection!")

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })
  res.write(`event: message\nid: ${new Date()}\ndata: content on taskstream event\n\n`);

  /* 
  // set headers
  res.set({
    'Cache-Control' : 'no-cache',
    'Content-Type' : 'text/event-stream',
    'connection' : 'keep-alive'
  });
  // res.flushHeaders();

  // time to write something
  res.write('test message\n\n');
  
  setInterval(()=>{
    res.write('test message\n\n');
    console.log('message written');
  },1000);
  
  setTimeout(()=>{
    console.log('final transmission');
    res.send('that\'s all');
  }, 10000)

  emitter.on(req.params.userid, ()=> {
    res.write()
  })
  */
})

// set emitter
initStreamRouter = (eEmit) => {
  emitter = eEmit; 
  console.log(emitter);
  return altRouter;
}



module.exports = initStreamRouter;