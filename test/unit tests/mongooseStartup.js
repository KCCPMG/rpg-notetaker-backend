// for using in node REPL
// initiate REPL using "node --experimental-repl-await"


var mongoose = require('mongoose');
controls = require('../../models/Controls.js')

const dbstring = "mongodb://localhost:27017/RolePlayingBaseTest?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false"

mongoose.connect(dbstring, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useFindAndModify: false
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error: "))
db.once('open', async function() {
  console.log("Connected to mongo");
  try {
    // Run test
  } catch(e) {
    console.log(e);
    db.close();
  }
})
module.exports.db = db;
module.exports.dbstring = dbstring;
module.exports.controlsOut = controls;