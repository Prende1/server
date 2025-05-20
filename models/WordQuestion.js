const mongoose = require('mongoose');

const wordQuestionSchema = new mongoose.Schema({
  wordID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Word',
    required: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true,
  },
  reviewed_by: {
    type: String, // e.g., 'gemini-2.0'
    default: 'AI',
  },
  num_vote: {
    type: Number,
    default: 0,
  },
  num_ans: {
    type: Number,
    default: 0,
  },
  created_ts: {
    type: Date,
    default: Date.now,
  },
  updated_ts: {
    type: Date,
    default: Date.now,
  }
});

const WordQuestion = mongoose.model('WordQuestion', wordQuestionSchema);

module.exports = WordQuestion;
