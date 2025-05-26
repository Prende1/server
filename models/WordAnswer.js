const mongoose = require("mongoose");

const wordAnswerSchema = new mongoose.Schema({
  wordID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Word",
    required: true,
  },
  wqID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WordQuestion",
    required: true,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  answered_by: {
    type: String, // store the username directly
    required: true,
    trim: true,
  },
  reviewed_by: {
    type: String,
    default: "AI",
  },
  num_vote: {
    type: Number,
    default: 0,
  },
  ai_score: {
    type: Number,
    default: 0, // Between 0 and 10
  },
  flag: {
    type: Boolean,
    default: false,
  },
  narrative: {
    type: String,
    enum: ["general", "professional", "academic", "casual", "technical"],
    default: "general",
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

const WordAnswer = mongoose.model("WordAnswer", wordAnswerSchema);

module.exports = WordAnswer;
