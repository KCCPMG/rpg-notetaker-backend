// passes test

var dotenv = require('dotenv');
var mongoose = require('mongoose');
const util = require('util');
const User = require('../../models/User.js');
const Thread = require('../../models/Thread.js');
const Message = require('../../models/Message.js');
const Campaign = require('../../models/Campaign.js');

const controls = require('../../models/Controls.js');

const deepPrint = (obj) => {
  console.log(util.inspect(obj, {
    showHidden: false,
    depth: null,
    colors: true
  }))
}


// Assign necessary imports here
let {newUser, newCampaign} = controls;

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
 
  // campaign = await newCampaign({
  //   name: "Shithawks",
  //   createdBy: testUser._id,
  //   description: "A descent into madness and grape soda",
  //   dm: [testUser._id],
  //   game: "Dungeons & Dragons, Fifth Edition",
  //   invitedPlayers: [],
  // }),

  // testUser = await User.findById(testUser._id).exec();

  // console.log({testUser}, {campaign})

  deepPrint(await newCampaign({
    name: "Shithawks",
    createdBy: testUser._id,
    description: "A descent into madness and grape soda",
    dm: [testUser._id],
    game: "Dungeons & Dragons, Fifth Edition",
    invitedPlayers: [],
  }, true));

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



