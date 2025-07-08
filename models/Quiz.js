/**
 * Quiz model for storing quiz details.
 * Each quiz has a title, category, and difficulty level.
 */
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  //answered is a list of question IDs that the user has answered
  answered: {
    type: [mongoose.Schema.Types.ObjectId],//stores IDs of answered questions ie questionId
    ref: 'Question',
    default: []
  },
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
