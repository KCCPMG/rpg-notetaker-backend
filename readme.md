# RPG Notetaker Backend

###### Summary:



## models

###### Summary:

These are all of the models for all of the database objects in the RPG Notetaker. That includes Users, Campaigns, Messages, etc., and may expand over time as 


### Campaign.js

Relatively self-explanatory, a campaign contains the most basic information regarding a campaign, and pointers to all journal entries, index entries, and handouts (all of which will also point back):

* name (String)
* createdBy (ObjectId - User)
* createdOn (Date)
* description (String) 
* dm (Array of ObjectId - User)
* game (String)
* players (Array of ObjectId - User)
* invitedPlayers (Array of ObjectId - User)
* journalEntries (Array of ObjectId - JournalEntry)
* index (Array of ObjectId - IndexEntry)
* threadId (ObjectId - Thread)

&nbsp;

### Character.js

TBD

### Handout.js

A Handout is a an image stored in a buffer which stores notes that can be marked up, as well as a description (optional). This is meant to be used specifically for maps where users can indicate specific locations and notes:

* createdBy (ObjectId - User)
* createdOn (Date)
* campaignId (ObjectId - Campaign)
* editedBy (ObjectId - User)
* editedOn (Date)
* handoutTitle (String)
* image (Buffer)
* description (String)
* notes (Array (
  * position
    * x (Number)
    * y (Number) 
  * text (String)
  )
)

&nbsp;

### IndexEntry.js

An IndexEntry will belong to a specific campaign and is meant to be akin to an entry in an encyclopedia. Each entry will have a main term, as well as several alternate terms that refer to the same entry, and will also have associated terms that will serve as quick links. For example, the entry for Sauron would likely have Mordor, Barad-dur, etc. as associated terms. Additionally, there is also an available list of tags that a user on the front end will be able to sort through. Finally, there is a category for each term, where one of several options will be picked (this is somewhat akin to tags, but is a fixed list of easy categories). Additionally, there is the schema altEntry, which is used privately, which is used in the main schema for both alternateTerms and associatedTerms. 

altEntry:

* term (String)
* idHandle (ObjectId - IndexEntry)

IndexEntry:

* term (String)
* alternateTerms (Array of altEntry)
* associatedTerms (Array of altEntry)
* tags (Array of Strings)
* text (String)
* category (String - one of ("Character", "Location", "Organization", "Item", "Other"))

&nbsp;

### JournalEntry.js

A JournalEntry is a text entry to describe events. As such it is fairly simple and largely just contains a createdDate, a title, and text:

* createdDate (Date)
* title (String)
* text (String)

&nbsp;

### Message.js

A Message is any communication from one user to one or more other users. A message can be in a chat (one user talking to another), a room (one or more users talking to another), or a campaign (a room with participants fixed to the campaign). A message can be a simple text message, or it can be any one of a number of invitations, invitation acceptances, invitation rejections, or terminations, regarding friendships, rooms, and campaigns. A message can also be a dm promotion or dm stepping down, as these are campaign events significant enough to warrant inclusion in the campaign chat. Invitations and requests ("BEFRIEND_REQUEST", "CAMPAIGN_INVITE", "ROOM_INVITE") that are awaiting a response need to have the response object added when the message is responded to, which entails adding the ObjectId of the response message as well as the messageType of the response. 

In some instances, it is desirable to have multiple threads have access to the same message. For example, if Person A invites Person D into a room that person A, person B, and person C are all in, then that invitation is relevant to that room, as well as to Person A and Person D more directly. This invitation should be immediately accessible to someone looking in the thread of both the room and the thread of the one-to-one chat between Person A and Person D. Because of this, the threadIds will be for an Array because every message will have __either 1 or 2 threadIds__. If a message will be visible in a group setting but requires action from one specific person, that person will be referred to as the directRecipient, an entry which is otherwise redundant or not applicable in other circumstances. 

