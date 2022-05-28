const Campaign = require('./Campaign.js');
const Character = require('./Character.js');
const Message = require('./Message.js');
const Thread = require('./Thread.js');
const User = require('./User.js');
const Handout = require('./Handout.js');
const JournalEntry = require('./JournalEntry.js');
const IndexEntry = require('./IndexEntry.js');

// message types
module.exports.BEFRIEND_REQUEST = 'BEFRIEND_REQUEST'; 
module.exports.BEFRIEND_ACCEPT = 'BEFRIEND_ACCEPT'; 
module.exports.BEFRIEND_REJECT = 'BEFRIEND_REJECT'; 
module.exports.CAMPAIGN_INVITE = 'CAMPAIGN_INVITE'; 
module.exports.CAMPAIGN_INVITE_ACCEPT = 'CAMPAIGN_INVITE_ACCEPT'; 
module.exports.CAMPAIGN_INVITE_REJECT = 'CAMPAIGN_INVITE_REJECT'; 
module.exports.END_FRIENDSHIP = 'END_FRIENDSHIP'; 
module.exports.EXIT_CAMPAIGN = 'EXIT_CAMPAIGN'; 
module.exports.PROMOTE_TO_DM = 'PROMOTE_TO_DM';
module.exports.REMOVE_FROM_CAMPAIGN = 'REMOVE_FROM_CAMPAIGN';
module.exports.ROOM_INVITE = "ROOM_INVITE";
module.exports.ROOM_INVITE_ACCEPT = "ROOM_INVITE_ACCEPT";
module.exports.ROOM_INVITE_REJECT = "ROOM_INVITE_REJECT";
module.exports.STEP_DOWN_DM = 'STEP_DOWN_DM';
module.exports.TEXT_ONLY = 'TEXT_ONLY'; 

// chat types
module.exports.CHAT = "CHAT"
module.exports.ROOM = "ROOM"
module.exports.CAMPAIGN = "CAMPAIGN"

// Mongoose saves wrapped in Promises
const campaignSave = ((campaignDoc) => {
  return new Promise((res, rej) => {
    campaignDoc.save((err) => {
      if (err) rej("Error on campaignSave");
      else res();
    })
  })
})

const characterSave = (character) => {
  return new Promise((res, rej) => {
    character.save((err) => {
      if (err) rej("Failure on characterSave");
      else res();
    })
  })
}

const messageSave = (message) => {
  return new Promise((res, rej) => {
    message.save((err) => {
      if (err) rej("Failure on messageSave");
      else res();
    })
  })
}

const threadSave = (thread) => {
  return new Promise((res, rej) => {
    thread.save((err) => {
      if (err) rej("Failure on threadSave");
      else res();
    })
  })
}

const userSave = ((userDoc) => {
  return new Promise((res, rej) => {
    userDoc.save((err) =>  {
      if (err) rej("Error on userSave")
      else res();
    })
  })
})


// private helper method 

// ntfObj argument is expected to be an empty object that is already part of the return object, essentially just an address to be populated with data
// format is {userId: doc, userId: doc}

const ntfObjAssign = (ntfObj, userIds, doc) => {
  
  try { 
    // if user not in ntfObj, create key
    for (let userId of userIds) {
      if (!ntfObj[userId]) ntfObj[userId] = {};
    }
    console.log("empty users for ntfObj:", ntfObj)

    if (doc.constructor.modelName === "Message") {
      console.log("\nadding message to ntfObj")
      for (let userId of userIds) {
        if (!ntfObj[userId].messages) ntfObj[userId].messages = [];
        ntfObj[userId].messages.push(doc);
      }
      return ntfObj;
    } 
    // make user doc safe by removing password
    else if (doc.constructor.modelName === "User") {
      console.log("\nadding user to ntfObj")
      let safeUser = (new User(doc).set("password", null));

      for (let userId of userIds) {
        ntfObj[userId]["user"] = safeUser;
      }
      
      return ntfObj;
    } 
    else {
      let doctype = doc.constructor.modelName;
      let subkey = doctype.charAt(0).toLowerCase() + doctype.slice(1);
      
      for (let userId of userIds) {
        ntfObj[userId][subkey] = doc;
      }

      return ntfObj;
    }
  } catch(e) {
    throw(e);
  }
  
}

module.exports.newUser = async (userObj) => {
  try {
    let user = new User(userObj);
    let savedUser = await user.save();
    return savedUser;
  } catch(e) {
    return e;
  }
}



// module.exports.getMessages = async (fromUserId) => {
//   // Thread.find({participants: fromUserId}, (err, threads) => {
//   //   if (err) {
//   //     console.log(err);
//   //     return (err);
//   //   } else if (!threads) {
//   //     return [];
//   //   } else {
//   //     let promises = threads.map(t => {
//   //       return new Promise((res, rej) => {
//   //         Message.findById(thread._id, (err, messages) => {
//   //           if (err) {
//   //             rej(err);
//   //           } else {
//   //             res(messages);
//   //           }
//   //         })
//   //       })
//   //     })
//   //     Promise.all[promises]
//   //     .then((mes) => {
//   //       return mes;
//   //     })
//   //     .catch(err => {
//   //       console.log(err);
//   //       return null;
//   //     })
//   //   }
//   // });

//   let threads = await new Promise((res, rej) => {
//     Thread.find({participants: fromUserId}, (err, threads) => {
//       if (err) rej(err);
//       else if (!threads) {
//         rej("No threads");
//       } else res(threads);
//     })
//   });

//   threads

// }

module.exports.befriendRequest = async (befriendRequestObj, ntfObjBool) => {

  try {
    // confirm thread exists, thread is of type "Chat"
    let foundThread = await Thread.findById(befriendRequestObj.threadIds[0]).exec();
    if (!foundThread) {
      throw ("Thread not found");
    }
    if (befriendRequestObj.threadIds.length > 1) {
      throw("This message should only be sent in one thread");
    }
    if (foundThread.chatType != module.exports.CHAT) {
      throw("Thread is not of type chat");
    }
    let message = new Message(Object.assign(befriendRequestObj, {
      threadIds: befriendRequestObj.threadIds,
      messageType: module.exports.BEFRIEND_REQUEST,
      readBy: [befriendRequestObj.sender]
    }))
    let savedMessage = await message.save();

    if (ntfObjBool) {
      let returnObj = {
        response: savedMessage,
        ntfObj: {}
      };
    
      // 
      ntfObjAssign(returnObj.ntfObj, foundThread.participants, message);

      return returnObj;


    } else return savedMessage;
  } catch(e) {
    return e;
  }
}


// module.exports.befriendRequest = async (fromUserId, threadId, text) => {

//   let fromUser;
//   let toUser;
//   let thread;
  
//   // confirm thread exists, thread is of type "Chat"
//   await new Promise((res, rej) => {
//     Thread.findById(threadId, (err, foundThread)=> {
//       if (err) rej("Error finding thread");
//       else if (!foundThread) rej("Cannot find thread");
//       else {
//         if (foundThread.chatType !== "Chat") rej("Invalid thread for befriendRequest");
//         else {
//           thread = foundThread;
//           res();
//         }
//       } 
//     })
//   }).catch((e) => {
//     console.log(e);
//     return e;
//   });

