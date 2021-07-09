const mongoose = require('mongoose');

const Message = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  recipient: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  campaign: {
    type: mongoose.Types.ObjectId,
    required: false
  },
  lastMessage: {
    required: false,
    type: mongoose.Types.ObjectId
  },
  sendTime: {
    type: Date,
    required: true,
    default: new Date()
  },
  messageType: {
    // required: true,
    type: String,
    enum: ['BEFRIEND_REQUEST', 'BEFRIEND_ACCEPT', 'BEFRIEND_REJECT', 'END_FRIENDSHIP', 'TEXT_ONLY', 'CAMPAIGN_INVITE', 'CAMPAIGN_INVITE_ACCEPT', 'CAMPAIGN_INVITE_REJECT', 'EXIT_CAMPAIGN', 'REMOVE_FROM_CAMPAIGN'],
    // default: 'TEXT_ONLY'
  },
  response: {
    default: null,
    type: mongoose.Types.ObjectId
  },
  text: {
    type: String,
    required: false
  }
})

// alternate approach
const Message = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  thread: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  campaign: {
    type: mongoose.Types.ObjectId,
    required: false
  },
  sendTime: {
    type: Date,
    required: true,
    default: new Date()
  },
  messageType: {
    // required: true,
    type: String,
    enum: ['BEFRIEND_REQUEST', 'BEFRIEND_ACCEPT', 'BEFRIEND_REJECT', 'END_FRIENDSHIP', 'TEXT_ONLY', 'CAMPAIGN_INVITE', 'CAMPAIGN_INVITE_ACCEPT', 'CAMPAIGN_INVITE_REJECT', 'EXIT_CAMPAIGN', 'REMOVE_FROM_CAMPAIGN'],
    default: 'TEXT_ONLY'
  },
  text: {
    type: String,
    required: false
  }
})

module.exports = mongoose.model('Message', Message);


