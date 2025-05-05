const QuizResult = require("../models/QuizResult");
const UserAnswer = require("../models/UserAnswer");
const Question = require("../models/Question");

exports.submitOrUpdateQuizResult = async (req, res) => {
  try {
    const { userID, quizID, startedTS, endTS } = req.body;

    if (!userID || !quizID || !startedTS || !endTS) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Count total questions in the quiz
    const totalQuestions = await Question.countDocuments({ quizID });
    if (totalQuestions === 0) {
      return res
        .status(400)
        .json({ message: "No questions found for this quiz." });
    }

    // Count correct responses
    const correct = await UserAnswer.countDocuments({
      userID,
      quizID,
      correct: true,
    });

    // Check for existing result
    let result = await QuizResult.findOne({ userID, quizID });

    if (result) {
      // Update result
      result.startedTS = startedTS;
      result.endTS = endTS;
      result.correct = correct;
      result.totalQuestions = totalQuestions;

      await result.save();

      return res.status(200).json({
        message: "Quiz result updated successfully",
        result,
      });
    } else {
      // Create new result
      const newResult = new QuizResult({
        userID,
        quizID,
        startedTS,
        endTS,
        correct,
        totalQuestions,
      });

      const savedResult = await newResult.save();

      return res.status(201).json({
        message: "Quiz result submitted successfully",
        result: savedResult,
      });
    }
  } catch (error) {
    console.error("Error processing quiz result:", error);
    res.status(500).json({ message: "Server error" });
  }
};