//   console.log({thread});
  
//   // let friendCheck = (thread) => {
//   //   return new Promise((res, rej) => {
//   //     let fromUser = User.findById(fromUserId)
//   //   })
//   // }

//   let toUserId = thread.participants.filter(el => el !== fromUserId)[0]

  

//   await Promise.all([
//     // once thread is checked, get users, make sure they are not already friends
//     new Promise((res, rej) => {
//       User.findById(fromUserId, (err, user) => {
//         if (err) rej(err);
//         else if (!user) rej("fromUser not found");
//         else {
//           fromUser = user;
//           if (fromUser.friends.includes(toUserId)) rej("toUser already in fromUser.friends");
//           else res();
//         }
//       })
//     }),
//     new Promise((res, rej) => {
//       User.findById(toUserId, (err, user) => {
//         if (err) rej(err);
//         else if (!user) rej("toUser not found");
//         else {
//           toUser = user;
//           if (toUser.friends.includes(fromUserId)) rej("fromUser already in toUser.friends");
//           else res();
//         }
//       })
//     }),
//     // confirm that there are no pending friend requests in this thread with a response of null or throw error
//     new Promise((res, rej) => {
//       Message.find({thread: threadId}, (err, messages) =>{
//         if (err) rej(err);
//         else {
//           for (let m of messages) {
//             if (m.type === BEFRIEND_REQUEST && m.response === null) {
//               rej("There is already a pending friend request");
//             }
//           }
//           res();
//         }
//       })
//     })
//   ]).catch((e) => {
//     console.log(e);
//     return e;
//   });

//   console.log({fromUser, toUser})

//   // create new message 
//   /*
//   * sender: fromUser
//     * directRecipient: null
//     * campaignId: null
//     * threadIds: [threadId]
//     * sendTime: new Date()
//     * messageType: BEFRIEND_REQUEST
//     * text: text
//     * response: null
//    */
  
//   let message = new Message({
//     sender: fromUserId,
//     directRecipient: null,
//     campaignId: null,
//     threadIds: [threadId],
//     sendTime: new Date(),
//     messageType: BEFRIEND_REQUEST,
//     text: text,
//     response: null,
//     readBy: [fromUserId]
//   })

  
//   // save message
//   await new Promise((res, rej) => {
//     message.save((err) => {
//       console.log('saved?')
//       if (err) {
//         rej(err);}
//       else res();
//     })
//   }).catch((e) => {
//     console.log(e);
//     return e;
//   });

//   console.log('done');
//   // return
//   return;


//   // Promise.resolve(threadCheck).then().catch()
// }


module.exports.befriendAccept = async(befriendAcceptObj, ntfObjBool) => {
  try {

    // find origMessage, origThread
    let [origMessage, origThread] = await Promise.all([
      Message.findById(befriendAcceptObj.origMessage),
      Thread.findById(befriendAcceptObj.threadIds[0]),
    ])

    // find befriendRequester, befriendAccepter
    let [befriendRequester, befriendAccepter] = await Promise.all([
      User.findById(origMessage.sender).exec(),
      User.findById(befriendAcceptObj.sender).exec()
    ])

    // confirm origMessage.threadId is threadId
    if (String(befriendAcceptObj.threadIds[0]) !== String(origMessage.threadIds[0])) {
      console.log(befriendAcceptObj.threadIds[0]);
      console.log(origMessage.threadIds[0]);
      console.log(typeof(befriendAcceptObj.threadId));
      console.log(typeof(origMessage.threadIds[0]));
      throw ("Invalid thread");
    }

    // make sure origMessage only has one threadId
    if (origMessage.threadIds.length > 1) {
      throw ("origMessage has more than one thread")
    }

    // make sure befriendAcceptObj has only one threadId
    if (befriendAcceptObj.threadIds.length > 1) {
      throw ("This message should only be in one thread")
    }

    // confirm no origMessage.response
    if (!(origMessage.response.$isEmpty())) {
      console.log(origMessage.response == null);
      console.log(origMessage.response == undefined);
      console.log(origMessage.response.$isEmpty());

      throw ("Original Message already has a response")
    }

    // confirm befriendRequester and befriendAccepter not already friends
    if (befriendRequester.friends.includes(befriendAccepter._id)) {
      throw ("befriendAccepter is already in befriendRequester's friends")
    }
    if (befriendAccepter.friends.includes(befriendRequester._id)) {
      throw("befriendRequester is already in befriendAccepter's friends")
    }


    let acceptMessage = new Message({
      sender: befriendAcceptObj.sender,
      origMessage: befriendAcceptObj.origMessage,
      messageType: module.exports.BEFRIEND_ACCEPT,
      threadIds: befriendAcceptObj.threadIds,
      text: befriendAcceptObj.text,
      readBy: [befriendAcceptObj.sender]
    })

    // establish friend connections
    befriendRequester.friends.push(befriendAccepter._id);
    befriendAccepter.friends.push(befriendRequester._id);

    // assign response to origMessage.response
    origMessage.response = {
      messageId: acceptMessage._id,
      messageType: module.exports.BEFRIEND_ACCEPT
    }

    // save friends and messages
    await Promise.all([
      origMessage.save(),
      acceptMessage.save(),
      befriendRequester.save(),
      befriendAccepter.save()
    ])


    // return new message
    if (ntfObjBool) {
      let returnObj = {
        response: acceptMessage,
        
        ntfObj: {}
      };
    
      

      // acceptMessage, befriendRequester, befriendAccepter
      ntfObjAssign(returnObj.ntfObj, origThread.participants, acceptMessage);
      ntfObjAssign(returnObj.ntfObj, [befriendRequester._id], befriendRequester);
      ntfObjAssign(returnObj.ntfObj, [befriendAccepter._id], befriendAccepter);


      // let safeBefriendRequester = (new User(befriendRequester).set('password', null));
      // let safeBefriendAccepter = (new User(befriendAccepter).set('password', null));;
      // ntfObjAssign(returnObj.ntfObj, [befriendRequester._id], safeBefriendRequester);
      // ntfObjAssign(returnObj.ntfObj, [befriendAccepter._id], safeBefriendAccepter);

      // console.log("\nFrom Controls.js - befriendAccept, returnObj:", returnObj, "\n");

      

      return returnObj;


    } else return acceptMessage;

  } catch(e) {
    return e;
  }
}


// module.exports.befriendAccept = async (fromUserId, threadId, origMessageId, text) => {
  
//   let origMessage;
//   let toUserId;
//   let toUser;
//   let fromUser;
  
//   // get originalMessage
//   await new Promise ((res, rej) => {
//     Message.findById(origMessageId, (err, message) => {
//       if (err) rej(err);
//       else if (!message) rej("Original message not found");
//       else {
//         origMessage = message;
//         res();
//       }
//     })
//   }).catch((e) => {return e});


//   // get toUserId
//   await new Promise((res, rej) => {
//     Thread.findById(threadId, (err, foundThread) => {
//       if (err) rej(err);
//       else if (!foundThread) rej("Thread not found");
//       else {
//         thread = foundThread;
//         res();
//       }
//     })
//   }).catch((e) => {return e});

