# router tests

This folder exists to run api tests on the backend to make sure that all of the route handling is functioning correctly, including the database operations that were already unit tested with custom tests for each required database operation (see "./unit tests"). 

Instead of running a unique script for each test, the goal here is to cut down on redundant code that would be spread across multiple scripts, and accordingly these tests can be all be run by calling "node routeTest.js", with a flag of the test to be run. Those tests are: 

"-newUser",
"-confirmUser",
"-newThread",
"-befriendRequest",
"-getMessages",
"-befriendAccept",
"-befriendReject",
"-endFriendship",
"-textMessage",
"-newCampaign",
"-campaignInvite",
"-campaignInviteAccept",
"-campaignInviteReject",
"-exitCampaign",
"-removeFromCampaign",
"-promoteToDm",
"-stepDownDm",
"-roomInvite",
"-roomInviteAccept",
"-roomInviteReject",
"-newHandout",
"-editHandout",
"-newJournalEntry",
"-editJournalEntry",
"-newIndexEntry",
"-editIndexEntry",

The first flag to be called will run that test. If a flag is unknown, the program will finish saying that the flag was not recognized.

Using routeTest.js requiers using appTest.js, which is virtually identifical to "rpg-notetaker/backend/app.js", with the major differences being a different database being used, a different port to listen on, and console logs to detail process

Output from routeTest.js for all operations will be written to "routerTest log.txt". Additionally, individual user text files will be written to the same folder all in the format of "username.txt".