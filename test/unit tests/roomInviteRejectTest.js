// passes test

var dotenv = require('dotenv');
var mongoose = require('mongoose');
const util = require('util');
const User = require('../../models/User.js');
const Thread = require('../../models/Thread.js');
const Message = require('../../models/Message.js');
const Campaign = require('../../models/Campaign.js');

const controls = require('../../models/Controls.js')

const deepPrint = (obj) => {
  console.log(util.inspect(obj, {
    showHidden: false,
    depth: null,
    colors: true
  }))
}

// Assign necessary imports here
let {newUser, newThread, ROOM, CHAT, roomInvite, roomInviteReject} = controls;

dotenv.config({
  path: '../../.env'
})


// test method
runTest = async() => {
  
  // Clear database
  await Promise.all([
    User.deleteMany({}), 
    Thread.deleteMany({}),
    Message.deleteMany({}),
    Campaign.deleteMany({})
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

  let testUser3 = await newUser({
    name: "Test3",
    email: "test3@test.com",
    password: "1234",
    confirmed: true,
  });

  let testThread = await newThread({
    participants: [testUser, testUser2],
    chatType: CHAT
  })

  let testRoomThread = await newThread({
    participants: [testUser],
    chatType: ROOM
  })

  // this should work
  let roomInvitation = await roomInvite({
    sender: testUser._id,
    directRecipient: testUser2._id,
    text: "Join me in this room",
    threads: [testThread._id, testRoomThread._id]
  });

  // this should fail
  console.log(await roomInvite({
    sender: testUser._id,
    directRecipient: testUser2._id,
    text: "Join me in this room",
    threads: [testThread._id, testRoomThread._id]
  }));

  // console.log(await roomInviteReject({
  //   sender: testUser2._id,
  //   directRecipient: testUser._id,
  //   origMessageId: roomInvitation._id,
  //   text: "No thanks",
  //   threads: [testThread._id, testRoomThread._id],
  // }));

  // [testRoomThread, roomInvitation] = await Promise.all([
  //   Thread.findById(testRoomThread._id).exec(),
  //   Message.findById(roomInvitation._id).exec()
  // ]);

  // console.log("participants", testRoomThread.participants);
  // console.log("roomInvitation", roomInvitation);

  deepPrint(await roomInviteReject({
    sender: testUser2._id,
    directRecipient: testUser._id,
    origMessageId: roomInvitation._id,
    text: "No thanks",
    threads: [testThread._id, testRoomThread._id],
  }, true))

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



