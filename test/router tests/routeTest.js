const app = require('./appTest.js');
const axios = require('axios');
const fs = require('fs');
const EventSource = require('EventSource');
const events = require('events');
const EventEmitter = new events();

const util = require('util');

const MAIN_HANDLE_NAME = "routerTest log.txt";
let mainHandle = fs.openSync(MAIN_HANDLE_NAME, 'w');
const E_SOURCE_ARR = [];

const Controls = require('../../models/Controls.js')

var esCount = 0;
fs.openSync('events log.txt', 'w');


// call this on all eSources 
const esMeter = async (mesOrErr, name) => {
  esCount++;

  let copy = Object.assign({}, mesOrErr)

  try {
    copy.data = JSON.parse(copy.data);
  } catch(e) {
    // do nothing
  }

  let deepPrinted = JSON.stringify(copy, null, 2);

  fs.appendFileSync('events log.txt', `Event # ${esCount}`);
  fs.appendFileSync('events log.txt', '\n');
  
  fs.appendFileSync('events log.txt', name) 
  fs.appendFileSync('events log.txt', '\n');
  
  fs.appendFileSync('events log.txt', deepPrinted) 
  fs.appendFileSync('events log.txt', '\n');

  // try {
  //   let data = JSON.parse(mesOrErr.data);
  //   fs.appendFileSync('events log.txt', "data expanded: ");
  //   fs.appendFileSync('events log.txt', JSON.stringify(data, null, 2)); 
  //   fs.appendFileSync('events log.txt', '\n');
  // } catch(e) {
  //   // do nothing
  // }

  fs.appendFileSync('events log.txt', '\n\n');

  EventEmitter.emit(`Event #${esCount}`);
}


// helper function to either wait for all req'd event streams or stop after certain time
const eventAwait = async (seconds, eventNo) => {
  return await new Promise((res, rej) => {
    let timeout = setTimeout(() => {
      console.log(`\nFrom eventAwait, hitting timeout after ${seconds} seconds.`)
      res();
    }, 1000*seconds);
    EventEmitter.on(`Event #${eventNo}`, () => {
      clearTimeout(timeout);
      res();
    })
  })
  
}


// function to wrap all GET API requests to be used to log requests and responses in MAIN_HANDLE_NAME, as well as in the text logs for individual users
const getWrapper = async (handle, url, config) => {
  
  fs.appendFileSync(MAIN_HANDLE_NAME, `\n${handle} GET REQUEST ${url} ${new Date().toString()}\n`)
  
  fs.appendFileSync(handle, `\nGET REQUEST ${url} ${new Date().toString()}\n`)
  
  let res = await axios.get(url, config);
  
  fs.appendFileSync(MAIN_HANDLE_NAME, `\n${handle} GET RESPONSE ${url} ${new Date().toString()}
  \n${JSON.stringify(res.data, null, 2)} \ncookie: ${JSON.stringify(res.headers['set-cookie'])} \n`)
  
  fs.appendFileSync(handle, `\nGET RESPONSE ${url} ${new Date().toString()}\n${JSON.stringify(res.data, null, 2)} \ncookie: ${JSON.stringify(res.headers['set-cookie'])} \n`);
  return res;
}
 
// function to wrap all POST API requests to be used to log requests and responses in MAIN_HANDLE_NAME, as well as in the text logs for individual users
const postWrapper = async (handle, url, data, config) => {
  // console.log(handle);
  fs.appendFileSync(MAIN_HANDLE_NAME, `\n${handle} POST REQUEST ${url} ${new Date().toString()}\n`)
  
  fs.appendFileSync(handle, `\nPOST REQUEST ${url} ${new Date().toString()}\n`)
  
  let res = await axios.post(url, data, config);
  
  fs.appendFileSync(MAIN_HANDLE_NAME, `\n${handle} POST RESPONSE ${url} ${new Date().toString()}\n${JSON.stringify(res.data, null, 2)} \ncookie: ${JSON.stringify(res.headers['set-cookie'])} \n`)
  
  fs.appendFileSync(handle, `\nPOST RESPONSE ${url} ${new Date().toString()}\n${JSON.stringify(res.data, null, 2)} \ncookie: ${JSON.stringify(res.headers['set-cookie'])} \n`);
  return res;
}

