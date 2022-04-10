const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Message = require('../models/Message'); 
const Controls = require('../models/Controls');
const {issueToken, checkToken} = require('../config/authentication');
const { handleReturnObj } = require('./utilities');
var router = express.Router();

const BEFRIEND_REQUEST = 'BEFRIEND_REQUEST'; 
const BEFRIEND_ACCEPT = 'BEFRIEND_ACCEPT'; 
const BEFRIEND_REJECT = 'BEFRIEND_REJECT'; 
const END_FRIENDSHIP = 'END_FRIENDSHIP'; 
const TEXT_ONLY = 'TEXT_ONLY'; 
const CAMPAIGN_INVITE = 'CAMPAIGN_INVITE'; 
const CAMPAIGN_INVITE_ACCEPT = 'CAMPAIGN_INVITE_ACCEPT'; 
const CAMPAIGN_INVITE_REJECT = 'CAMPAIGN_INVITE_REJECT'; 
const EXIT_CAMPAIGN = 'EXIT_CAMPAIGN'; 
const REMOVE_FROM_CAMPAIGN = 'REMOVE_FROM_CAMPAIGN';

var EMITTER;

// Mongoose saves wrapped in Promises
const userSave = ((userDoc) => {
  return new Promise((res, rej) => {
    userDoc.save((err) =>  {
      if (err) rej("Error on userSave")
      else res();
    })
  })
})

const campaignSave = ((campaignDoc) => {
  return new Promise((res, rej) => {
    campaignDoc.save((err) => {
      if (err) rej("Error on campaignSave");
      else res();
    })
  })
})

const messageSave = (message) => {
  return new Promise((res, rej) => {
    message.save((err) => {
      if (err) rej("Failure on messageSave");
      else res();
    })
  })
}

const notifyUsers = (eventEmitter, recipients) => {
  return new Promise((res, rej) => {
    for (let recp of recipients) {
      eventEmitter.emit(`${user._id}`, )
    }
  })
}


router.use(checkToken);

// gets all messages sent and received
// router.get('/', (req, res) => {
//   Message.find({$or:
//     [
//       {"sender": req.user.id},
//       {"recipient": req.user.id},
//     ]
//   }, (err, messages) => {
//     if (err) {
//       console.log(err);
//       res.send("Something went wrong");
//     } else {
//       res.send({messages: messages})
//     }
//   })
// })

// gets all messages sent and received
router.get('/', async (req, res) => {
  try {
    let messages = await Message.find({$or: [
      {"sender": req.user.id},
      {"recipient": req.user.id}
    ]});
    res.send(messages);
  } catch(e) {
    console.log(e);
    res.send('Something went wrong');
  }
})

// router.post('/new', (req, res) => {

//   console.log(req.body);
//   let message = new Message(req.body.message);
//   console.log(message);
//   if (req.user.id !== String(message.sender)) {
//     console.log(req.user.id);
//     console.log(message.sender);
//     res.send("Not Authorized");
//   } else {
//     validateMessage(req, message)
//     .then(()=>{messageSave(message)})
//     .then((success) => {res.send("Message saved")})
//     .catch((err) => {
//       console.log(err);
//       res.send(err)
//     })


//     // User.findById(message.recipient, (err, recipient) => {
//     //   if (err) {
//     //     res.send("Something went wrong");
//     //   } else if (!recipient) {
//     //     res.send("Recipient not found")
//     //   } else {
//     //     message.save((err) => {
//     //       if (err) {
//     //         res.send("Something went wrong")
//     //       } else {
//     //         res.send("Message saved");
//     //       }
//     //     })
//     //   }
//     // }) 
//   }
// })


