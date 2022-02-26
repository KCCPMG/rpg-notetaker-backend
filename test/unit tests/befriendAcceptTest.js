// passes test

var dotenv = require('dotenv');
var mongoose = require('mongoose');
const util = require('util');
const User = require('../../models/User.js');
const Thread = require('../../models/Thread.js');
const Message = require('../../models/Message.js');

const controls = require('../../models/Controls.js');

const deepPrint = (obj) => {
  console.log(util.inspect(obj, {
    showHidden: false,
    depth: null,
    colors: true
  }))
}

// Assign necessary imports here
let {newUser, newThread, befriendRequest, CHAT, befriendAccept} = controls;

dotenv.config({
  path: '../../.env'
})


// test method
runTest = async() => {
  
  // Clear database
  await Promise.all([
    User.deleteMany({}), 
    Thread.deleteMany({}),
    Message.deleteMany({})
  ])
  console.log("Finished Delete");

  // Write test here
  let testUser = await newUser({
    name: "Test",
    email: "test@test.com",
    password: "1234",
    confirmed: true,
  });

  let testUser2 = await newUser({
    name: "Test2",
    email: "test2@test.com",
    password: "1234",
    confirmed: true,
  });

  let testThread = await newThread({
    participants: [testUser, testUser2],
    chatType: CHAT
  })

  let bfReq = await befriendRequest({
    sender: testUser._id,
    threadIds: [testThread._id],
    text: "Hello please be my friend"
  });

  console.log(bfReq);

  // console.log(await befriendAccept({
  //   sender: testUser2._id,
  //   origMessage: bfReq._id,
  //   threadIds: [bfReq.threadIds[0]],
  //   text: "OK I will be your friend", 
  // }));

  let bfAccept = await befriendAccept({
    sender: testUser2._id,
    origMessage: bfReq._id,
    threadIds: [bfReq.threadIds[0]],
    text: "OK I will be your friend", 
  }, true);

  deepPrint(bfAccept);
  // bfAccept.nt

  // get both users back, check their friends
  [testUser, testUser2, bfReq] = await Promise.all([
    User.findById(testUser._id).exec(), 
    User.findById(testUser2._id).exec(),
    Message.findById(bfReq._id).exec()
  ])

  console.log(testUser._id, testUser.friends);
  console.log(testUser2._id, testUser2.friends);
  console.log(bfReq);

}


// mongoose handling
const dbstring = "mongodb://localhost:27017/RolePlayingBaseTest?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false"

mongoose.connect(dbstring, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useFindAndModify: false
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error: "))
db.once('open', async function() {
  console.log("Connected to mongo");
  try {
    // Run test
    await runTest();
    db.close();
  } catch(e) {
    console.log(e);
    db.close();
  }
})