//   toUserId = thread.participants.filter(p => p !== fromUserId)[0];



//   // get fromUser and toUser
//   await Promise.all([
//     new Promise((res, rej) => {
//       User.findById(toUserId, (err, user) => {
//         if (err) rej(err);
//         if (!user) rej("toUser not found");
//         else {
//           toUser = user;
//           res();
//         }
//       })
//     }),
//     new Promise((res, rej) => {
//       User.findById(fromUserId, (err, user) => {
//         if (err) rej(err);
//         else if (!user) rej("fromUser not found");
//         else {
//           fromUser = user;
//           res();
//         }
//       })
//     })
//   ]).catch((e) => {return e});

//   if (origMessage.threadId !== threadId) return("Original message thread mismatch");
//   if (origMessage.response) return("Original message already has a response");

//   let message = new Message({
//     sender: fromUserId,
//     directRecipient: none,
//     campaignId: null,
//     threadIds: [threadId],
//     sendTime: new Date(),
//     messageType: BEFRIEND_ACCEPT,
//     text: text,
//     response: null,
//     readBy: [fromUserId]
//   })

//   fromUser.friends.push(toUserId);
//   toUser.friends.push(fromUserId);
//   origMessage.response = {
//     messageId: message._id,
//     messageType: BEFRIEND_ACCEPT
//   }

//   Promise.all([
//     new Promise((res, rej) => {
//       message.save((err) => {
//         if (err) rej(err);
//         else res();
//       })
//     }),
//     new Promise((res, rej) => {
//       origMessage.save((err) => {
//         if (err) rej(err);
//         else res();
//       })
//     }),
//     new Promise((res, rej) => {
//       fromUser.save((err) => {
//         if (err) rej(err);
//         else res();
//       })
//     }),
//     new Promise((res, rej) => {
//       toUser.save((err) => {
//         if (err) rej(err);
//         else res();
//       })
//     })
//   ])

//   return;

// }


module.exports.befriendReject = async(befriendRejectObj, ntfObjBool) => {

  try {

    // find origMessage
    let origMessage = await Message.findById(befriendRejectObj.origMessage).exec();

    // find befriendRequester, befriendRejector
    let [befriendRequester, befriendRejector] = await Promise.all([
      User.findById(origMessage.sender).exec(),
      User.findById(befriendRejectObj.sender).exec()
    ])


    // confirm that origMessage.threadId has the same threadId as this message
    if (String(origMessage.threadIds[0]) !== String(befriendRejectObj.threadIds[0])) {
      throw ("Invalid Thread");
    }

    // confirm that origMessage has only one threadId
    if (origMessage.threadIds.length > 1) {
      throw ("This message should only be in one thread");
    }

    // confirm that befriendRejectObj has only one threadId
    if (befriendRejectObj.threadIds.length > 1) {
      throw ("origMessage has more than one thread");
    }

    // confirm no origMessage.response
    if (!origMessage.response.$isEmpty()) {
      throw ("Original Message already has a response");
    }

    // confirm befriendRejector and befriendRequester not already friends
    if (befriendRequester.friends.includes(befriendRejector._id)) {
      throw ("befriendRejector is already in befriendRequester's friends")
    }
    if (befriendRejector.friends.includes(befriendRequester._id)) {
      throw("befriendRequester is already in befriendRejector's friends")
    }

    // create rejectMessage
    let rejectMessage = new Message({
      sender: befriendRejectObj.sender,
      threadIds: befriendRejectObj.threadIds,
      messageType: module.exports.BEFRIEND_REJECT,
      text: befriendRejectObj.text,
      readBy: [befriendRejectObj.sender]
    })


    // assign rejectMessage to origMessage.response
    origMessage.response = {
      messageId: rejectMessage._id,
      messageType: module.exports.BEFRIEND_REJECT
    }

    // save origMessage and rejectMessage
    await Promise.all([
      origMessage.save(),
      rejectMessage.save()
    ])


    // return new message
    if (ntfObjBool) {
      let returnObj = {
        response: rejectMessage,
        ntfObj: {}
      };

      // origMessage, rejectMessage
      ntfObjAssign(returnObj.ntfObj, [origMessage.sender, befriendRejectObj.sender], origMessage);
      ntfObjAssign(returnObj.ntfObj, [origMessage.sender, befriendRejectObj.sender], rejectMessage);

      
      return returnObj;
    } else return rejectMessage;

  } catch (e) {
    return e;
  }

  

}


// module.exports.newThread = async(participants, chatType, campaignId, name) => {
//   let retValue = null;
  
//   let thread = new Thread({
//     participants: participants,
//     chatType: chatType
//   })
//   console.log(thread);
  
//   if (campaignId && chatType === "Campaign") thread.campaignId = campaignId;
  
//   if (name && chatType === "Room") thread.name = name;
  
//   return new Promise((res, rej) => {
//     thread.save((err) => {
//       if (err) rej(err);
//       else res(thread);
//     })
//   });


//   // await thread.save((err) => {
//   //   console.log("Error:", err);
//   //   if (err) return err;
//   //   else return thread;
//   // })

// }

module.exports.campaignInvite = async (campaignInviteObj, ntfObjBool) => {
  try {

    let {sender, directRecipient, campaignId, threadIds, text} = campaignInviteObj;

    let [campaign, firstChatThread, secondChatThread] = await Promise.all([
      Campaign.findById(campaignId).exec(),
      Thread.findById(threadIds[0]).exec(),
      Thread.findById(threadIds[1]).exec(),
    ]);

    let chatThread, campaignThread;

    // find chatThread and campaignThread, throw error if both not included
    if (firstChatThread.chatType === module.exports.CHAT) {
      if (secondChatThread.chatType !== module.exports.CAMPAIGN) {
        throw ("Campaign thread must be included in campaign invite")
      } else {
        chatThread = firstChatThread;
        campaignThread = secondChatThread;
      }

    } else if (secondChatThread.chatType === module.exports.CHAT) {
      if (firstChatThread.chatType !== module.exports.CAMPAIGN) {
        throw ("Campaign thread must be included in campaign invite")
      } else {
        chatThread = secondChatThread;
        campaignThread = firstChatThread;
      }

    } else {
      throw ("Chat thread must be included in campaign invite");
    }

    // confirm recipient not already a player
    if (campaign.players.includes(directRecipient)) {
      throw ("Invited player is already a player in this game");
    }

    // confirm recipient not already a dm
    if (campaign.dm.includes(directRecipient)) {
      throw ("Invited player is already a player in this game");
    }

    // confirm recipient not already invitedPlayer
    if (campaign.invitedPlayers.includes(directRecipient)) {
      throw ("Invited player already has a pending invitation");
    }

    // add recipient to campaign invitedPlayers
    campaign.invitedPlayers.push(directRecipient);

    let newMessage = new Message({
      sender,
      directRecipient,
      campaignId,
      threadIds,
      text,
      messageType: module.exports.CAMPAIGN_INVITE,
      readBy: [sender]
    }); 

    await Promise.all([
      newMessage.save(),
      campaign.save()
    ])

    if (ntfObjBool) {
      let returnObj = {
        response: newMessage,
        ntfObj: {}
      };

      // newMessage, campaign
      ntfObjAssign(returnObj.ntfObj, [].concat(campaignThread.participants, [directRecipient]), newMessage);
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.players, campaign.dm), campaign)

      
      return returnObj;
    } else return newMessage;

  } catch(e) {
    console.log(e);
    return e;
  }
}