router.post('/new', checkToken, async(req, res) => {
  try {

    console.log(`\nFrom messages.js - router.post('/new')\nreq.body.message: ${JSON.stringify(req.body.message)}\n`)
    
    if (String(req.user._id) !== req.body.message.sender) {
      console.log(`\nFrom router.post('/new') \nreq.user._id: ${String(req.user._id)} ${typeof(String(req.user._id))}\nreq.body.message.sender: ${req.body.message.sender} ${typeof((req.body.message.sender))}\n`)
      throw new Error("Invalid message: Message sender is not user who sent request");
    } 

    let returnObj;
    switch (req.body.message.messageType){
      case BEFRIEND_REQUEST:
        console.log("Befriend Request");
        returnObj = await Controls.befriendRequest(req.body.message, true);
        break;
      case BEFRIEND_ACCEPT: 
        console.log("Befriend Accept");
        // console.log(req.body.message.threadIds);
        returnObj = await Controls.befriendAccept(req.body.message, true);
        // console.log({returnObj});
        break;
      case BEFRIEND_REJECT:
        console.log("Befriend Reject");
        returnObj = await Controls.befriendReject(req.body.message, true);
        break;
      case END_FRIENDSHIP:
        console.log("End Friendship");
        returnObj = await Controls.endFriendship(req.body.message, true);
        console.log("returnObj\n", returnObj);
        break;
    }

    // handle retObj
    // (emitter) => {
    //   res.send(returnObj.response);
    //   for (let id of Object.keys(returnObj.ntfObj)) {
    //     emitter.emit(id, returnObj.ntfObj[id]);
    //   }
    // }(EMITTER);
    
    handleReturnObj(res, EMITTER, returnObj);

  } catch(e) {
    console.error(e);
    res.send("Something went wrong, please try again later")
  }
})



validateMessage = async(req) => {
  try {
    console.log(`From routes/messages.js - validateMessage, req.user._id: ${req.user._id}`);

    // make sure sender is req.user._id

    // make sure recipient is real

    // if there's a last message, find last message, make sure that it exists, and that it does not already have a response

    // if there's a campaign, find campaign, make sure it exists

    // 

  } catch(e) {
    throw e;
  }

}


router.post('/newThread', checkToken, async (req, res) => {
  console.log(`\nFrom routes/messages.js - router.post('/newThread'), EventEmitter:\n`, EMITTER);

  try {
    console.log(`\nFrom routes/messages.js - router.post('/newThread')\nRequest user id: ${req.user._id}\nRequest body: ${JSON.stringify(req.body)}`);
    

    if (!req.body.threadObj.participants.includes(String(req.user._id))) {
      console.log(req.body.thread.participants);
      console.log(req.user._id);
      throw("User not included in thread");
    }
    let thread = await Controls.newThread(req.body.threadObj, false);
    res.send(thread);

  } catch(e) {
    console.log(e);
    res.send("Something went wrong, please try again later")
  }
})


