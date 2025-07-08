/**
 * Question model for storing quiz questions.
 * Each question is linked to a specific quiz and includes details like position, title, and hint.
 */

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  hint: {
    type: String
  }
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
