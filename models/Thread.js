const mongoose = require('mongoose');

const Thread = new mongoose.Schema({
  participants: {
    required: true,
    type: [mongoose.Types.ObjectId]
  },
  chatType: {
    type: String,
    required: true,
    enum: ["CHAT", "ROOM", "CAMPAIGN"]
  },
  campaignId: {
    required: false,
    type: mongoose.Types.ObjectId
  },
  name: {
    type: String,
    required: false
  }
})

module.exports = mongoose.model('Thread', Thread);