module.exports.campaignInviteAccept = async (cpnInvAcptObj, ntfObjBool) => {
  try {

    let {sender, directRecipient, origMessage, campaignId, threadIds, text} = cpnInvAcptObj

    let [campaign, originalMessage, firstThread, secondThread, user] = await Promise.all([
      Campaign.findById(campaignId).exec(),
      Message.findById(origMessage).exec(),
      Thread.findById(threadIds[0]).exec(),
      Thread.findById(threadIds[1]).exec(),
      User.findById(sender).exec()
    ])

    // Determine which thread is the campaignThread
    let campaignThread;
    if (firstThread.chatType === module.exports.CAMPAIGN) {
      campaignThread = firstThread;
    } else if (secondThread.chatType === module.exports.CAMPAIGN) {
      campaignThread = secondThread;
    } else {
      throw ("Campaign thread not included in messages")
    }

    // Determine which thread is the chatThread
    let chatThread;
    if (firstThread.chatType === module.exports.CHAT) {
      chatThread = firstThread;
    } else if (secondthread.chatType === module.exports.CHAT) {
      chatThread = secondThread;
    } else {
      throw ("Chat thread not included in messages")
    }

    // Determine validity of chatThread
    if (chatThread.participants.length !== 2) {
      throw ("Chat thread has invalid number of participants");
    }

    if (String(chatThread.participants[0]) === String(sender)) {
      if (String(chatThread.particpants[1]) !== String(directRecipient)) {
        throw ("Chat thread does not include both participants")
      }
    } else if (String(chatThread.participants[1]) === String(sender)) {
      if (String(chatThread.participants[0]) !== String(directRecipient)) {
        throw ("Chat thread does not include both participants")
      }
    } else {
      throw ("Chat thread does not include both participants")
    }


    // run necessary checks
    // origMessage has no response
    if (!originalMessage.response.$isEmpty()) {
      throw ("Invitation already has a response");
    }

    // sender is an invited player in campaign
    if (!campaign.invitedPlayers.includes(sender)) {
      throw ("Player invitation not registered with campaign");
    }

    // sender is not a current player in campaign
    if (campaign.players.includes(sender)) {
      throw ("Player is already a player in campaign");
    }

    // sender is not a current dm in campaign
    if (campaign.dm.includes(sender)) {
      throw ("Player is already a dm in campaign");
    }


    // create response message
    let cpnInvAcptMsg = new Message({
      sender,
      directRecipient,
      campaignId,
      threadIds,
      text,
      messageType: module.exports.CAMPAIGN_INVITE_ACCEPT,
      readBy: [sender],
    })

    // assign response message to original message response
    originalMessage.response = {
      messageId: cpnInvAcptMsg._id,
      messageType: module.exports.CAMPAIGN_INVITE_ACCEPT
    };

    // add sender to campaign thread participants
    campaignThread.participants.push(sender);

    // remove sender from invited players
    campaign.invitedPlayers = campaign.invitedPlayers.filter(p => String(p)!==String(sender));

    // add sender to players
    campaign.players.push(sender);

    // add campaign to user
    user.campaigns.push(campaign._id);

    await Promise.all([
      cpnInvAcptMsg.save(),
      campaign.save(),
      campaignThread.save(),
      originalMessage.save(),
      user.save()
    ])

    if (ntfObjBool) {
      let returnObj = {
        response: cpnInvAcptMsg,
        ntfObj: {}
      };

      // campaign, campaignThread, originalMessage, cpnInvAcptMsg, user
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.dm, campaign.players), campaign);
      ntfObjAssign(returnObj.ntfObj, campaignThread.participants, campaignThread);
      ntfObjAssign(returnObj.ntfObj, campaignThread.participants, originalMessage);
      ntfObjAssign(returnObj.ntfObj, campaignThread.participants, cpnInvAcptMsg);
      ntfObjAssign(returnObj.ntfObj, [user._id], user);
      
      return returnObj;
    } else return cpnInvAcptMsg;

  } catch(e) {
    return e;
  }
}


module.exports.campaignInviteReject = async (cpnInvRejObj, ntfObjBool) => {
  try {
    let {sender, directRecipient, origMessage, campaignId, threadIds, text} = cpnInvRejObj;

    let [campaign, originalMessage, firstThread, secondThread] = await Promise.all([
      Campaign.findById(campaignId).exec(),
      Message.findById(origMessage).exec(),
      Thread.findById(threadIds[0]).exec(),
      Thread.findById(threadIds[1]).exec()
    ])

    // Determine which thread is the campaignThread
    let campaignThread;
    if (firstThread.chatType === module.exports.CAMPAIGN) {
      campaignThread = firstThread;
    } else if (secondThread.chatType === module.exports.CAMPAIGN) {
      campaignThread = secondThread;
    } else {
      throw ("Campaign thread not included in messages")
    }

    // Determine which thread is the chatThread
    let chatThread;
    if (firstThread.chatType === module.exports.CHAT) {
      chatThread = firstThread;
    } else if (secondthread.chatType === module.exports.CHAT) {
      chatThread = secondThread;
    } else {
      throw ("Chat thread not included in messages")
    }

    // Determine validity of chatThread
    if (chatThread.participants.length !== 2) {
      throw ("Chat thread has invalid number of participants");
    }

    if (String(chatThread.participants[0]) === String(sender)) {
      if (String(chatThread.particpants[1]) !== String(directRecipient)) {
        console.log(1, chatThread.participants, sender, directRecipient);
        throw ("Chat thread does not include both recipient")
      }
    } else if (String(chatThread.participants[1]) === String(sender)) {
      if (String(chatThread.participants[0]) !== String(directRecipient)) {
        console.log(2, chatThread.participants, sender, directRecipient);
        throw ("Chat thread does not include recipient")
      }
    } else {
      console.log(3, chatThread.participants, sender, directRecipient);
      throw ("Chat thread does not include both sender")
    }


    // run necessary checks
    // origMessage has no response
    if (!originalMessage.response.$isEmpty()) {
      throw ("Invitation already has a response");
    }

    // sender is an invited player in campaign
    if (!campaign.invitedPlayers.includes(sender)) {
      throw ("Player invitation not registered with campaign");
    }

    // sender is not a current player in campaign
    if (campaign.players.includes(sender)) {
      throw ("Player is already a player in campaign");
    }

    // sender is not a current dm in campaign
    if (campaign.dm.includes(sender)) {
      throw ("Player is already a dm in campaign");
    }


    // create response message
    let cpnInvRejMsg = new Message({
      sender,
      directRecipient,
      campaignId,
      threadIds,
      text,
      messageType: module.exports.CAMPAIGN_INVITE_REJECT,
      readBy: [sender],
    })

    // assign response message to original message response
    originalMessage.response = {
      messageId: cpnInvRejMsg._id,
      messageType: module.exports.CAMPAIGN_INVITE_REJECT
    };

    // remove sender from invited players
    campaign.invitedPlayers = campaign.invitedPlayers.filter(p => String(p)!==String(sender));

    await Promise.all([
      cpnInvRejMsg.save(),
      campaign.save(),
      originalMessage.save()
    ])

    if (ntfObjBool) {
      let returnObj = {
        response: cpnInvRejMsg,
        ntfObj: {}
      };

      // originalMessage, cpnInvRejMsg, campaign
      ntfObjAssign(returnObj.ntfObj, [].concat(campaignThread.participants, sender), originalMessage);
      ntfObjAssign(returnObj.ntfObj, [].concat(campaignThread.participants, sender), cpnInvRejMsg);
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.players, campaign.dm), campaign)


      return returnObj;
    } else return cpnInvRejMsg;

  } catch(e) {
    return e;
  }
}


