var dotenv = require('dotenv');
var mongoose = require('mongoose');
const util = require('util');
const User = require('../../models/User.js');
const Thread = require('../../models/Thread.js');
const Message = require('../../models/Message.js');
const Campaign = require('../../models/Campaign.js');
const Handout = require('../../models/Handout.js');
const fs = require('fs');

const controls = require('../../models/Controls.js')

const deepPrint = (obj) => {
  console.log(util.inspect(obj, {
    showHidden: false,
    depth: null,
    colors: true
  }))
}


// Assign necessary imports here
let {campaignInvite, campaignInviteAccept, CHAT, newUser, newCampaign, newHandout, newThread, editHandout} = controls;

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

  let campaign = await newCampaign({
    name: "Shithawks",
    createdBy: testUser._id,
    description: "A descent into madness and grape soda",
    dm: [testUser._id],
    game: "Dungeons & Dragons, Fifth Edition",
    invitedPlayers: [],
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


  let bufImage = Buffer.from(fs.readFileSync('../test files/Sex Panther.jpg'));

  let handout = await newHandout({
    createdBy: testUser._id,
    campaignId: campaign._id,
    handoutTitle: "Test image",
    image: bufImage,

  })

  // console.log(handout);

  // let editedHandout = await editHandout({
  //   id: handout._id,
  //   campaignId: handout.campaignId,
  //   editedBy: testUser2._id,
  //   handoutTitle: "Edited Title",
  //   description: "Here's the new description",
  //   notes: [
  //     {
  //       position: {
  //         x: 5,
  //         y: 20
  //       },
  //       text: "This is a note",
  //     }, 
  //     {
  //       position: {
  //         x: 5,
  //         y: 25
  //       },
  //       text: "This is another note",
  //     }
  //   ]
  // })

  // let buffedImage = Buffer.alloc(editedHandout.image.length)
  // buffedImage.set(editedHandout.image);

  // fs.writeFileSync('../test files/Sex Panther Copy 2.jpg', buffedImage);

  let editedHandout = await editHandout({
    id: handout._id,
    campaignId: handout.campaignId,
    editedBy: testUser2._id,
    handoutTitle: "Edited Title",
    description: "Here's the new description",
    notes: [
      {
        position: {
          x: 5,
          y: 20
        },
        text: "This is a note",
      }, 
      {
        position: {
          x: 5,
          y: 25
        },
        text: "This is another note",
      }
    ]
  }, true);

  deepPrint(editedHandout);

  let buffedImage = Buffer.alloc(editedHandout.response.image.length)

  console.log(editedHandout.response.image);
  console.log(editedHandout.response.image.length);

  buffedImage.set(editedHandout.response.image);

  fs.writeFileSync('../test files/Sex Panther Copy 2.jpg', buffedImage);

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



