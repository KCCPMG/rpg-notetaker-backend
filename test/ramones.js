const mongoose = require('mongoose');
const fs = require('fs');

const User = require('../models/User');
const Campaign = require('../models/Campaign');

const Message = mongoose.model('Message', new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  thread: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  campaign: {
    type: mongoose.Types.ObjectId,
    required: false
  },
  sendTime: {
    type: Date,
    required: true,
    default: new Date()
  },
  messageType: {
    // required: true,
    type: String,
    enum: ['BEFRIEND_REQUEST', 'BEFRIEND_ACCEPT', 'BEFRIEND_REJECT', 'END_FRIENDSHIP', 'TEXT_ONLY', 'CAMPAIGN_INVITE', 'CAMPAIGN_INVITE_ACCEPT', 'CAMPAIGN_INVITE_REJECT', 'EXIT_CAMPAIGN', 'REMOVE_FROM_CAMPAIGN'],
    default: 'TEXT_ONLY'
  },
  text: {
    type: String,
    required: false
  }  
}))




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

User.befriendRequest = (new_friend) => {

  let message = new Message({
    sender: User._id,
    message_type: 'BEFRIEND_REQUEST'
  })

  Promise.all([User.save(), new_friend.save()]).then((values) => {
    console.log('successful friend request')
  })
  .catch((err) => {
    console.log(err);
  })
}

let handle = fs.openSync('ramones test output.txt', 'w');

fs.appendFileSync(handle, 'Johnny sends a befriend_request to Tommy  \n');
Johnny.befriendRequest(Tommy);
fs.appendFileSync(handle, JSON.stringify(Johnny));
fs.appendFileSync(handle, JSON.stringify(Tommy));

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