* sender (ObjectId - User)
* directRecipient (ObjectId - User, null unless messageType is "CAMPAIGN_INVITE" or "ROOM_INVITE")
* campaignId (ObjectId - Campaign, required for messageTypes "CAMPAIGN_INVITE", "CAMPAIGN_INVITE_ACCEPT", "CAMPAIGN_INVITE_REJECT")
* threadIds (Array of ObjectId - Thread, one threadId for "TEXT_ONLY" and "END_FRIENDSHIP", two threadIds for all other messageTypes)
* sendTime (Date)
* messageType (one String of Array: "BEFRIEND_REQUEST", "BEFRIEND_ACCEPT", "BEFRIEND_REJECT", "END_FRIENDSHIP", "TEXT_ONLY", "CAMPAIGN_INVITE", "CAMPAIGN_INVITE_ACCEPT", "CAMPAIGN_INVITE_REJECT", "EXIT_CAMPAIGN", "REMOVE_FROM_CAMPAIGN", "PROMOTE_TO_DM", "STEP_DOWN_DM", "ROOM_INVITE", "ROOM_INVITE_ACCEPT", "ROOM_INVITE_REJECT")
* text (String)
* response (Object, null unless responded to:
  * messageId (ObjectId - Message)
  * messageType (String of Array: "BEFRIEND_ACCEPT", "BEFRIEND_REJECT", "CAMPAIGN_INVITE_ACCEPT", "CAMPAIGN_INVITE_REJECT", "ROOM_INVITE_ACCEPT", "ROOM_INVITE_REJECT"))
* readBy (Array of ObjectId - User)

&nbsp;

### Thread.js

A thread contains limited information about a messaging thread, specifically the participants and what kind of room it is. A "CHAT" is a one-to-one conversation, a "ROOM" is a group chat with one or more participants, and a "CAMPAIGN" is a chat that is specifically tied to a Campaign. 

* participants (Array of ObjectId - User)
* chatType (one String of Array: "Chat", "Room", "Campaign")
* campaignId (ObjectId - Campaign, if type is Campaign)
* name (only if type is "Room" - String)

&nbsp;

### User.js

The User represents the actual profile of someone who has created an account.

* name (String)
* email (String)
* password (String, stored as a hash through bcrypt)
* confirmed (Boolean defaults as false)
* createTime (Date)
* characters (Array of ObjectId - Player)
* campaigns (Array of ObjectId - Campaign)
* friends (Array of ObjectId - User)

&nbsp;

## Controls.js

Controls.js will import all of the models, and then export them along with a group of functions. The following functions will handle the database interactions associated with messages as well as campaign events. These functions are written here to be used within the route handlers.

If a Controls function fails to execute due to an error, it will return either an error, or a string. Otherwise it will return a returnObj, which will have two keys: a response and an ntfObj. The response will be whatever is meant to be sent back as part of the request/response cycle, and the ntfObj will be the notification Object, which will contain the user ids of the users who are to receive notifications as well as the notification itself. For example, if user1 sends a befriendRequest message to user2 in a request to the route handler, a successful request will result in a response to user1 with the saved befriendRequest message, but will also result in the creation of an ntfObj that will have each userId as a key with the value being the document to be sent to that user as the outcome of that database action. 

 __Note:__ there is a function here for creating a new thread, but __the burden to call the newThread function falls to the API if it does not detect that a thread exists.__ Every message function here expects a valid threadId to be passed to it.

### Message Events:


#### befriendRequest(befriendRequestObj, ntfObjBool)

  * find thread from befriendRequestObj
  * confirm thread exists
  * confirm thread is of type CHAT
  * create new message
    * threadIds: befriendRequestObj.threadIds
    * messageType: BEFRIEND_REQUEST
    * readBy: [sender] 
    
    &nbsp;

  * save message
  * if ntfObjBool, return returnObj
    * message - thread participants
  * otherwise return message

  &nbsp;