// working
const createUserAndLog = async (username, userObj) => {
  // open file named username
  fs.openSync(`${userObj.name}.txt`, 'w');
  
  let createUserRes = await postWrapper(`${userObj.name}.txt`, 'http://localhost:3001/users/newUser', {userObj}, {})

  let user = createUserRes.data.user;

  // essential additional field for reuse 
  user.cleanPassword = userObj.password;
  
  return user;
}


// working
const confirmUser = async (user) => {
  try {
    return await postWrapper(
      `${user.name}.txt`,
      `http://localhost:3001/users/confirmUser/${user._id}`,
      {
        email: user.email,
        password: user.cleanPassword
      },
      // config
    )
  } catch(e) {
    console.error(e);
  }
}


// working
const loginUser = async (user) => {

  try {  
    let response = await postWrapper(`${user.name}.txt`, 'http://localhost:3001/users/login', {
      email: user.email, 
      password: user.cleanPassword
    }, /*config*/)


    let loggedInTU = response.data.user;

    loggedInTU.token = (response.headers['set-cookie'])
    console.log(`\nFrom test/router tests/routeTest.js - loginUser, loggedInTU.token:`, loggedInTU.token);

    // subscribe to eventSource
    var eSource = await new EventSource(`http://localhost:3001/stream/${user._id}`, {
      headers: {
        Cookie: loggedInTU.token
      }
    });

    console.log("\nFrom routeTest.js - loginUser, sanity check");
    console.log("\nFrom routeTest.js - loginUser, eTaskSource:\n", eSource);

    E_SOURCE_ARR.push(eSource);

    // establish eSource listeners
    await Promise.race([
      new Promise((res,rej) => { 
        eSource.onmessage = (mes) => {
          console.log("\nFrom routeTest.js - loginUser, eSource message", mes, typeof(mes))

          esMeter(mes, user.name);
          

          fs.appendFileSync(MAIN_HANDLE_NAME, `\n${user.name} EVENT SOURCE ${new Date().toString()}\n${JSON.stringify(mes)}\n`)
          

          fs.appendFileSync(`${user.name}.txt`, `\nEVENT SOURCE ${new Date().toString()}\n${JSON.stringify(mes)}\n`)

          res(mes);
        }
      }),
      new Promise((res,rej) => {
        eSource.onerror = (err) => {
          console.log("\nFrom routeTest.js - loginUser, eSource error", err);

          esMeter(err, user.name);

          fs.appendFileSync(MAIN_HANDLE_NAME, `\n${user.name} EVENT SOURCE ERROR ${new Date().toString()}\n${JSON.stringify(err)}\n`)

          fs.appendFileSync(`${user.name}.txt`, `\nEVENT SOURCE ERROR ${new Date().toString()}\n${JSON.stringify(err)}\n`)

          res(err);
        }
      })
    ])

    return loggedInTU;
  } catch (e) { throw e; }
}


const timeoutPromise = () => {
  return new Promise((res, rej) => {
    setTimeout(()=>{
      console.log("test");
      res("done!");
    }, 5000)
  });
}

const test = async() => {
  // let x = await Promise.resolve(timeoutPromise);
  try {
    let x = await timeoutPromise();
    console.log("should be done");
    return x; 
  } catch(e) {
    console.log(e);
  }
}

// working
const getIndexTest = async () => { 
  try {
    let res = await axios.get('http://localhost:3001/');
    return res.data;
  } catch(e) {
    return e;
  }
}

// working
const newUserTest = async () => {
  return await createUserAndLog('testuser', {
    name: "TestUser",
    email: "testUser@aol.com",
    password: "abcdefg123!@#",
  })
}

