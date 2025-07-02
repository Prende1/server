/**
 * Solution model for storing correct answers to quiz questions.
 * Each solution links a question and an answer, and may include a reason for the solution.
 */
const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
  questionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    required: true
  },
  reason: {
    type: String
  }
}, { timestamps: true });

const Solution = mongoose.model('Solution', solutionSchema);

module.exports = Solution;