// needs to make sure message is valid AND handle campaign/relationship editing
validateMessage = (req, message) => {

  console.log("validate message");
  console.log(req.user);

  let checkSender = new Promise((res, rej) => {
    // user already found and passed through, validate sender synchronously
    console.log("\ncheckSender")
    console.log(String(req.user._id), String(message.sender))


    if (String(req.user._id) !== String(message.sender)) {
      console.log("\nFailed Sender test")
      
      console.log("\n");
      rej();
    }
    else {
      console.log("\nPassed senderTest")
      res();
    }
  })

  let findRecipient = new Promise((res, rej) => {
    User.findById(message.recipient, (err, recp) => {
      if (err) rej(err);
      else if (!recp) rej("recipient not found");
      else {
        console.log(recp);
        console.log(recp._id);
        res(recp);
      }
    })
  })

  let findOriginalMessage = new Promise((res, rej) => {
    if (message.lastMessage === null) res(null);
    else {
      Message.findById(message.lastMessage, (err, origMessage) => {
        if (err) rej(err);
        else if (!origMessage) rej("original message not found")
        else res(origMessage);
      })
    }
  })

  let findCampaign = new Promise((res, rej) => {
    if (message.campaign === undefined) res(null);
    else {
      Campaign.findById(message.campaign, (err, campaign) => {
        if (err) rej(err);
        else if (!campaign) rej("campaign not found");
        else res(campaign);
      })
    }
  })

  

  // the sender, recipient, original message, and/or campaign will all be needed before anything else can be done
  // for each case of messageType, make necessary checks, handle necessary editing
  return Promise.all([checkSender, findRecipient, findOriginalMessage, findCampaign])
  .then((values) => {
    console.log("\n");
    console.log(checkSender);
    console.log("\n")
    let [validSender, recipient, origMessage, campaign] = values;

    console.log("Then arguments:");
    console.log({validSender}) 
    console.log({recipient}) 
    console.log({origMessage})
    console.log({campaign});

    // validSender is undefined on success, so this seems unnecessary and wrong. A failure triggers rej and catch, so this is an incorrect way of being redundant
    // if (!validSender) return new Promise((res, rej) => {rej("Invalid Sender")});


    switch (message.messageType) {
      case BEFRIEND_REQUEST: 
        return new Promise((res, rej) => {
          if (req.user.friends.includes(recipient._id) || recipient.friends.includes(req.user.id)) rej("Users are already friends");
          res();
        })
      case BEFRIEND_ACCEPT:
        return new Promise((res, rej) => {
          if (req.user.friends.includes(recipient._id) || recipient.friends.includes(req.user.id)) rej("Users are already friends");
          if (origMessage.messageType !== BEFRIEND_REQUEST) rej("Acceptance not in response to befriend request")
          
          // add users to each others friends, make this message the reply to the parent message, save
          req.user.friends.push(recipient._id);
          recipient.push(req.user.id);
          origMessage.response = message._id;

          Promise.all([userSave(req.user), userSave(recipient), messageSave(origMessage)])
          .then(res)
          .catch(err => {rej(err)})
          
        })
      case BEFRIEND_REJECT: 
        return new Promise((res, rej) => {
          if (req.user.friends.includes(recipient._id) || recipient.friends.includes(req.user.id)) rej("Users are already friends");
          if (origMessage.messageType !== BEFRIEND_REQUEST) rej("Denial not in response to befriend request")
          
          // make this message the reply to the parent message, save
          origMessage.response = message._id;

          messageSave(origMessage)
          .then(res)
          .catch((err) => {rej(err)})

        });
      case END_FRIENDSHIP: 
        return new Promise((res, rej) => {
          if (!req.user.friends.includes(recipient._id) || !recipient.friends.includes(req.user.id)) rej("Users are not already friends");

          // delete users from each others friends, save
          req.user.friends = req.user.friends.filter(friend => friend!=recipient._id);
          recipient.friends = recipient.friends.filter(friend => friend!=req.user.id);
          
          Promise.all([userSave(req.user), userSave(recipient)])
          .then(res)
          .catch(err => {rej(err)})

        })
      case TEXT_ONLY: 
        return new Promise((res, rej) => {
          res();
        });
      case CAMPAIGN_INVITE: 
        return new Promise((res, rej) => {
          // campaign must exist
          if (!campaign) rej("Campaign does not exist");
          // req.user.id must be in campaign.dms
          if (!campaign.dms.includes(req.user.id)) rej("You do not have permission to invite players");
          // recipient must not already be in campaign
          if (campaign.players.includes(recipient._id)) rej("This player is already in the game");
          res();
        })
      case CAMPAIGN_INVITE_ACCEPT: 
        return new Promise((res, rej) => {
          // verify original message is campaign invite
          if (origMessage.type !== CAMPAIGN_INVITE) rej("Acceptance not in response to campaign invite")
          // req.user.id must not already be in campaign
          if (campaign.players.includes(req.user.id)) rej("User already member of campaign");
          
          // add player to campaign, add campaign to player, make this message the reply to the parent message,save
          req.user.campaigns.push(campaign._id);
          campaign.players.push(req.user.id)
          origMessage.response = message._id;

          Promise.all([campaignSave(campaign), userSave(req.user), messageSave(origMessage)])
          .then(res)
          .catch(err => {rej(err)})

        });
      case CAMPAIGN_INVITE_REJECT: 
        return new Promise((res, rej) => {
          // verify original message is campaign invite
          if (origMessage.type !== CAMPAIGN_INVITE) rej("Acceptance not in response to campaign invite")
          // req.user.id must not already be in campaign
          if (campaign.players.includes(req.user.id)) rej("User already member of campaign");

          // make this message the reply to the parent message, save
          origMessage.response = message._id;

          messageSave(origMessage)
          .then(res)
          .catch((err) => {rej(err)});
        });
      case EXIT_CAMPAIGN: 
        return new Promise((res, rej) => {
          // user must be in campaign
          if (!campaign.players.includes(req.user.id)) rej("User not a member of this campaign");

          // remove campaign from player.campaigns, remove player from campaign.players and campaign.dms

          campaign.players = campaign.players.filter(p => p!=req.user.id);
          campaign.dms = campaign.dms.filter(p => p!=req.user.id);
          req.user.campaigns = req.user.campaigns.filter(c => c!=campaign._id);

          Promise.all(campaignSave(campaign), userSave(req.user))
          .then(res)
          .catch(err => {rej(err)})
        });
      case REMOVE_FROM_CAMPAIGN:
        return new Promise((res, rej) => {
          // user must be dm
          if (!campaign.dms.includes(req.user.id)) rej("Not authorized to remove player");
          // recipient must be in campaign
          if (!campaign.players.includes(recipient._id)) rej("Recipient not a member of this campaign");
          // remove campaign from player.campaigns, remove player from campaign.players and campaign.dms

          campaign.players = campaign.players.filter(p => p!=recipient._id);
          campaign.dms = campaign.dms.filter(p => p!=recipient._id);
          recipient.campaigns = recipient.campaigns.filter(c => c!=campaign._id);

          Promise.all(campaignSave(campaign), userSave(recipient))
          .then(res)
          .catch(err => {rej(err)})
        });
      default:
        return new Promise((res, rej) => {
          rej("Invalid message type")
        });
    }
  })
  // .catch((err) => {rej(err)})

}


