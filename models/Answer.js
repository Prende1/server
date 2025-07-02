/**
 * Answer model for storing answer options to quiz questions.
 * Each answer is linked to a specific question and includes a title and reason.
 */

const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  reason: {
    type: String
  }
}, { timestamps: true });

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;