#### befriendAccept(befriendAcceptObj, ntfObjBool)

  * find origMessage, origThread
  * find befriendRequester, befriendAccepter
  * make sure that origMessage threadId is same as befriendAcceptObj threadId
  * make sure that origMessage has only one threadId
  * make sure that befriendAcceptObj has only one threadID
  * make sure origMessage does not already have a response
  * make sure befriendRequester and befriendAccepter not already friends
  * create acceptMessage
    * sender: befriendAcceptObj sender
    * origMessage: befriendAcceptObj origMessage
    * messageType: BEFRIEND_ACCEPT
    * threadIds: befriendAcceptObj threadIds
    * text: befriendAcceptObj text
    * readBy: [befriendAcceptObj sender]
    &nbsp;
  * add befriendAccepter to befriendRequester friends
  * add befriendRequester to befriendAccepter friends
  * assign origMessage response
    * messageId: acceptMessage id
    * messageType: BEFRIEND_ACCEPT
    &nbsp;
  * save origMessage, acceptMessage, befriendRequester, befriendAccepter
  * if ntfObjBool, return returnObj
    * acceptMessage - origThread participants
    * befriendRequester - befriendRequester
    * befriendAccepter - befriendAccepter
  * otherwise return acceptMessage

  &nbsp;


#### befriendReject(befriendRejectObj, ntfObjBool)
  * find origMessage
  * find befriendRequester, befriendRejector
  * make sure origMessage threadId is same as befriendRequestObj threadId
  * make sure that origMessage has only one threadId
  * make sure that befriendRejectObj has only one threadID
  * make sure origMessage does not already have a response
  * make sure befriendRequester and befriendRejector not already friends
  * create rejectMessage
    * sender: befriendRejectObj sender
    * threadIds: befriendRejectObj threadIds
    * messageType: BEFRIEND_REJECT
    * text: befriendRejectObj text
    * readBy: [befriendRejectObj sender]
    &nbsp;
  * set response to rejectMessage
    * messageId: rejectMessage id
    * messageType: BEFRIEND_REJECT
    &nbsp;
  * save origMessage and rejectMessage
  * if ntfObjBool return returnObj
    * origMessage - origMessage sender & rejectMessage sender
    * rejectMessage - origMessage sender & rejectMessage sender
  * otherwise return rejectMessage

  &nbsp;


#### campaignInvite(campaignInviteObj, ntfObjBool)
  * find campaign, firstChatThread, secondChatThread
  * from firstChatThread and secondChatThread, identify which is campaignThread and which is chatThread, make sure both are included
  * make sure recipient not already a player
  * make sure recipient not already a dm
  * make sure recipient not already an invitedPlayer
  * add recipient to campaign invitedPlayers
  * create newMessage
    * sender, directRecipient, campaignId, threadIds, text from campaignInviteObj
    * messageType: CAMPAIGN_INVITE
    * readBy: [sender]
    &nbsp;
  * save newMessage and campaign
  * if ntfObjBool return returnObj
    * newMessage - campaignThread participants & directRecipient
    * campaign  - campaign players & campaign dm
  * otherwise return newMessage

  &nbsp;

#### campaignInviteAccept(cpnInvAcptObj, ntfObjBool)
  * find campaign, originalMessage, firstThread, secondThread, user
  * identify campaignThread and chatThread from firstThread and secondThread
  * make sure chatThread has exactly 2 participants
  * make sure chatThread includes sender and directRecipient
  * make sure origMessage has no response
  * make sure sender is in campaign invitedPlayers
  * make sure sender is not a current player in campaign
  * make sure sender is not a current dm in campaign
  * create cpnInvAcptMsg
    * sender, directRecipient, campaignId, threadIds, text from cpnInvAcptObj
    * messageType: CAMPAIGN_INVITE_ACCEPT
    * readBy: [sender]
    &nbsp;
  * set originalMessage response
    * messageId: cpnInvAcptMsg id
    * messageType: CAMPAIGN_INVITE_ACCEPT
    &nbsp;
  * add sender to campaignThread participants
  * remove sender from campaignThread invitedPlayers
  * and sender to campaign players
  * add campaign id to user campaigns
  * save cpnInvAcptMsg, campaign, campaignThread, originalMessage, user
  * if ntfObjBool return returnObj
    * campaign - campaign players & campaign dm
    * campaignThread - campaignThread participants
    * originalMessage - campaignThread participants
    * cpnInvAcptMsg - campaignThread participants
    * user - user
  * otherwise return cpnInvAcptMsg

  &nbsp;

  