module.exports.editHandout = async (handoutObj, ntfObjBool) => {
  try {
    let {id, campaignId, editedBy, handoutTitle, image, description, notes} = handoutObj;

    let [handout, campaign] = await Promise.all([
      Handout.findById(id).exec(),
      Campaign.findById(handoutObj.campaignId).exec()
    ]);

    console.log(handout);

    // confirm handoutObj campaignId matches handout campaignId
    if (String(handoutObj.campaignId) !== String(handout.campaignId)) {
      throw ("Campaign Id does not match original handout campaign Id");
    }

    // make sure editedBy is in campaign players or campaign dm
    if (!campaign.dm.includes(editedBy) && !campaign.players.includes(editedBy)) {
      throw ("Editor does not have permission to edit this handout");
    }

    handout = Object.assign(handout, handoutObj);
    handout.editedOn = new Date();

    await handout.save();

    if (ntfObjBool) {
      let returnObj = {
        response: handout,
        ntfObj: {}
      };

      // handout
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.players, campaign.dm), handout);
      
      return returnObj;
    } else return handout;

  } catch(e) {
    return e;
  }

}


module.exports.editIndexEntry = async (iEntryObj, ntfObjBool) => {
  try {
    let {id, lastEditedBy, campaignId, term, alternateTerms, associatedTerms, tags, text, category} = iEntryObj;

    
    let [campaign, indexEntry] = await Promise.all([
      Campaign.findById(campaignId).exec(),
      IndexEntry.findById(id).exec()
    ])

    if (!(campaign.players.includes(lastEditedBy) || campaign.dm.includes(lastEditedBy))) {
      throw ("User does not have permission to edit this index entry")
    }

    indexEntry.lastEditedBy = lastEditedBy;
    indexEntry.lastEditedDate = new Date();

    if (term) indexEntry.term = term;
    if (alternateTerms) {
      indexEntry.alternateTerms = alternateTerms.map(at => {
        return {
          term: at,
          idHandle: id
        }
      });
    }
    if (associatedTerms) indexEntry.associatedTerms = associatedTerms;
    if (tags) indexEntry.tags = tags;
    if (text) indexEntry.text = text;
    if (category) indexEntry.category = category; 

    await indexEntry.save();

    if (ntfObjBool) {
      let returnObj = {
        response: indexEntry,
        ntfObj: {}
      };

      // indexEntry
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.players, campaign.dm), indexEntry);

      return returnObj;

    } else return indexEntry

  } catch(e) {
    return e;
  }

}


module.exports.editJournalEntry = async (jEntryObj, ntfObjBool) => {
  try {
    let {id, campaignId, lastEditedBy, title, text} = jEntryObj;

    let [jEntry, campaign] = await Promise.all([
      JournalEntry.findById(id).exec(),
      Campaign.findById(campaignId).exec()
    ])
    
    if (!(campaign.players.includes(lastEditedBy) || campaign.dm.includes(lastEditedBy))) {
      throw ("User is not authorized to edit this journal entry");
    }

    jEntry.lastEditedBy = lastEditedBy;
    jEntry.lastEditedDate = new Date();
    if (title) jEntry.title = title;
    if (text) jEntry.text = text;
    

    await jEntry.save();

    if (ntfObjBool) {
      let returnObj = {
        response: jEntry,
        ntfObj: {}
      }

      // jEntry
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.dm, campaign.players), jEntry);

      return returnObj;
    } else return jEntry;
  } catch(e) {
    return e;
  }
}


module.exports.endFriendship = async(endFriendshipObj, ntfObjBool) => {
  try {

    // find thread
    let thread = await Thread.findById(endFriendshipObj.threadIds[0]).exec();

    // confirm thread is type "CHAT"
    if (thread.chatType !== module.exports.CHAT) {
      throw ("Message belongs in thread of type \"CHAT\"");
    }


    // get unfriended, defriender
    let [unfriended, defriender] = await Promise.all([
      User.findById(thread.participants.filter(u => String(u)!==String(endFriendshipObj.sender))[0]).exec(),
      User.findById(endFriendshipObj.sender).exec(),
    ])

    // create new message
    let endMessage = new Message({
      sender: endFriendshipObj.sender,
      threadIds: endFriendshipObj.threadIds,
      text: endFriendshipObj.text,
      messageType: module.exports.END_FRIENDSHIP,
      readBy: [endFriendshipObj.sender]
    })

    // filter out friends
    defriender.friends = defriender.friends.filter(fId => String(fId)!==String(unfriended._id));

    unfriended.friends = unfriended.friends.filter(fId => String(fId)!==String(defriender._id));

    // save unfriended, defriender, endMessage
    await Promise.all([
      unfriended.save(),
      defriender.save(),
      endMessage.save(),
    ]).catch((e) => { throw(e) }); 

    // return endMessage
    if (ntfObjBool) {
      let returnObj = {
        response: endMessage,
        ntfObj: {}
      };

      // endMessage, unfriended, defriender
      ntfObjAssign(returnObj.ntfObj, [unfriended._id, defriender._id], endMessage);
      ntfObjAssign(returnObj.ntfObj, [unfriended._id], unfriended);
      ntfObjAssign(returnObj.ntfObj, [defriender._id], defriender);
      
      return returnObj;
    } else return endMessage;

  } catch(e) {
    return e;
  }

}


