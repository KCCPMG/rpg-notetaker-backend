var dotenv = require('dotenv');
var mongoose = require('mongoose');
const User = require('../models/User.js');
const Thread = require('../models/Thread.js');
const Message = require('../models/Message.js');

const controls = require('../models/Controls.js');

// .env setup
dotenv.config({
  path: './.env'
})

// DB Config
const dbstring = process.env.MongoTestURI;

// Connect to Mongo
mongoose.connect(dbstring, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

// let User = controls.User;
// let Thread = controls.Thread;
// let Message = controls.Message;

let {User, Thread, Message, befriendRequest} = controls;

const runTest = async () => {
  await User.deleteMany({});
  await Thread.deleteMany({});
  await Message.deleteMany({});


  await User.find({}, (err, docs) => {
    if (err) console.log(err);
    else {
      console.log("First Run")
      for (let doc of docs) {
        console.log(doc.name);
      }
    }
  })
  let testUser = new User({
    name: "Test",
    email: "test@email.com",
    password: "123",
    confirmed: true
  })
  let testUser2 = new User({
    name: "Test2",
    email: "test2@email.com",
    password: "123",
    confirmed: true
  })

  // save testUsers 1 and 2
  await Promise.all([
    new Promise((res, rej) => {
      testUser.save((err) => {
        if (err) rej(err);
        else res();
      })
    }),
    new Promise((res, rej) => {
      testUser2.save((err) => {
        if (err) rej(err);
        else res();
      })
    })
  ])

  await User.find({}, (err, docs) => {
    if (err) console.log(err);
    else {
      console.log("Second Run")
      for (let doc of docs) {
        console.log(doc.name);
      }
    }
  })

  let testThread = new Thread({
    participants: [testUser._id, testUser2._id],
    chatType: "Chat",
    // campaignId,
    name: ""
  });

  await new Promise((res, rej)=>{
    testThread.save((err) => {
      if (err) rej("Could not save");
      else res();
    })
  })

  // await new Promise((res, rej) => {
  //   let br = await befriendRequest(testUser._id, testThread._id, "hello friend");
  //   console.log(br);
  //   if (br === null) res();
  //   else rej(br);
  // }).catch((e) => {console.log(e)});

  let br = await befriendRequest(testUser._id, testThread._id, "hello friend");
  console.log(br);
  return;

  // mongoose.connection.close();
}


const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error: "))
db.once('open', async function() {
  console.log("Connected to mongo");
  controls.test();
  await runTest();
  db.close();
})