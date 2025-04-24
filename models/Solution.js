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
