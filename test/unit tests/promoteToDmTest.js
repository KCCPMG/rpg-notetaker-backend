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
let {newUser, newCampaign, newThread, campaignInvite, campaignInviteAccept, CHAT, promoteToDm} = controls;

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

  // let campaignThread = await Thread.findById(campaign.threadId).exec();

  let invite = await campaignInvite({
    sender: testUser._id,
    directRecipient: testUser2._id,
    campaignId: campaign._id,
    threadIds: [testThread._id, campaign.threadId],
    text: "Please join my campaign. It is an elaborate excuse to come up with fantastical bullshit while allowing me to pretend that I have friends."
  });

  let accept = await campaignInviteAccept({
    sender: testUser2._id,
    directRecipient: testUser._id,
    origMessage: invite._id,
    campaignId: campaign._id,
    threadIds: [testThread._id, campaign.threadId],
    text: "All right, sounds fun"
  })


  let campaignThread;
  [campaign, campaignThread] = await Promise.all([
    Campaign.findById(campaign._id).exec(),
    Thread.findById(campaign.threadId)
  ]);

  // let promotion = await promoteToDm({
  //   sender: testUser._id,
  //   directRecipient: testUser2._id,
  //   campaignId: campaign._id,
  //   threadIds: [campaign.threadId, testThread._id],
  //   text: "I hereby dub thee co-king of the thing"
  // });

  // [campaign, campaignThread, testUser2] = await Promise.all([
  //   Campaign.findById(campaign._id).exec(),
  //   Thread.findById(campaignThread._id).exec(),
  //   User.findById(testUser2._id).exec()
  // ]);

  // console.log({promotion}, {campaign}, {campaignThread}, {testUser2});
  
  deepPrint(await promoteToDm({
    sender: testUser._id,
    directRecipient: testUser2._id,
    campaignId: campaign._id,
    threadIds: [campaign.threadId, testThread._id],
    text: "I hereby dub thee co-king of the thing"
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
    console.log("something wrong");
    console.log(e);
    db.close();
  }
})