// take a message, check validity, perform saves and notifications, return a promise
// validateMessage = (req, message) => {

//   // message must be from sender
//   let senderCheck = new Promise((res, rej)=>{
//     if (req.user.id === String(message.sender)) res();
//     else rej();
//   })

  
//   // if this message is a response
//   let responseCheck = new Promise((res, rej)=>{
//     if ([BEFRIEND_ACCEPT, BEFRIEND_REJECT, CAMPAIGN_INVITE_ACCEPT, CAMPAIGN_INVITE_REJECT].includes(message.messageType)) {
//       Message.findById(message.lastMessage, (err, origMessage) => {
//         if (err) {
//           console.log(err);
//           rej("error searching for original message");
//         } else if (!origMessage) {
//           console.log("original message not found");
//           rej("original message not found");
//         } else {
//           // messageType must fit original message
          
//           if ((message.messageType === BEFRIEND_ACCEPT || message.messageType === BEFRIEND_REJECT) && origMessage !== BEFRIEND_REQUEST) rej("");

//           if ((message.messageType === CAMPAIGN_INVITE_ACCEPT || message.messageType === CAMPAIGN_INVITE_REJECT) && origMessage !== CAMPAIGN_INVITE) rej();

//           // recipient must be sender of original message
//           if (message.recipient !== origMessage.sender) rej();

//           res();
//         }
//       })
      
//     } else res();
//   })
    
//   // if the message is any type of friend message, sender and recipient must not already be friends
//   let relationshipCheck = new Promise((res, rej) => {
//     if (message.messageType)
//   })
  
//   // if the message is any time of campaign message, campaign membership
//   let campaignCheck = new Promise((res, rej) => {

//   })


//   // Finally
//   return new Promise((res, rej) => {
//     Promise.all([senderCheck, responseCheck, relationshipCheck, campaignCheck])
//     .then((origMessage)=>{
//       // save message(s)
//       // notify users
//       res();
//     })
//     .catch(rej);
//   })
// }

initRouter = (eEmit) => {
  EMITTER = eEmit;
  return router;
}


// module.exports = router;
module.exports = initRouter;


// alternate version
var altRouter = express.Router();
altRouter.use(checkToken);


const initMessagesRouter = (eEmit) => {

  console.log("initiating messages router");
  
  altRouter.get('/', (req, res) => {
    console.log("\n\n\ngetting messages\n\n\n");
    Message.find({$or:
      [
        {"sender": req.user.id},
        {"recipient": req.user.id},
      ]
    }, (err, messages) => {
      if (err) {
        console.log(err);
        res.send("Something went wrong");
      } else {
        res.send({messages: messages})
      }
    })
  })

  altRouter.post('/new', (req, res) => {
    console.log(req.body);
    let message = new Message(req.body.message);
    console.log(message);
    if (req.user.id !== String(message.sender)) {
      console.log(req.user.id);
      console.log(message.sender);
      res.send("Not Authorized");
    } else {
      validateMessage(req, message)
      .then(()=>{messageSave(message)})
      .then((success) => {res.send("Message saved")})
      .catch((err) => {
        console.log(err);
        res.send(err)
      })
    }
  })

  altRouter.post('/newThread', checkToken, (req, res) => {
    try {
      console.log("wakka wakka wakka");
      res.send("wakka wakka wakka");
    } catch(e) {
      console.log(e);
      res.send("Sorry, something went wrong");
    }
  })

  // console.log(altRouter);
  return altRouter;
}

// module.exports = initMessagesRouter;