module.exports.exitCampaign = async(exitCampaignObj, ntfObjBool) => {
  try {

    let {sender, campaignId, threads, text} = exitCampaignObj;
    
    let [campaign, campaignThread, quitter] = await Promise.all([
      Campaign.findById(campaignId).exec(),
      Thread.findById(threads[0]).exec(),
      User.findById(sender).exec()
    ])

    // confirm that sender is in campaign.players
    if (!campaign.players.includes(sender)) {
      throw ("Exiting player is not a player in the campaign")
    }

    let quitMessage = new Message({
      sender,
      campaignId,
      threads,
      text,
      messageType: module.exports.EXIT_CAMPAIGN,
      readBy: [sender]
    })

    // remove campaign from quitter
    quitter.campaigns = quitter.campaigns.filter(c => String(c) !== String(campaignId))

    // remove quitter from campaign
    campaign.players = campaign.players.filter(p => String(p) !== String(sender))

    // remove quitter from campaignThread participants
    campaignThread.participants = campaignThread.participants.filter(p => String(p) !== String(sender))

    // save all
    await Promise.all([
      campaign.save(),
      campaignThread.save(),
      quitter.save(),
      quitMessage.save()
    ])

    if (ntfObjBool) {
      let returnObj = {
        response: quitMessage,
        ntfObj: {}
      };

      // campaign, campaignThread, quitter, quitMessage
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.players, campaign.dm), campaign);
      ntfObjAssign(returnObj.ntfObj, campaignThread.participants, campaignThread);
      ntfObjAssign(returnObj.ntfObj, [quitter._id], quitter);
      ntfObjAssign(returnObj.ntfObj, [].concat(campaignThread.participants, [quitter._id]), quitMessage)
      
      return returnObj;
    } else return quitMessage;

  } catch (e) {
    return e;
  }

}


module.exports.getMessages = async (fromUserId, ntfObjBool) => {
  
  try {

    let foundThreads = await Thread.find({participants: fromUserId}).exec();
    
    // let ftPromises = foundThreads.map(ft => {
    //   return new Promise((res) => {
    //     res(Message.find({threadIds: ft}))
    //   })
    // })
    
    // let messages = await Promise.all(ftPromises);

    let messages = [];

    let messageGroups = await Promise.all(foundThreads.map(ft => Message.find({threadIds: ft}).exec()));

    messages = messageGroups.reduce((messages, group)=> messages.concat(group), messages);
    
    if (ntfObjBool) {
      let returnObj = {
        response: messages,
        ntfObj: {}
      };

      for (let m of messages) {
        ntfObjAssign(returnObj.ntfObj, [fromUserId], m);
      }
      
      
      return returnObj;
    } else return messages;

  } catch (e) {
    return e;
  }
}


module.exports.newCampaign = async(campaignObj, ntfObjBool) => {
  try {

    let creator = await User.findById(campaignObj.createdBy).exec()

    let campaignThread = new Thread({
      participants: [campaignObj.createdBy],
      chatType: module.exports.CAMPAIGN,
      name: campaignObj.name
    })

    let campaign = new Campaign({
      name: campaignObj.name,
      createdBy: campaignObj.createdBy,
      description: campaignObj.description,
      dm: campaignObj.dm,
      game: campaignObj.game,
      // invitedPlayers: campaignObj.invitedPlayers,
      // this does not handle the actual invitation, commenting out the ability to do this
      threadId: campaignThread._id
    })

    creator.campaigns.push(campaign._id);

    campaignThread.campaignId = campaign._id;

    await Promise.all([
      campaignThread.save(),
      campaign.save(),
      creator.save()
    ])

    if (ntfObjBool) {
      let returnObj = {
        response: campaign,
        ntfObj: {}
      };

      // campaignThread, newCampaign, creator
      ntfObjAssign(returnObj.ntfObj, [creator._id], campaignThread);
      ntfObjAssign(returnObj.ntfObj, [creator._id], campaign);
      ntfObjAssign(returnObj.ntfObj, [creator._id], creator);
      
      return returnObj;
    } else return campaign;

  } catch(e) {
    return e;
  }
}


module.exports.newHandout = async (handoutObj, ntfObjBool) => {
  try {

    let {createdBy, campaignId, handoutTitle, image} = handoutObj;

    let [user, campaign] = await Promise.all([
      User.findById(createdBy).exec(),
      Campaign.findById(campaignId).exec()
    ])

    // make sure user is in campaign dm or players
    if (!campaign.players.includes(user._id) && !campaign.dm.includes(user._id)) {
      throw ("User does not have permission to create a handout for this campaign");
    }

    let handout = new Handout({
      createdBy,
      campaignId,
      handoutTitle,
      image
    });

    // add handout id to campaign
    campaign.handouts.push(handout._id);

    await Promise.all([
      handout.save(),
      campaign.save()
    ]);

    if (ntfObjBool) {
      let returnObj = {
        response: handout,
        ntfObj: {}
      };

      // handout, campaign
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.dm, campaign.players), handout);
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.dm, campaign.players), campaign);
      
      return returnObj;
    } else return handout;
  } catch(e) {
    return e;
  }
}


module.exports.newIndexEntry = async (iEntryObj, ntfObjBool) => {
  try {
    let {createdBy, campaignId, term, alternateTerms, associatedTerms, tags, text, category} = iEntryObj;

    let campaign = await Campaign.findById(campaignId).exec();

    if (!(campaign.dm.includes(createdBy) || campaign.players.includes(createdBy))) {
      throw ("User does not have permission to create an index entry for this campaign");
    }

    let indexEntry = new IndexEntry({
      createdBy, 
      campaignId, 
      term, 
      associatedTerms, 
      tags, 
      text, 
      category
    });

    campaign.index.push(indexEntry._id);

    if (alternateTerms) {
      let newAltTerms = alternateTerms.map(at => 
        {
          return {
            term: at,
            idHandle: indexEntry._id
          }
        }
      );
      indexEntry.alternateTerms = newAltTerms;
    }

    await Promise.all([
      campaign.save(),
      indexEntry.save()
    ]);


    if (ntfObjBool) {
      let returnObj = {
        response: indexEntry,
        ntfObj: {}
      }

      // campaign, indexEntry
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.players, campaign.dm), campaign);
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.players, campaign.dm), indexEntry);

      return returnObj;
    } else return indexEntry;

  } catch (e) {
    return e;
  }
}


module.exports.newJournalEntry = async (jEntryObj, ntfObjBool) => {
  try {

    let {campaignId, createdBy, title, text} = jEntryObj;

    let campaign = await Campaign.findById(campaignId).exec();

    if (!(campaign.players.includes(createdBy) || campaign.dm.includes(createdBy))) {
      throw ("User is not authorized to write a journal entry for this campaign");
    }

    let jEntry = new JournalEntry({
      campaignId,
      createdBy,
      title,
      text
    })

    campaign.journalEntries.push(jEntry._id);

    await Promise.all([
      campaign.save(),
      jEntry.save()
    ])

    if (ntfObjBool) {
      let returnObj = {
        response: jEntry,
        ntfObj: {}
      }

      // jEntry, campaign
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.dm, campaign.players), jEntry);
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.dm, campaign.players), campaign);

      return returnObj;

    } else return jEntry;

  } catch(e) {
    return e;
  }
}


module.exports.newThread = async(threadObj, ntfObjBool) => {
  try {
    let thread = new Thread(threadObj);
    let savedThread = await thread.save();

    if (ntfObjBool) {
      let returnObj = {
        response: savedThread,
        ntfObj: {}
      };

      // thread
      ntfObjAssign(returnObj.ntfObj, savedThread.participants, savedThread);


      return returnObj;
    } else return savedThread;

  } catch(e) {
    return e;
  }
}


