/**
 * QuizResult model for storing results of quizzes taken by users.
 * Each result links a quiz and a user, and includes timestamps for when the quiz was started
 */
const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
  {
    quizID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedTS: {
      type: Date,
      required: true,
    },
    endTS: {
      type: Date,
      required: true,
    },
    correct: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

const QuizResult = mongoose.model("QuizResult", quizResultSchema);

module.exports = QuizResult;
