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
let {newUser, newCampaign, newThread, campaignInvite, CHAT} = controls;

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

  let testThread = await newThread({
    participants: [testUser, testUser2],
    chatType: CHAT
  })


  let campaign = await newCampaign({
    name: "Shithawks",
    createdBy: testUser._id,
    description: "A descent into madness and grape soda",
    dm: [testUser._id],
    game: "Dungeons & Dragons, Fifth Edition",
    invitedPlayers: [],
  });

  

  // let invite = await campaignInvite({
  //   sender: testUser._id,
  //   directRecipient: testUser2._id,
  //   campaignId: campaign._id,
  //   threadIds: [testThread._id, campaign.threadId] 
  // });

  let campaignThread = await Thread.findById(campaign.threadId).exec();

  // campaign = await Campaign.findById(campaign._id).exec();

  deepPrint(await campaignInvite({
    sender: testUser._id,
    directRecipient: testUser2._id,
    campaignId: campaign._id,
    threadIds: [testThread._id, campaign.threadId] 
  }, true));

  // console.log({testUser}, {testUser2}, {testThread}, {campaign}, {campaignThread});

  // console.log(invite);

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
db.on('disconnected', () => {console.log("closed")});
db.once('open', async function() {
  console.log("Connected to mongo");
  try {
    // Run test
    await runTest();
    console.log("ok should be done");
    db.close();
  } catch(e) {
    console.log("something wrong");
    console.log(e);
    db.close();
  }
})



