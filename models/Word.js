const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'determiner', 'article'],
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true
});

const Word = mongoose.model('Word', wordSchema);

module.exports = Word;