#### campaignInviteReject(cpnInvRejObj, ntfObjBool)
  * find campaign, originalMessage, firstThread, secondThread
  * identify campaignThread and chatThread from firstThread and secondThread
  * make sure chatThread has exactly 2 participants
  * make sure chatThread participants are sender and directRecipient
  * make sure origMessage has no resposne
  * make sure campaign invitedPlayers includes sender
  * make sure sender is not already in campaign players
  * make sure sender is not already in campaign dm
  * create response message
  * set originalMessage response
    * messageId: response id
    * messageType: CAMPAIGN_INVITE_REJECT
    &nbsp;
  * remove sender from campaign invitedPlayers
  * save response message, campaign, and originalMessage
  * if ntfObjBool return returnObj
    * originalMessage - campaignThread participants & sender
    * cpnInvRejMsg - campaignThread participants & sender
    * campaign - campaign players & campaign dm
  * otherwise return response message

  &nbsp;


#### editHandout(handoutObj, ntfObjBool)
  * get campaign, handout
  * make sure handoutObj campaignId matches handout campaignId
  * make sure editedBy is in campaign players or campaign dm
  * edit handout
    * set handoutTitle, image, description, note, editedBy, editedOn from handoutObj
  * save handout
  * if ntfObjBool return returnObj
    * handout - campaign players & campaign dm
  * otherwise return handout

  &nbsp;


#### editIndexEntry(iEntryObj, ntfObjBool)
  * get campaign, indexEntry
  * make sure lastEditedBy is a campaign player or a campaign dm
  * set lastEditedBy to iEntryObj lastEditedBy
  * set lastEditedDate to new Date
  * map alternateTerms from iEntryObj alternateTerms to array of objects with idHandle of indexEntry id
  * set term, associatedTerms, tags, text, category from iEntryObj
  * save indexEntry
  * if ntfObjBool return returnObj
    * indexEntry - campaign players & campaign dm
  * otherwise return indexEntry

  &nbsp;


#### editJournalEntry(jEntryObj, ntfObjBool)
  * get jEntry, campaign
  * make sure lastEditedBy is in campaign players or campaign dm
  * set lastEditedBy to jEntryObj lastEditedBy
  * set lastEditedDate to new Date
  * set title and text from jEntryObj
  * save jEntry
  * if ntfObjBool return returnObj
    * jEntry - campaign dm & campaign players
  * otherwise return jEntry

  &nbsp;

#### endFriendship(endFriendshipObj, ntfObjBool)
  * find thread from threadId
  * confirm thread is type "Chat"
  * get unfriended, defriender
  * create endMessage
    * sender, threadIds, text
    * messageType: END_FRIENDSHIP
    * readBy: [sender]
    &nbsp;
  * remove unfriended from defriender friends
  * remove defriender from unfriended friends
  * save unfriended, defriend, endMessage,
  * if ntfObjBool return returnObj
    * endMessage - unfriended & defriender
    * unfriended - unfriended
    * defriender - defriender
  * otherwise return endMessage
  
  &nbsp;


#### exitCampaign(exitCampaignObj ntfObjBool)
  * find campaign, campaignThread, quitter
  * confirm that sender is in campaign players
  * create quitMessage
    * sender, campaignId, threads, text from exitCampaignObj
    * messageType: EXIT_CAMPAIGN
    * readBy: [sender]
    &nbsp;
  * remove campaign from quitter campaigns
  * remove quitter from campaign players
  * remove quitter from campaignThread
  * save campaign, campaignThread, quitter, quitMessage
  * if ntfObjBool return returnObj
    * campaign - campaign players & campaign dm
    * campaignThread - campaignThread participants
    * quitter - quitter
    * quitMessage - campaignThread participants & quitter
  * otherwise return quit message

  &nbsp;


