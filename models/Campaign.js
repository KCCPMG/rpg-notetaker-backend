const mongoose = require('mongoose');

const Campaign = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  dm: {
    type: [mongoose.Types.ObjectId]
  },
  game: {
    type: String,
    required: false
  },
  players: {
    type: [mongoose.Types.ObjectId]
  },
  journalEntries: {
    type: [{
      id: {
        type: Number,
        required: true,
        default: 0
      },
      date: {
        type: Date,
        default: new Date()
      },
      text: {
        type: String
      }
    }]
  },
  index: {
    entries: [
      {
        term: {
          type: String,
          required: true
        },
        alternateTerms: {
          type: [String],
          required: true,
          default: []
        },
        associatedTerms: {
          type: [String],
          required: true,
          default: []
        },
        tags:  {
          type: [String],
          required: true,
          default: []
        },
        definition: {
          type: String,
          required: true
        },
        tags: {
          type: [String]
        },
        category: {
          type: String,
          enum: ["Character", "Location", "Organization", "Item", "Other"]
        }
      }
    ]
  }
})

module.exports = mongoose.model('Campaign', Campaign);