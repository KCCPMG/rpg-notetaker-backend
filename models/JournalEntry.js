const mongoose = require('mongoose');

const JournalEntry = new mongoose.Schema({
  campaignId: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  createdBy: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  createdDate: {
    type: Date,
    default: new Date()
  },
  lastEditedBy: {
    type: mongoose.Types.ObjectId,
    required: false
  },
  lastEditedDate: {
    type: Date,
    required: false
  },
  title: {
    type: String,
    required: false
  },
  text: {
    type: String
  }
})

module.exports = mongoose.model('JournalEntry', JournalEntry)