#### getMessages(fromUserId)
  * find all threads that include fromUserId
  * find all messages in threads
  * return all messages

  &nbsp;


#### newCamapign.js(campaignObj, ntfObjBool)
  * get creator
  * create new campaignThread
    * participants: [campaignObj.createdBy]
    * chatTye: CAMPAIGN
    * name: campaignObj.name
  * create newCampaign
    * name, createdBy, description, dm, game, invitedPlayers, from campaignObj
    * threadId: campaignThread._id
    &nbsp;
  * add campaign id to creator campaigns
  * campaignThread.campaignId = newCampaign._id
  * save campaignThread, creator, and newCampaign
  * if ntfObjBool return returnObj
    * campaignThread - creator
    * newCampaign - creator
    * creator - creator
  * otherwise return newCampaign

  &nbsp;

#### newHandout(handoutObj, ntfObjBool)
  * get user and campaign
  * make sure user is in campaign dm or campaign players
  * make handout
    * createdBy, campaignId, handoutTitle, image from handoutObj
    &nbsp;
  * add handout id to campaign handouts
  * save handout and campaign
  * if ntfObjBool return returnObj
    * handout - campaign dm & campaign players
    * campaign - campaign dm & campaign players
  * otherwise return handout

  &nbsp;


#### newIndexEntry(iEntryObj, ntfObjBool)
  * get campaign
  * make sure createdBy is in campaign dm or campaign players
  * create indexEntry from iEntryObj
  * add indexEntry id to campaign index
  * map alternateTerms from iEntryObj alternateTerms to array of objects with idHandle of indexEntry id
  * save campaign, indexEntry
  * if ntfObjBool return returnObj
    * campaign - campaign players & campaign dm
    * indexEntry - campaign players & campaign dm
  * otherwise return indexEntry

  &nbsp;


#### newJournalEntry(jEntryObj, ntfObjBool)
  * get campaign
  * make sure createdBy in campaign players or campaign dm
  * create jEntry from jEntryObj
  * campaign journalEntries add jEntry
  * save campaign, jEntry
  * if ntfObjBool return returnObj
    * jEntry - campaign dm & campaign players
    * campaign - campaign dm & campaign players
  * otherwise return jEntry

  &nbsp;

#### newThread(threadObj, ntfObjBool)
  * create new thread from threadObj
  * save thread
  * if ntfObjBool return returnObj
    * savedThread - participants
  * otherwise return thread

  &nbsp;


#### promoteToDm(promoteObj, ntfObjBool)
  * confirm that there are two threadIds
  * find campaign and thread from campaignId and threadIds
  * confirm that threads are of type CAMPAIGN and CHAT
  * confirm that toUser is in campaign.players
  * confirm that fromUser is in campaign.dm
  * create newMessage 
    * sender, directRecipient, campaignId, threadIds, text from promoteObj
    * messageType: PROMOTE_TO_DM
    * readBy: [fromUser]
    &nbsp;
  * add toUser to campaign dm 
  * remove toUser from campaign players
  * save newMessage and campaign
  * if ntfObjBool return returnObj
    * newMessage - campaignThread participants
    * campaign campaign players & campaign dm
  * otherwise return newMessage

  &nbsp;


#### removeFromCampaign(removeObj, ntfObjBool)
  * get campaign, firstThread, secondThread, removedUser
  * identify campaignThread from firstThread and secondThread
  * make sure sender is in campaign dm
  * make sure that removedUser is in campaign players
  * remove removedUser from campaign
  * remove campaign from removedUser campaigns
  * remove removedUser from campaignThread participants
  * create removeMsg
    * sender, directRecipient, campaignId, threadIds, and text from removeObj
    * messageType: REMOVE_FROM_CAMPAGIN
    * readBy: [sender]
    &nbsp;
  * save campaign, removedUser, campaignThread, removeMsg
  * if ntfObjBool return returnObj
    * campaign - campaign dm & campaign players
    * removedUser - removedUser
    * campaignThread - campaignThread participants
    * removeMsg - campaignThread participants and removedUser
  * otherwise return removeMsg
  
  &nbsp;