module.exports.promoteToDm = async(promoteObj, ntfObjBool) => {

  try {

    let {sender, directRecipient, campaignId, threadIds, text} = promoteObj

    if (threadIds.length !== 2) {
      throw ("Message must be sent in campaign thread as well as a chat thread");
    }

    let [firstThread, secondThread, campaign] = await Promise.all([
      Thread.findById(threadIds[0]).exec(),
      Thread.findById(threadIds[1]).exec(),
      Campaign.findById(campaignId).exec()
    ]);

    let chatThread, campaignThread;

    // identify chat thread and campaign thread
    if (firstThread.chatType === module.exports.CAMPAIGN) {
      if (secondThread.chatType !== module.exports.CHAT) {
        throw ("Missing Chat thread")
      } else {
        campaignThread = firstThread;
      }
    } else if (secondThread.chatType === module.exports.CAMPAIGN) {
      if (firstThread.chatType !== module.exports.CHAT) {
        throw ("Missing Chat thread")
      } else {
        campaignThread = secondThread;
      }
    } else throw ("Missing Campaign thread");

    

    if (!campaign.players.includes(directRecipient)) {
      throw ("Cannot promote player - not a member of campaign players")
    }

    if (!campaign.dm.includes(sender)) {
      throw ("Message sender does not have authority to promote players")
    }


    let newMessage = new Message({
      sender,
      directRecipient,
      campaignId,
      threadIds,
      text,
      messageType: module.exports.PROMOTE_TO_DM,
      readBy: [sender]
    })

    campaign.dm.push(directRecipient);
    campaign.players = campaign.players.filter(p => String(p) !== String(directRecipient));

    await Promise.all([
      newMessage.save(),
      campaign.save()
    ])

    if (ntfObjBool) {
      let returnObj = {
        response: newMessage,
        ntfObj: {}
      };

      // newMessage, campaign
      ntfObjAssign(returnObj.ntfObj, campaignThread.participants, newMessage);
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.players, campaign.dm), campaign);
      
      return returnObj;
    } else return newMessage;

  } catch(e) {
    return e;
  }
  
}


module.exports.removeFromCampaign = async (removeObj, ntfObjBool) => {
  try {

    let {sender, directRecipient, campaignId, threadIds, text} = removeObj;


    // get campaign, both threads, removedUser
    let [campaign, firstThread, secondThread, removedUser] = await Promise.all([
      Campaign.findById(campaignId).exec(),
      Thread.findById(threadIds[0]).exec(),
      Thread.findById(threadIds[1]).exec(),
      User.findById(directRecipient).exec()
    ])

    let campaignThread;
    
    // identify chat thread and campaign thread
    if (firstThread.chatType === module.exports.CAMPAIGN) {
      if (secondThread.chatType !== module.exports.CHAT) {
        throw ("Missing Chat thread")
      } else {
        campaignThread = firstThread;
      }
    } else if (secondThread.chatType === module.exports.CAMPAIGN) {
      if (firstThread.chatType !== module.exports.CHAT) {
        throw ("Missing Chat thread")
      } else {
        campaignThread = secondThread;
      }
    } else throw ("Missing Campaign thread");


    // confirm that sender is a dm
    if (!campaign.dm.includes(sender)) {
      throw ("You do not have the authority to remove a player");
    }

    // confirm that removedUser is a player
    if (!campaign.players.includes(directRecipient)) {
      if (campaign.dm.includes(directRecipient)) {
        throw ("Player is a dm and cannot be removed");
      } else {
        throw ("Player is not in campaign");
      }
    }

    // remove removedUser from campaign
    campaign.players = campaign.players.filter(p => String(p) !== String(directRecipient));

    // remove campaign from removedUser
    removedUser.campaigns = removedUser.campaigns.filter(c => String(c) !== String(campaignId));

    // remove user from campaignThread
    campaignThread.participants = campaignThread.participants.filter(p => String(p) !== String(directRecipient));

    // create new message
    let removeMsg = new Message({
      sender,
      directRecipient,
      campaignId,
      threadIds,
      text,
      messageType: module.exports.REMOVE_FROM_CAMPAIGN,
      readBy: [sender]
    });

    // save all
    await Promise.all([
      campaign.save(),
      removedUser.save(),
      campaignThread.save(),
      removeMsg.save()
    ]);

    if (ntfObjBool) {
      let returnObj = {
        response: removeMsg,
        ntfObj: {}
      };

      // campaign, removedUser, campaignThread, removeMsg
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.dm, campaign.players), campaign);
      ntfObjAssign(returnObj.ntfObj, [removedUser._id], removedUser);
      ntfObjAssign(returnObj.ntfObj, campaignThread.participants, campaignThread);
      ntfObjAssign(returnObj.ntfObj, [].concat(campaignThread.participants, removedUser._id), removeMsg);

      return returnObj;
    } else return removeMsg;
  
  } catch(e) {
    return e;
  }
}


module.exports.roomInvite = async (roomInvObj, ntfObjBool) => {
  try {
    
    let {sender, directRecipient, text, threads} = roomInvObj;

    let [firstThread, secondThread] = await Promise.all([
      Thread.findById(threads[0]).exec(),
      Thread.findById(threads[1]).exec()
    ]);

    // find chatThread, roomThread
    let roomThread, chatThread;
    if (firstThread.chatType === module.exports.ROOM) {
      roomThread = firstThread;
      if (secondThread.chatType === module.exports.CHAT) {
        chatThread = secondThread;
      } else {
        throw ("Chat thread not included in message")
      }
    } else if (secondThread.chatType === module.exports.ROOM) {
      roomThread = secondThread;
      if (firstThread.chatType === module.exports.CHAT) {
        chatThread = secondThread;
      } else {
        throw ("Chat thread not included in message")
      }
    } else {
      throw ("Room thread not included in messages")
    }
    
    
    // confirm that directRecipient is not already in room
    if (roomThread.participants.includes(directRecipient)) {
      throw ("Recipient is already a member of this room");
    }

    // confirm that directRecipient does not have pending invitation to room
    let priorInvite = await Message.find({
      threadIds: chatThread._id,
      directRecipient,
      response: null
    }).exec()

    if (priorInvite.length > 0) {
      console.log(priorInvite);
      throw ("There is already a pending invitation to this user to join this room");
    }


    let newMessage = new Message({
      sender,
      directRecipient,
      text,
      threadIds: threads,
      messageType: module.exports.ROOM_INVITE,
      readBy: [sender]
    })

    await newMessage.save();

    if (ntfObjBool) {
      let returnObj = {
        response: newMessage,
        ntfObj: {}
      };

      // newMessage
      ntfObjAssign(returnObj.ntfObj, [].concat(roomThread.participants, directRecipient), newMessage)
      
      return returnObj;
    } else return newMessage;

  } catch(e) {
    return e;
  }
}


