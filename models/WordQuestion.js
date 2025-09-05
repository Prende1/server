/**
 * WordQuestion model for storing questions related to words.
 * Each question is linked to a specific word and includes details about the creator, 
 * reviewer, and statistics like votes and answers.
 * This model is used to facilitate user-generated questions about words in the vocabulary application.
 */

const mongoose = require("mongoose");

const wordQuestionSchema = new mongoose.Schema({
  wordID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Word",
    required: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  created_by: {
    type: String, // store the username directly
    required: true,
    trim: true,
  },
  reviewed_by: {
    type: String, // e.g., 'gemini-2.0'
    default: "AI",
  },
  tags: {
    type: [String], // Array of tags for categorization
    default: [],
  },
  likes:{
    type: Number,
    default: 0, // Number of likes
  },
  dislikes:{
    type: Number,
    default: 0, // Number of dislikes
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
  },
});

const WordQuestion = mongoose.model("WordQuestion", wordQuestionSchema);

module.exports = WordQuestion;
