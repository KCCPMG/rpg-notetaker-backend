const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const {issueToken, checkToken} = require('../config/authentication')
var router = express.Router();

const SALT_ROUNDS = 10;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/getUser/:userId', checkToken, (req, res) => {
  User.findById(req.params.userId, (err, user) => {
    if (err) {
      res.send("Something went wrong");
    } else if (!user) {
      res.send("User not found");
    } else {
      res.send({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email 
        }
      })
    }
  })
})

// working
router.post('/newUser', async (req, res) => {
  try {

    // for testing
    // console.log("\nFrom user.js /newUser: req.body:\n", req.body);

    let user = new User({
      name: req.body.userObj.name,
      email: req.body.userObj.email,
      password: req.body.userObj.password,
      confirmed: false
    })

    let [nameCheck, emailCheck, salt] = await Promise.all([
      User.exists({name: user.name}),
      User.exists({email: user.email}),
      bcrypt.genSalt(SALT_ROUNDS)
    ])

    // need to encrypt password, save user
    user.password = bcrypt.hashSync(user.password, salt);

    await user.save();

    let returnObj = {
      response: {},
      ntfObj: {}
    }
    
    if (nameCheck && !emailCheck) {
      returnObj.response = { errorMessage: ""};
    } else if (!nameCheck && emailCheck) {
      returnObj.response = { errorMessage: ""};
    } else if (nameCheck && emailCheck) {
      returnObj.response = { errorMessage: ""};
    } else {
      // returnObj.response = { user }
      // delete returnObj.response.user.password;
      // console.log(returnObj.response.user);
      returnObj.response = {user: {}}
      Object.keys(user._doc).forEach(k => {
        // console.log(k, user[k])
        if (k!=="password") returnObj.response.user[k] = user[k];
      });
    }

    res.send(returnObj.response);

  } catch(e) {

    console.log("\nWithin user.js /newUser: error\n", e);
    res.send("Something went wrong, please try again later");
  
  }
})


// defunct - see router.post('/newUser')
router.post('/register', (req, res) => {
  console.log("register", req.body);

  let user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmed: false,
    date: new Date()
  })

  let nameCheckPromise = User.exists({name: user.name})
  let emailCheckPromise = User.exists({email: user.email})
  let saltPromise = bcrypt.genSalt(SALT_ROUNDS);

  Promise.all([nameCheckPromise, emailCheckPromise, saltPromise]).then(vals => {
    let nameCheck = vals[0];
    let emailCheck = vals[1];
    let salt = vals[2];

    if (nameCheck && !emailCheck) res.send("Name Taken")
    else if (!nameCheck && emailCheck) res.send("Email Taken")
    else if (nameCheck && emailCheck) res.send("Name and Email Taken")
    else {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        user.save((err) => {
          if (err) res.send("Something went wrong");
          else res.send("User Created");
        })
      })
    }
  }).catch(err => {
    console.log(err);
    res.send("Something went wrong, please try again later.");
  })
})


router.post('/confirmUser/:userId', async (req, res) => {
  console.log(`\nFrom users.js - router.post(/confirmUser/:userId): \nincoming post for ${req.params.userId}, (${typeof req.params.userId})`);
  try {

    User.findById(req.params.userId, (err, user) => {
      if (err) throw err;
      else if (!user) res.send("User not found");
      else {
        if (user.confirmed) {
          res.send("User already confirmed")
        } else if (user.email !== req.body.email) {
          res.send("Incorrect email");
        } else {
          bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
            if (err) throw err;
            else if (isMatch) {

              user.confirmed = true;
              user.save((err) => {
                if (err) throw err;
                else res.send("User confirmed");
              })
              
              
            }
            else res.send("Incorrect password");
          })
        }
      } 
    })
  } catch(e) {
    console.log(e);
    res.send("Something went wrong");
  }
})