// working
const confirmUserTest = async () => {
  try {
    let user = await createUserAndLog('testuser', {
      name: "TestUser",
      email: "testUser@aol.com",
      password: "abcdefg123!@#",
    })

    console.log(`\nFrom routeTest.js - confirmUserTest: user created:`, user);

    let resp = await confirmUser(user);
    return resp.data;

  } catch(e) {
    console.error(e);
  }
}

const loginUserTest = async () => {
  let tu = await createUserAndLog('testuser', {
    name: "TestUser",
    email: "testUser@aol.com",
    password: "abcdefg123!@#",
  });

  return await loginUser(tu)
}

const newThreadTest = async () => {

  let [testuser, testuser1] = await Promise.all([
    createUserAndLog('testuser', { 
      name: "TestUser",
      email: "testUser@aol.com",
      password: "abcdefg123!@#",
    }),
    createUserAndLog('testuser1', {
      name: "TestUser1",
      email: "testUser1@aol.com",
      password: "asdfgh3456#$%",
    })
  ]);

  // need to log testuser in
  let res = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/users/login', {
    email: testuser.email,
    password: testuser.cleanPassword
  })

  let loggedInTU = res.data.user;
  loggedInTU.cleanPassword = testuser.cleanPassword;
  loggedInTU.token = res.headers['set-cookie'].find(sc => sc.slice(0,4) === "JWT=");

  console.log(`\nFrom tests/router tests/routeTest.js: newThreadTest, logged in testUser - ${JSON.stringify(loggedInTU)}`)

  let request = await (postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/newThread', { 
    threadObj: {
      participants: [testuser._id, testuser1._id],
      chatType: "CHAT"
    }
  }, {
    headers: {
      Cookie: loggedInTU.token
    }
  }));

  return request.data;

}

