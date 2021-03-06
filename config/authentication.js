const jwt = require('jsonwebtoken');
const passport = require('passport');
require ('./passport');

issueToken = (req, res, next) => {
  console.log("\nFrom config/authentication.js - issueToken\nIssuing Token to: " + req.user.id);
  res.cookie('JWT', jwt.sign({
    auth: true, id: req.user.id
  }, process.env.JWT_SECRET), {
    // httpOnly set to false ONLY FOR TESTING
    // httpOnly: true
    httpOnly: false
  })
  next();
  
}

// Sets res.user to user, issues new token
checkToken = (req, res, next) => {
  console.log(`\nFrom config/authentication.js - checkToken, checking token`);
  res.data = {};
  passport.authenticate('jwt', (err, user, info) => {
    if (err) {
      console.log(err);
      res.data.message = "Error";
      res.data.error = err;
      res.data.auth = false;
      res.send(res.data);
    } else if (user) {
      req.user = user;
      res.data.auth = true;
      issueToken(req, res, next);
    } else {
      res.data.auth = false;
      res.send("Invalid Token");
    }
    // if (info)
    
  })(req, res, next);
}

module.exports = {issueToken, checkToken}