router.post('/login', (req, res) => {
  console.log(`\nFrom users.js - router.post(/login/:userId):\nreq.body.email: ${req.body.email}\nreq.body:`, req.body)
  // console.log(req.body.email);
  // console.log(req.body);
  User.findOne({email: req.body.email}, (err, user) => {
    console.log(user);
    if (err) res.send("Something went wrong");
    else if (!user) res.send("User not found");
    else {

      // Validate to make sure friends are included
      /* 
      console.log("Validating"); 
      let friendErrors = user.validateSync("friends");
      if (friendErrors) {
        console.log("Errors" + JSON.stringify(friendErrors));
      } else {
        console.log("Friends" + JSON.stringify(user.friends));
      }
      console.log(user);
      */

      bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
        if (err) {
          console.log(err);
          res.send("Something went wrong");
        } else if (isMatch) {
          req.user = user;
          
          // let copiedUser = Object.assign({}, user);
          // delete copiedUser.password;
          // console.log(copiedUser);

          // console.log("res.data", res.data);
          res.data = {};
          // console.log("res.data", res.data);
          res.data.user = {};

          // console.log("\n\nGo through keys\n\n");
          Object.keys(user._doc).forEach(k => {
            // console.log(k, user[k])
            if (k!=="password") res.data.user[k] = user[k];
          });

          // console.log(res.data.user);

          // res.data = {user};
          // console.log(res.data);
          // console.log(res.data.user.password);
          // console.log(delete res.data.user.password);
          // console.log(res.data.user.password);

          res.data.auth = true;

          issueToken(req, res, () => {
            // console.log("Headers:", res);
            res.send(res.data);
          })
        }
        else {
          console.log(user, req.body.password);
          res.send("Incorrect password");
        }
      })
    }
  })
})

const preCheck = function(req, res, next) {
  console.log("precheck", req.headers.authorization);
  next();
}

router.get('/checkTokenTest', preCheck, checkToken, (req, res) => {
  // console.log('inside route', {auth: req.headers.Authorization})
  // res.send(("Made it to the end" + req.user.id));
  res.data.message = "Made it to the end";
  res.data.userId = req.user.id;
  res.send(res.data);
})

router.get('/checkCookie', checkToken, (req, res) => {
  console.log('incoming');
  User.findById(req.user.id, (err, user) => {
    if (err) {
      console.log(err);
      res.data.userId = req.user.id || null;
      res.send(res.data);
      console.log('\n');
    } else if (!user) {
      res.data.userId = req.user.id || null;
      console.log('no user found');
      console.log(res.data);
      res.send(res.data);
      console.log('\n');
    } else {
      res.data.userId = req.user.id;
      res.data.user = user;
      delete res.data.user.password;
      console.log('user found');
      // console.log(res.data);
      res.send(res.data);
      console.log('\n');
    }
  })
  
  
})


router.get('/getPeople', checkToken, (req, res) => {
  // console.log("incoming search")
  
  // console.log(`Incoming search for ${JSON.stringify(req.query)}`);
  let searchRe = new RegExp(req.query.searchTerm, 'gi');
  // console.log(`As Regular Expression ${searchRe.toString()}`)
  User.find({$or: 
    [
      {"name": searchRe}, 
      {"email": searchRe}
    ]
  }, (err, foundUsers) => {
    if (err){
      console.log(err);
      res.send("Something went wrong")
    } else if (!foundUsers) {
      console.log("No users found")
      res.send("No users found");
    } else {
      let sanitizedUsers = foundUsers.map(fu => {
        return {id: fu._id, name: fu.name, email: fu.email}
      });
      res.send({people: sanitizedUsers});
    }
  })
})

// wtf is this doing here - 'new_campaign' route in campaigns.js, this should be purely extra
router.post('/newCampaign', checkToken, (req, res)=>{
  let name = req.body.name;
  let campaign = new Campaign({name});
  campaign.save((err) => {
    if (err) res.send("Something went wrong");
    else res.send(campaign.id);
  })
})


module.exports = router;
