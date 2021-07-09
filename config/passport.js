const LocalStrategy = require('passport-local');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {ExtractJwt} = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;

const User = require('../models/User.js');
const dotenv = require('dotenv');

dotenv.config({
  path: './.env'
})

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
      if (req) return req.cookies['JWT'] || null;
      else return null;
    }]),
    secretOrKey: process.env.JWT_SECRET
  }, (jwt_payload, done) => {
    console.log(jwt_payload);
    console.log({id: jwt_payload.id});
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