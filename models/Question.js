const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quizID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  hint: {
    type: String
  }
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