#### roomInvite(roomInvObj, ntfObjBool) 
  * get firstThread and secondThread
  * identify roomThread and chatThread from firstThread and secondThread
  * make sure that directRecipient is not already in the room
  * make sure that there is not already a pending invitation to the room
  * create newMessage
    * sender, text, directRecipient from roomInvObj
    * threadIds: threads
    * messageType: ROOM_INVITE
    * readBy: [sender]
    &nbsp;
  * save newMessage
  * if ntfObjBool return returnObj
    * newMessage - roomThread participants &  directRecipient
  * otherwise return newMessage

  &nbsp;


#### roomInviteAccept(invActObj, ntfObjBool)
  * get firstThread, secondThread, origMessage
  * identify chatThread and roomThread from firstThread and secondThread
  * make sure origMessage has no resposne
  * make sure origMessage is from directResponse
  * make sure directRecipient is in roomThread participants
  * make sure sender is not in roomThread participants
  * create newMessage
    * sender, directRecipient, text from invActObj
    * threadIds: threads,
    * messageType: ROOM_INVITE_ACCEPT
    * readBy: [sender]
    &nbsp;
  * add sender to roomThread participants
  * set origMessage response
    * messageId: newMessage id
    * messageType: ROOM_INVITE_ACCEPT
    &nbsp;
  * save roomThread, origMessage, newMessage
  * if ntfObjBool return returnObj
    * roomThread - roomThread participants
    * origMessage - roomThread participants
    * newMessage - roomThread participants
  * return newMessage
  
  &nbsp;


#### roomInviteReject(invRejObj, ntfObjBool)
  * get firstThread, secondThread, origMessage
  * identify chatThread and roomThread from firstThread and secondThread
  * make sure that origMessage has no response
  * make sure that origMessage is from directRecipient
  * make sure that directRecipient is in roomThread
  * make sure that sender is not in roomThread
  * create newMessage
    * sender, directRecipient, text from invRejObj
    * threadIds: threads
    * messageType: ROOM_INVITE_REJECT
    * readBy: [sender]
    &nbsp;
  * set origMessage response
    * messageId: newMessage id
    * messageType: ROOM_INVITE_REJECT
    &nbsp;
  * save origMessage and newMessage
  * if ntfObjBool
    * origMessage - sender & roomThread participants 
    * newMessage - sender & roomThread participants
  * otherwise return newMessage
  
  &nbsp; 


#### stepDownDm(stepDownObj, ntfObjBool)
  * make sure only one threadId in stepDownObj
  * get campaign and thread
  * make sure threadId matches campaign
  * add sender to campaign players
  * remove sender from campaign dm
  * create newMessage
    * sender, campaignId, threadIds, text from stepDownObj
    * messageType: STEP_DOWN_DM
    * readBy: [sender]
    &nbsp;
  * save newMessage and campaign
  * if ntfObjBool return returnObj
    * newMessage - thread participants
    * campaign - campaign dm & campaign players
  * otherwise return newMessage

  &nbsp;


#### textMessage(textObj)
  * create new message (
    * sender, threadIds, text from textObj
    * messageType: TEXT_ONLY
    * readBy: [fromUser])
  * save message
  * return message

  &nbsp;


    

 



### Non-Message Campaign Events:





### Non-Message User Events:

  * createUser(userObj)
    * create new user
    * await save of user
    * return user

## routes

After requests are sent to the various routes, they must do one of two things:
* Respond by sending the returnObj.response (and streaming the ntfObj if there is one)
* sending an error



## test

