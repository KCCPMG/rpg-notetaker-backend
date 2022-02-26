var dotenv = require('dotenv');
var mongoose = require('mongoose');
const fs = require('fs');
var assert = require('chai').assert;

const controls = require('../models/Controls.js')
let {User, Thread, Message, befriendRequest, befriendAccept, getMessages} = controls;

// .env setup
dotenv.config({
  path: './.env'
})

// DB Config
// const dbstring = process.env.MongoTestURI;

// const dbstring = "mongodb://RolePlayingBaseTest.localhost:27017";

const dbstring = "mongodb://localhost:27017/RolePlayingBaseTest?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false"


// Connect to Mongo
mongoose.connect(dbstring, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error: "))
db.once('open', async function() {
  console.log("Connected to mongo");
  try {
    await runTest();
  } catch(e) {
    console.log(e);
    db.close();
  }
  db.close();
})



const runTest = async () => {

  // cleanUp
  await Promise.all([
    User.deleteMany({}), 
    Thread.deleteMany({}),
    Message.deleteMany({})
  ])
  console.log("Finished Delete");


  // get started, see what we have
  let users;
  let threads;
  let messages;

  await Promise.all([
    User.find({}),
    Thread.find({}),
    Message.find({})
  ]).then(docs => {
    users = docs[0];
    threads = docs[1];
    messages = docs[2];
  })
  .catch((e) => {
    console.log(e);
  })

  // console.log({users}, {threads}, {messages});

  // create Joey, Johnny, Tommy, DeeDee, Richie, Marky
  var Joey = new User({
    name: "Joey",
    email: "joey@ramones.com",
    password: "1234",
    confirmed: true,
  })

  var Johnny = new User({
    name: "Johnny",
    email: "johnny@ramones.com",
    password: "1234",
    confirmed: true
  })

  var Tommy = new User({
    name: "Tommy",
    email: "tommy@ramones.com",
    password: "1234",
    confirmed: true
  })

  var DeeDee = new User({
    name: "DeeDee",
    email: "deedee@ramones.com",
    password: "1234",
    confirmed: true
  })

  var Richie = new User({
    name: "Richie",
    email: "richie@ramones.com",
    password: "1234",
    confirmed: true
  })

  var Marky = new User({
    name: "Marky",
    email: "marky@ramones.com",
    password: "1234",
    confirmed: true
  })

  await Promise.all([
    Joey.save(),
    Johnny.save(),
    Tommy.save(),
    DeeDee.save(),
    Richie.save(),
    Marky.save()
  ])


  let length;

  let u = await User.find({});
  length = u.length;

  // console.log({length});

  // console.log(assert.equal(length, 6, "length of found users should equal 6"));
  
  
  // assert.equal(async () => {
  //   let length = await User.find({}).length;
  //   console.log({length})
  //   return length
  // }, 6, "test message - should succeed")


  // console.log(assert.equal(async () => {
  //   let length = await User.find({}).length;
  //   console.log({length})
  //   return length
  // }, 6, "test message - should succeed"))

  // console.log(assert.equal(async () => {
  //   return await User.find({}).length
  // }, 5, "test message - should fail"))

  
  
  // open file
  let handle = fs.openSync('./ramones test output.txt', 'w');


  // create new thread for Johnny and Tommy
  let johnnyAndTommyThread = await controls.newThread([Johnny._id, Tommy._id], "Chat", null, null);
  let johnnyAndTommyThreadId = johnnyAndTommyThread._id
  console.log("threadId", johnnyAndTommyThreadId);


  fs.appendFileSync(handle, 'Johnny sends a befriend_request to Tommy \n');
  // befriendRequest
  await befriendRequest(Johnny._id, johnnyAndTommyThreadId, "Hey Tommy");
  // fs.appendFileSync(handle, JSON.stringify(Johnny));
  // fs.appendFileSync(handle, JSON.stringify(Tommy));


  let TommysMessages = await getMessages(Tommy._id)
  console.log({TommysMessages});

  let johnnyToTommyBefriendRequestId = TommysMessages.find((message)=> {
    return message.type === "BEFRIEND_REQUEST";
  })[0]._id

  console.log(johnnyToTommyBefriendRequestId);


  fs.appendFileSync(handle, 'Tommy accepts the befriend_request of Johnny  \n');
  await befriendAccept(Tommy._id, johnnyAndTommyThreadId, johnnyToTommyBefriendReqeustId, "You got it, friend!");

  fs.appendFileSync(handle, 'Johnny creates the campaign Tangerine Puppets  \n');
  fs.appendFileSync(handle, 'Joey creates the campaign Sniper  \n');
  fs.appendFileSync(handle, 'Johnny exits the campaign Tangerine Puppets  \n');
  fs.appendFileSync(handle, 'Tommy exits the campaign Tangerine Puppets  \n');
  fs.appendFileSync(handle, 'DeeDee sends a befriend_request to Johnny  \n');
  fs.appendFileSync(handle, 'DeeDee sends a befriend_request to Tommy  \n');
  fs.appendFileSync(handle, 'Tommy accepts the befriend_request of DeeDee  \n');
  fs.appendFileSync(handle, 'Johnny accepts the befriend_request of DeeDee  \n');
  fs.appendFileSync(handle, 'Johnny forms campaign Ramones  \n');
  fs.appendFileSync(handle, 'Johnny invites DeeDee to campaign Ramones\n');
  fs.appendFileSync(handle, 'DeeDee accepts the campaign_invitation to Ramones  \n');
  fs.appendFileSync(handle, 'Johnny invites Richie to campaign Ramones\n');
  fs.appendFileSync(handle, 'Richie declines the campaign_invitation to Ramones  \n');
  fs.appendFileSync(handle, 'Johnny invites Joey to campaign Ramones\n');
  fs.appendFileSync(handle, 'Joey exits the campaign Sniper  \n');
  fs.appendFileSync(handle, 'Joey accepts the campaign_invitation to Ramones  \n');
  fs.appendFileSync(handle, 'Johnny invites Tommy to campaign Ramones\n');
  fs.appendFileSync(handle, 'Tommy accepts the campaign_invitation to Ramones  \n');
  fs.appendFileSync(handle, 'Tommy sends a befriend_request to Joey  \n');
  fs.appendFileSync(handle, 'Joey accepts the befriend_request of Tommy  \n');
  fs.appendFileSync(handle, 'Tommy exits the campaign Ramones  \n');
  fs.appendFileSync(handle, 'Marky joins the campaign Ramones  \n');
  fs.appendFileSync(handle, 'Marky sends a befriend_request to Joey  \n');
  fs.appendFileSync(handle, 'Marky sends a befriend_request to Johnny  \n');
  fs.appendFileSync(handle, 'Marky sends a befriend_request to DeeDee  \n');
  fs.appendFileSync(handle, 'Joey accepts the befriend_request of Marky  \n');
  fs.appendFileSync(handle, 'Johnny accepts the befriend_request of Marky  \n');
  fs.appendFileSync(handle, 'DeeDee accepts the befriend_request of Marky  \n');


  fs.closeSync(handle);
  console.log("closed file");

}



// const Message = mongoose.model('Message', new mongoose.Schema({
//   sender: {
//     type: mongoose.Types.ObjectId,
//     required: true
//   },
//   thread: {
//     type: mongoose.Types.ObjectId,
//     required: true
//   },
//   campaign: {
//     type: mongoose.Types.ObjectId,
//     required: false
//   },
//   sendTime: {
//     type: Date,
//     required: true,
//     default: new Date()
//   },
//   messageType: {
//     // required: true,
//     type: String,
//     enum: ['BEFRIEND_REQUEST', 'BEFRIEND_ACCEPT', 'BEFRIEND_REJECT', 'END_FRIENDSHIP', 'TEXT_ONLY', 'CAMPAIGN_INVITE', 'CAMPAIGN_INVITE_ACCEPT', 'CAMPAIGN_INVITE_REJECT', 'EXIT_CAMPAIGN', 'REMOVE_FROM_CAMPAIGN'],
//     default: 'TEXT_ONLY'
//   },
//   text: {
//     type: String,
//     required: false
//   }  
// }))




// console.log(User);
// console.log(Campaign);

// let testMessage = new Message({
//   sender: 'a4fd1431ae51',
//   thread: 'b1',
//   campaign: null,
//   messageType: 'TEXT_ONLY',
//   text: "sample message"
// });

// console.log(testMessage);

// User.befriendRequest = (new_friend) => {

//   let message = new Message({
//     sender: User._id,
//     message_type: 'BEFRIEND_REQUEST'
//   })

//   Promise.all([User.save(), new_friend.save()]).then((values) => {
//     console.log('successful friend request')
//   })
//   .catch((err) => {
//     console.log(err);
//   })
// }


/* 
let handle = fs.openSync('ramones test output.txt', 'w');

fs.appendFileSync(handle, 'Johnny sends a befriend_request to Tommy  \n');
// Johnny.befriendRequest(Tommy);
// fs.appendFileSync(handle, JSON.stringify(Johnny));
// fs.appendFileSync(handle, JSON.stringify(Tommy));

fs.appendFileSync(handle, 'Tommy accepts the befriend_request of Johnny  \n');
// befriendAccept(Tommy, Johnny);

fs.appendFileSync(handle, 'Johnny creates the campaign Tangerine Puppets  \n');
fs.appendFileSync(handle, 'Joey creates the campaign Sniper  \n');
fs.appendFileSync(handle, 'Johnny exits the campaign Tangerine Puppets  \n');
fs.appendFileSync(handle, 'Tommy exits the campaign Tangerine Puppets  \n');
fs.appendFileSync(handle, 'DeeDee sends a befriend_request to Johnny  \n');
fs.appendFileSync(handle, 'DeeDee sends a befriend_request to Tommy  \n');
fs.appendFileSync(handle, 'Tommy accepts the befriend_request of DeeDee  \n');
fs.appendFileSync(handle, 'Johnny accepts the befriend_request of DeeDee  \n');
fs.appendFileSync(handle, 'Johnny forms campaign Ramones  \n');
fs.appendFileSync(handle, 'Johnny invites DeeDee to campaign Ramones\n');
fs.appendFileSync(handle, 'DeeDee accepts the campaign_invitation to Ramones  \n');
fs.appendFileSync(handle, 'Johnny invites Richie to campaign Ramones\n');
fs.appendFileSync(handle, 'Richie declines the campaign_invitation to Ramones  \n');
fs.appendFileSync(handle, 'Johnny invites Joey to campaign Ramones\n');
fs.appendFileSync(handle, 'Joey exits the campaign Sniper  \n');
fs.appendFileSync(handle, 'Joey accepts the campaign_invitation to Ramones  \n');
fs.appendFileSync(handle, 'Johnny invites Tommy to campaign Ramones\n');
fs.appendFileSync(handle, 'Tommy accepts the campaign_invitation to Ramones  \n');
fs.appendFileSync(handle, 'Tommy sends a befriend_request to Joey  \n');
fs.appendFileSync(handle, 'Joey accepts the befriend_request of Tommy  \n');
fs.appendFileSync(handle, 'Tommy exits the campaign Ramones  \n');
fs.appendFileSync(handle, 'Marky joins the campaign Ramones  \n');
fs.appendFileSync(handle, 'Marky sends a befriend_request to Joey  \n');
fs.appendFileSync(handle, 'Marky sends a befriend_request to Johnny  \n');
fs.appendFileSync(handle, 'Marky sends a befriend_request to DeeDee  \n');
fs.appendFileSync(handle, 'Joey accepts the befriend_request of Marky  \n');
fs.appendFileSync(handle, 'Johnny accepts the befriend_request of Marky  \n');
fs.appendFileSync(handle, 'DeeDee accepts the befriend_request of Marky  \n');


fs.closeSync(handle);
*/

