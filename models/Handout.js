const mongoose = require('mongoose');

const Handout = new mongoose.Schema({
  createdBy: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  createdOn: {
    type: Date,
    default: new Date(),
    // required: true
  },
  campaignId: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  editedBy: {
    type: mongoose.Types.ObjectId,
    required: false
  },
  editedOn: {
    type: Date,
    required: false
  },
  handoutTitle: {
    type: String,
    required: true
  },
  image: {
    type: Buffer,
    required: true
  },
  description: {
    type: String
  },
  notes: {
    type: [{
      position: {
        required: true,
        type: {
          x: Number,
          y: Number
        }
      }, 
      text: {
        type: String,
        required: true,
        default: ''
      }
    }]
  }
});

module.exports = mongoose.model('Handout', Handout);
