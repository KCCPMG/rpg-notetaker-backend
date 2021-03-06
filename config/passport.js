const LocalStrategy = require('passport-local');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {ExtractJwt} = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;

const User = require('../models/User.js');

// dotenv config carries over from the file that calls this one
// console.log(process.env.JWT_SECRET);


passport.use('login', new LocalStrategy((email, password, done) => {
  User.findOne({email: email}, (err, user) => {
    if (err) return done(err);
    if (!user) {
      return done(null, false, {message: "Email address not found"})
    } else {
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, {message: "Incorrect password"})
        }
      })
    }
  })
}))

passport.use('jwt', new JwtStrategy(
  {
    // jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
    // jwtFromRequest: req ? req.cookies['JWT'] || null : null,
    jwtFromRequest: ExtractJwt.fromExtractors([(req) => {
      if (req) {
        console.log("\nFrom config/passport.js - passport.use('jwt'), req.cookies:", req.cookies);
        return req.cookies['JWT'] || null;
      } else return null;
    }]),
    secretOrKey: process.env.JWT_SECRET
  }, (jwt_payload, done) => {
    // console.log(req.cookies);
    // console.log(req.cookies['JWT']);
    console.log(`\nFrom config/passport.js - passport.use('jwt') \njwt_payload: ${JSON.stringify(jwt_payload)}\nid: ${JSON.stringify({id: jwt_payload.id})}`);
    // console.log(jwt_payload);
    // console.log({id: jwt_payload.id});
    User.findById(jwt_payload.id, (err, user) => {
      if (err) done(err);
      else if (!user) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  })
)