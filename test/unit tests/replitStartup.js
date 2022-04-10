var dotenv = require('dotenv');
var mongoose = require('mongoose');
const util = require('util');
const User = require('../../models/User.js');
const Thread = require('../../models/Thread.js');
const Message = require('../../models/Message.js');

const controls = require('../../models/Controls.js');

dotenv.config({
  path: '../../.env'
})

const deepPrint = (obj) => {
  console.log(util.inspect(obj, {
    showHidden: false,
    depth: null,
    colors: true
  }))
}

const dbstring = "mongodb://localhost:27017/RolePlayingBaseTest?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false"



startup = async() => {
  mongoose.connect(dbstring, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useFindAndModify: false
  })
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, "connection error: "))
  db.once('open', async ()=> {
    console.log("Connection Open");
    await Promise.all([
      User.deleteMany({}), 
      Thread.deleteMany({}),
      Message.deleteMany({})
    ])
    console.log("Finished Delete, ready to proceed");
  })
}

module.exports = {User, Thread, Message, controls, deepPrint, startup}