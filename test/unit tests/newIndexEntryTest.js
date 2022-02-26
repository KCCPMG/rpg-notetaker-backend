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
let {newUser, newCampaign, newThread, newIndexEntry, campaignInvite, campaignInviteAccept, CHAT} = controls;

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


  let invite = await campaignInvite({
    sender: testUser._id,
    directRecipient: testUser2._id,
    campaignId: campaign._id,
    threadIds: [testThread._id, campaign.threadId],
    text: "Please join my campaign. It is an elaborate excuse to come up with fantastical bullshit while allowing me to pretend that I have friends."
  });



  await campaignInviteAccept({
    sender: testUser2._id,
    directRecipient: testUser._id,
    origMessage: invite._id,
    campaignId: campaign._id,
    threadIds: [testThread._id, campaign.threadId],
    text: "All right, sounds fun"
  }, true);

  
  deepPrint(await newIndexEntry({
    createdBy: testUser._id,
    campaignId: campaign._id,
    term: "The Dude",
    alternateTerms: ["His Dudeness", "Duder", "El Duderino"],
    tags: ["Protagonist", "Detective", "Stoner"],
    text: "Jeffrey Lebowski, age unknown. Unemployed, former roadie for Metallica and member of the Seattle 7 with six other guys",
    category: "Character"
  }, true));

  console.log(await newIndexEntry({
    createdBy: testUser._id,
    campaignId: campaign._id,
    term: "Walter Sobcheck",
    alternateTerms: ["Walter", "WALTER", "JUST AN ASSHOLE"],
    tags: ["Sidekick", "Vietnam Vet", "Jewish"],
    text: "Walter is divorced, but still watches his ex-wife's dg and he also remains Jewish. Walter served in Vietnam, which was real combat. Eyeball to eyeball.",
    category: "Character"
  }))

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



