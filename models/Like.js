const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    ref: 'User',
  },
  questionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  },
  answerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
  },
  like: {
    type: Boolean, // true = like, false = dislike
    required: true,
  },
}, { timestamps: true });

// Ensure one reaction per user per target (question or answer)
likeSchema.index({ userID: 1, questionID: 1 }, { unique: true, partialFilterExpression: { questionID: { $exists: true } } });
likeSchema.index({ userID: 1, answerID: 1 }, { unique: true, partialFilterExpression: { answerID: { $exists: true } } });

module.exports = mongoose.model('Like', likeSchema);
