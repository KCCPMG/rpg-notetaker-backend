var dotenv = require('dotenv');
var mongoose = require('mongoose');
const util = require('util');
const User = require('../../models/User.js');
const Thread = require('../../models/Thread.js');
const Message = require('../../models/Message.js');
const Campaign = require('../../models/Campaign.js');
const Handout = require('../../models/Handout.js');
const fs = require('fs');

const controls = require('../../models/Controls.js');

const deepPrint = (obj) => {
  console.log(util.inspect(obj, {
    showHidden: false,
    depth: null,
    colors: true
  }))
}

// Assign necessary imports here
let {newUser, newCampaign, newHandout} = controls;

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

  console.log(campaign);

  let bufImage = Buffer.from(fs.readFileSync('../test files/Sex Panther.jpg'));

  // let handout = await newHandout({
  //   createdBy: testUser._id,
  //   campaignId: campaign._id,
  //   handoutTitle: "Test image",
  //   image: bufImage,

  // })

  // console.log(handout);

  // console.log({image: handout.image});
  // console.log(handout.image instanceof Buffer);
  // console.log(handout.image.length);

  // let buffedImage = Buffer.alloc(handout.image.length)

  // console.log(buffedImage);

  // buffedImage.set(handout.image);

  // console.log(buffedImage);

  let handout = await newHandout({
    createdBy: testUser._id,
    campaignId: campaign._id,
    handoutTitle: "Test image",
    image: bufImage,

  }, true)

  deepPrint(handout);

  let buffedImage = Buffer.alloc(handout.response.image.length);

  buffedImage.set(handout.response.image);

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



