/**
 * Answer model for storing user responses to quiz questions.
 * Each response links a user, quiz, question, and answer, and indicates if the answer was correct.
 */

const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId, // or String
    required: true,
    ref: 'User'
  },
  quizID: {
    type: mongoose.Schema.Types.ObjectId, // or String
    required: true,
    ref: 'Quiz'
  },
  questionID: {
    type: mongoose.Schema.Types.ObjectId, // or String
    required: true,
    ref: 'Question'
  },
  answerID: {
    type: mongoose.Schema.Types.ObjectId, // or String
    required: true,
    ref: 'Answer'
  },
  correct: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Response', ResponseSchema);