const befriendRequestTest = async () => {
  try {
    let [testuser, testuser1] = await Promise.all([
      createUserAndLog('testuser', { 
        name: "TestUser",
        email: "testUser@aol.com",
        password: "abcdefg123!@#",
      }),
      createUserAndLog('testuser1', {
        name: "TestUser1",
        email: "testUser1@aol.com",
        password: "asdfgh3456#$%",
      })
    ]);

    [testuser, testuser1] = await Promise.all([
      loginUser(testuser),
      loginUser(testuser1)
    ]);

    let threadRequest = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/newThread', { 
      threadObj: {
        participants: [testuser._id, testuser1._id],
        chatType: "CHAT"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    let thread = threadRequest.data;

    let bfReqMessage = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/new', {
      message: {
        sender: testuser._id,
        threadIds: [thread._id],
        messageType: 'BEFRIEND_REQUEST',
        text: "Let's be friends!"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    // await message
    await eventAwait(5, 6);

    return bfReqMessage.data;

  } catch(e) {
    throw e;
  }
}

const getMessagesTest = async () => {
  try {
    let [testuser, testuser1] = await Promise.all([
      createUserAndLog('testuser', { 
        name: "TestUser",
        email: "testUser@aol.com",
        password: "abcdefg123!@#",
      }),
      createUserAndLog('testuser1', {
        name: "TestUser1",
        email: "testUser1@aol.com",
        password: "asdfgh3456#$%",
      })
    ]);

    [testuser, testuser1] = await Promise.all([
      loginUser(testuser),
      loginUser(testuser1)
    ]);

    let threadRequest = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/newThread', { 
      threadObj: {
        participants: [testuser._id, testuser1._id],
        chatType: "CHAT"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    let thread = threadRequest.data;

    let bfReqMessage = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/new', {
      message: {
        sender: testuser._id,
        threadIds: [thread._id],
        messageType: 'BEFRIEND_REQUEST',
        text: "Let's be friends!"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    let [testuserMessageReq, testuser1MessageReq] = await Promise.all([
      getWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/', {
        headers: {
          Cookie: testuser.token
        }
      }),
      getWrapper(`${testuser1.name}.txt`, 'http://localhost:3001/messages/', {
        headers: {
          Cookie: testuser1.token
        }
      })
    ])

    return testuserMessageReq.data;

  } catch(e) {
    throw e;
  }
}

const befriendAcceptTest = async () => {
  try {
    let [testuser, testuser1] = await Promise.all([
      createUserAndLog('testuser', { 
        name: "TestUser",
        email: "testUser@aol.com",
        password: "abcdefg123!@#",
      }),
      createUserAndLog('testuser1', {
        name: "TestUser1",
        email: "testUser1@aol.com",
        password: "asdfgh3456#$%",
      })
    ]);

    [testuser, testuser1] = await Promise.all([
      loginUser(testuser),
      loginUser(testuser1)
    ]);

    let threadRequest = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/newThread', { 
      threadObj: {
        participants: [testuser._id, testuser1._id],
        chatType: "CHAT"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    let thread = threadRequest.data;

    let bfReqMessage = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/new', {
      message: {
        sender: testuser._id,
        threadIds: [thread._id],
        messageType: 'BEFRIEND_REQUEST',
        text: "Let's be friends!"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    // accept friend request
    let bfAccMessage = await postWrapper(`${testuser1.name}.txt`, 'http://localhost:3001/messages/new', {
      message: {
        sender: testuser1._id,
        origMessage: bfReqMessage.data._id,
        
        threadIds: bfReqMessage.data.threadIds,
        text: "Friends we shall be",
        messageType: Controls.BEFRIEND_ACCEPT,
      }
    }, {
      headers: {
        Cookie: testuser1.token
      }
    })

    await eventAwait(5,6)
    // placeholder return
    return bfAccMessage.data;
    // confirm that users are friends

  } catch(e) {
    throw e;
  }
}

const befriendRejectTest = async () => {
  try {
    let [testuser, testuser1] = await Promise.all([
      createUserAndLog('testuser', { 
        name: "TestUser",
        email: "testUser@aol.com",
        password: "abcdefg123!@#",
      }),
      createUserAndLog('testuser1', {
        name: "TestUser1",
        email: "testUser1@aol.com",
        password: "asdfgh3456#$%",
      })
    ]);

    [testuser, testuser1] = await Promise.all([
      loginUser(testuser),
      loginUser(testuser1)
    ]);

    let threadRequest = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/newThread', { 
      threadObj: {
        participants: [testuser._id, testuser1._id],
        chatType: "CHAT"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    let thread = threadRequest.data;

    let bfReqMessage = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/new', {
      message: {
        sender: testuser._id,
        threadIds: [thread._id],
        messageType: 'BEFRIEND_REQUEST',
        text: "Let's be friends!"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    // reject friend request
    let bfRejMessage = await postWrapper(`${testuser1.name}.txt`, 'http://localhost:3001/messages/new', {
      message: {
        sender: testuser1._id,
        origMessage: bfReqMessage.data._id,  
        threadIds: bfReqMessage.data.threadIds,
        text: "I'll never join you",
        messageType: Controls.BEFRIEND_REJECT,
      }
    }, {
      headers: {
        Cookie: testuser1.token
      }
    })

    await eventAwait(5,6)
    // placeholder return
    return bfRejMessage.data;
    // confirm that users are friends

  } catch(e) {
    throw e;
  }
}

const endFriendshipTest = async () => {
  try {
    let [testuser, testuser1] = await Promise.all([
      createUserAndLog('testuser', { 
        name: "TestUser",
        email: "testUser@aol.com",
        password: "abcdefg123!@#",
      }),
      createUserAndLog('testuser1', {
        name: "TestUser1",
        email: "testUser1@aol.com",
        password: "asdfgh3456#$%",
      })
    ]);

    [testuser, testuser1] = await Promise.all([
      loginUser(testuser),
      loginUser(testuser1)
    ]);

    let threadRequest = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/newThread', { 
      threadObj: {
        participants: [testuser._id, testuser1._id],
        chatType: "CHAT"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    let thread = threadRequest.data;

    let bfReqMessage = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/new', {
      message: {
        sender: testuser._id,
        threadIds: [thread._id],
        messageType: 'BEFRIEND_REQUEST',
        text: "Let's be friends!"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    // accept friend request
    let bfAccMessage = await postWrapper(`${testuser1.name}.txt`, 'http://localhost:3001/messages/new', {
      message: {
        sender: testuser1._id,
        origMessage: bfReqMessage.data._id,
        threadIds: bfReqMessage.data.threadIds,
        text: "Friends we shall be",
        messageType: Controls.BEFRIEND_ACCEPT,
      }
    }, {
      headers: {
        Cookie: testuser1.token
      }
    })

    let endFriendshipMes = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/new', {
      message: {
        sender: testuser._id,
        threadIds: [bfReqMessage.data.threadIds],
        text: "Lol psych FU",
        messageType: Controls.END_FRIENDSHIP
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    })

    await eventAwait(5,8)
    // placeholder return
    return endFriendshipMes.data;
    // confirm that users are friends

  } catch(e) {
    throw e;
  }
}

const textMessageTest = async () => {
  try {
    let [testuser, testuser1] = await Promise.all([
      createUserAndLog('testuser', { 
        name: "TestUser",
        email: "testUser@aol.com",
        password: "abcdefg123!@#",
      }),
      createUserAndLog('testuser1', {
        name: "TestUser1",
        email: "testUser1@aol.com",
        password: "asdfgh3456#$%",
      })
    ]);

    [testuser, testuser1] = await Promise.all([
      loginUser(testuser),
      loginUser(testuser1)
    ]);

    let threadRequest = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/newThread', { 
      threadObj: {
        participants: [testuser._id, testuser1._id],
        chatType: "CHAT"
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    let thread = threadRequest.data;

    let textMessage = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/messages/new', {
      message: {
        sender: testuser._id,
        threadIds: [thread._id],
        text: "Bert do ya know me?",
        messageType: Controls.TEXT_ONLY
      }
    }, {
      headers: {
        Cookie: testuser.token
      }
    });

    await eventAwait(5, 4);
    return textMessage.data;


  } catch(e) {
    throw e;
  }
}

const newCampaignTest = async () => {
  try {
    let [testuser, testuser1] = await Promise.all([
      createUserAndLog('testuser', { 
        name: "TestUser",
        email: "testUser@aol.com",
        password: "abcdefg123!@#",
      }),
      createUserAndLog('testuser1', {
        name: "TestUser1",
        email: "testUser1@aol.com",
        password: "asdfgh3456#$%",
      })
    ]);

    [testuser, testuser1] = await Promise.all([
      loginUser(testuser),
      loginUser(testuser1)
    ]);

    // begin campaign stuff
    let newCampaign = await postWrapper(`${testuser.name}.txt`, 'http://localhost:3001/campaigns/new', {campaignObj: {
      name: "The View From The Lighthouse",
      createdBy: testuser._id,
      description: "",
      dm: [testuser._id],
      game: "Mouths of Thayer",
      invitedPlayers: [testuser1._id],
      // threadId should be dynamically created by Controls.newCampaign
    }}, {
      headers: {
        Cookie: testuser.token
      }
    })

    // end campaign stuff

    // 5 seconds, 3 events
    await eventAwait(5, 3);
    return newCampaign.data;

    // NOTE: this currently allows for invited players, but does not handle an actual campaign invitation. This should either be handled in Controls.js -

  } catch(e) {
    throw e;
  }
}

const campaignInviteTest = async () => {
  // stub
}

const campaignInviteAcceptTest = async () => {
  // stub
}

const campaignInviteRejectTest = async () => { 
  // stub
}

const exitCampaignTest = async () => {
  // stub
}

const removeFromCampaignTest = async () => {
  // stub
}

const promoteToDmTest = async () => {
  // stub
}

const stepDownDmTest = async () => {
  // stub
}

const roomInviteTest = async () => {
  // stub
}

const roomInviteAcceptTest = async () => {
  // stub
}

const roomInviteRejectTest = async () => {
  // stub
}

const newHandoutTest = async () => {
  // stub
}

const editHandoutTest = async () => {
  // stub
}

const newJournalEntryTest = async () => {
  // stub
}

const editJournalEntryTest = async () => {
  // stub
}

const newIndexEntryTest = async () => {
  // stub
}

const editIndexEntryTest = async () => { 
  // stub
}


const TESTS  = [
  {
    flag: "-getIndexTest",
    func: getIndexTest
  },
  {
    flag: "-newUser",
    func: newUserTest
  },
  {
    flag: "-confirmUser",
    func: confirmUserTest
  },
  {
    flag: "-loginUser",
    func: loginUserTest
  },
  {
    flag: "-newThread",
    func: newThreadTest
  },
  {
    flag: "-befriendRequest",
    func: befriendRequestTest
  },
  {
    flag: "-getMessages", 
    func: getMessagesTest
  },
  {
    flag: "-befriendAccept",
    func: befriendAcceptTest
  },
  {
    flag: "-befriendReject",
    func: befriendRejectTest
  },
  {
    flag: "-endFriendship",
    func: endFriendshipTest
  },
  {
    flag: "-textMessage",
    func: textMessageTest
  },
  {
    flag: "-newCampaign",
    func: newCampaignTest
  },
  {
    flag: "-campaignInvite",
    func: campaignInviteTest
  },
  {
    flag:"-campaignInviteAccept",
    func: campaignInviteAcceptTest
  },
  {
    flag: "-campaignInviteReject",
    func: campaignInviteRejectTest
  },
  {
    flag: "-exitCampaign",
    func: exitCampaignTest
  },
  {
    flag: "-removeFromCampaign",
    func: removeFromCampaignTest
  },
  {
    flag: "-promoteToDm",
    func: promoteToDmTest
  },
  {
    flag: "-stepDownDm",
    func: stepDownDmTest
  },
  {
    flag: "-roomInvite", 
    func: roomInviteTest
  },
  {
    flag: "-roomInviteAccept", 
    func: roomInviteAcceptTest
  },
  {
    flag: "-roomInviteReject", 
    func: roomInviteRejectTest
  },
  {
    flag: "-newHandout", 
    func: newHandoutTest
  },
  {
    flag: "-editHandout", 
    func: editHandoutTest
  },
  {
    flag: "-newJournalEntry", 
    func: newJournalEntryTest
  },
  {
    flag: "-editJournalEntry", 
    func: editJournalEntryTest
  },
  {
    flag: "-newIndexEntry", 
    func: newIndexEntryTest
  },
  {
    flag: "-editIndexEntry",
    func: editIndexEntryTest 
  }  
]

const ALL_FLAGS = TESTS.map(i => i.flag)


// log arguments, get "http:localhost:3001/"
const getTest = async () => {
  try {
    let flags = process.argv.filter(arg => arg[0] === "-");

    if (ALL_FLAGS.includes(flags[0])) {
      let test = TESTS.find(test => test.flag === flags[0]);
      console.log(`\nFrom test/router tests/routeTest.js - getTest, Running Test: ${test.flag}`)

      return test["func"]();
    } else {
      return "Unrecognized flag";
    }
    
    
    // for (let flag of ALL_FLAGS) {
    //   let strippedFlag = flag.slice(1,);
    //   console.log(`const ${strippedFlag}Test = async () => { \n    // stub \n}\n`);
    // }
    
    
    // let res = await axios.get('http://localhost:3001');
    // return res.data;
  } catch(e) {
    return e;
  }
  
}

app.start(getTest, E_SOURCE_ARR);