module.exports.roomInviteAccept = async (invActObj, ntfObjBool) => {
  try {
    let {sender, directRecipient, origMessageId, text,threads} = invActObj;

    // get threads, origMessage
    let [firstThread, secondThread, origMessage] = await Promise.all([
      Thread.findById(threads[0]).exec(),
      Thread.findById(threads[1]).exec(),
      Message.findById(origMessageId).exec()
    ])

    // find chatThread, roomThread
    let roomThread, chatThread;
    if (firstThread.chatType === module.exports.ROOM) {
      roomThread = firstThread;
      if (secondThread.chatType === module.exports.CHAT) {
        chatThread = secondThread;
      } else {
        throw ("Chat thread not included in message")
      }
    } else if (secondThread.chatType === module.exports.ROOM) {
      roomThread = secondThread;
      if (firstThread.chatType === module.exports.CHAT) {
        chatThread = secondThread;
      } else {
        throw ("Chat thread not included in message")
      }
    } else {
      throw ("Room thread not included in messages")
    }

    // confirm origMessage has no response
    if (!origMessage.response.$isEmpty()) {
      throw ("There is already a response to this message");
    }

    // confirm origMessage is from directRecipient
    if (String(directRecipient) !== String(origMessage.sender)) {
      throw ("Direct recipient is not sender of original message")
    }

    // confirm directRecipient (original sender) is in thread
    if (!roomThread.participants.includes(directRecipient)) {
      throw ("Sender of original message is not a member of this room")
    }
    
    // confirm sender is not in thread
    if (roomThread.participants.includes(sender)) {
      throw ("Sender is already a member of this room");
    }


    let newMessage = new Message({
      sender, 
      directRecipient, 
      text,
      threadIds: threads,
      messageType: module.exports.ROOM_INVITE_ACCEPT,
      readBy: [sender]
    });

    roomThread.participants.push(sender);
    origMessage.response = {
      messageId: newMessage._id,
      messageType: module.exports.ROOM_INVITE_ACCEPT
    };


    await Promise.all([
      roomThread.save(),
      origMessage.save(),
      newMessage.save()
    ])

    if (ntfObjBool) {
      let returnObj = {
        response: newMessage,
        ntfObj: {}
      };

      // roomThread, origMessage, newMessage
      ntfObjAssign(returnObj.ntfObj, roomThread.participants, roomThread);
      ntfObjAssign(returnObj.ntfObj, roomThread.participants, origMessage);
      ntfObjAssign(returnObj.ntfObj, roomThread.participants, newMessage);
      
      return returnObj;
    } else return newMessage;

  } catch(e) {
    return e;
  }
}


module.exports.roomInviteReject = async (invRejObj, ntfObjBool) => {
  try {
    let {sender, directRecipient, origMessageId, text,threads} = invRejObj;

    // get threads, origMessage
    let [firstThread, secondThread, origMessage] = await Promise.all([
      Thread.findById(threads[0]).exec(),
      Thread.findById(threads[1]).exec(),
      Message.findById(origMessageId).exec()
    ])

    // find chatThread, roomThread
    let roomThread, chatThread;
    if (firstThread.chatType === module.exports.ROOM) {
      roomThread = firstThread;
      if (secondThread.chatType === module.exports.CHAT) {
        chatThread = secondThread;
      } else {
        throw ("Chat thread not included in message")
      }
    } else if (secondThread.chatType === module.exports.ROOM) {
      roomThread = secondThread;
      if (firstThread.chatType === module.exports.CHAT) {
        chatThread = secondThread;
      } else {
        throw ("Chat thread not included in message")
      }
    } else {
      throw ("Room thread not included in messages")
    }

    // confirm origMessage has no response
    if (!origMessage.response.$isEmpty()) {
      throw ("There is already a response to this message");
    }

    // confirm origMessage is from directRecipient
    if (String(directRecipient) !== String(origMessage.sender)) {
      throw ("Direct recipient is not sender of original message")
    }

    // confirm directRecipient (original sender) is in thread
    if (!roomThread.participants.includes(directRecipient)) {
      throw ("Sender of original message is not a member of this room")
    }
    
    // confirm sender is not in thread
    if (roomThread.participants.includes(sender)) {
      throw ("Sender is already a member of this room");
    }

    let newMessage = new Message({
      sender, 
      directRecipient, 
      text,
      threadIds: threads,
      messageType: module.exports.ROOM_INVITE_REJECT,
      readBy: [sender]
    });

    
    origMessage.response = {
      messageId: newMessage._id,
      messageType: module.exports.ROOM_INVITE_REJECT
    };


    await Promise.all([
      origMessage.save(),
      newMessage.save()
    ])

    if (ntfObjBool) {
      let returnObj = {
        response: newMessage,
        ntfObj: {}
      };

      // origMessage, newMessage
      ntfObjAssign(returnObj.ntfObj, [].concat(sender, roomThread.participants), origMessage);
      ntfObjAssign(returnObj.ntfObj, [].concat(sender, roomThread.participants), newMessage);
      
      return returnObj;
    } else return newMessage;

  } catch(e) {
    return e;
  }
}


module.exports.stepDownDm = async (stepDownObj, ntfObjBool) => {
  
  try {
    let {sender, campaignId, threadIds, text} = stepDownObj;

    if (threadIds.length !== 1) {
      throw ("STEP_DOWN_DM should only be sent in the campaign thread")
    }

    let [campaign, thread] = await Promise.all([
      Campaign.findById(campaignId).exec(),
      Thread.findById(threadIds[0]).exec()
    ]);

    if (String(thread._id) !== String(campaign.threadId)) {
      throw ("STEP_DOWN_DM should only be sent in the campaign thread")
    }

    campaign.players.push(sender);
    campaign.dm = campaign.dm.filter(p => String(p) !== String(sender));

    let newMessage = new Message({
      sender,
      campaignId,
      threadIds,
      text,
      messageType: module.exports.STEP_DOWN_DM,
      readBy: [sender]
    })

    await Promise.all([
      newMessage.save(),
      campaign.save()
    ]);

    if (ntfObjBool) {
      let returnObj = {
        response: newMessage,
        ntfObj: {}
      };

      // newMessage, campaign
      ntfObjAssign(returnObj.ntfObj, thread.participants, newMessage);
      ntfObjAssign(returnObj.ntfObj, [].concat(campaign.dm, campaign.players), campaign);
      
      return returnObj;
    } else return newMessage;

  } catch(e) {
    return e;
  }

}


module.exports.test = () => {
  console.log("yodelayheehoo!")
}

module.exports.textOnly = async(textObj, ntfObjBool) => {
  try {
    let {sender, threadIds, text} = textObj;

    let newMessage = new Message({
      sender: sender,
      threadIds: threadIds,
      messageType: module.exports.TEXT_ONLY,
      text: text,
      readBy: [textObj.sender]
    })

    if (threadIds.length !== 1) {
      throw ("A text message can only be sent in one thread");
    }

    let thread = await Thread.findById(threadIds[0]).exec();

    await newMessage.save();

    if (ntfObjBool) {
      let returnObj = {
        response: newMessage,
        ntfObj: {}
      };

      console.log(thread.participants);
      // newMessage
      ntfObjAssign(returnObj.ntfObj, thread.participants, newMessage);
      
      return returnObj;
    } else return newMessage;

  } catch(e) {
    return e;
  }
}

module.exports = Object.assign({Campaign, Character, Message, Thread, User}, module.exports)





