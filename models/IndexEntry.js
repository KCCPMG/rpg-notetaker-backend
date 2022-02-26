const mongoose = require('mongoose');


const altEntry = new mongoose.Schema({
  term: {
    type: String,
    maxLength: 50
  },
  idHandle: mongoose.Types.ObjectId
})

// any time that any IndexEntry term changes, all associateTerm items should be found by searching IndexEntry for associatedTerms where the idHandle is equal to the original IndexEntry _id


const IndexEntry = new mongoose.Schema({
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
  campaignId: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  term: {
    type: String,
    maxLength: 50,
    required: true
  },
  alternateTerms: {
    type: [altEntry],
    default: []
  },
  associatedTerms: {
    type: [altEntry],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  text: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ["Character", "Location", "Organization", "Item", "Other"]
  }
});

module.exports = mongoose.model('IndexEntry', IndexEntry);