const UserAnswer = require('../models/UserAnswer');
const Quiz = require('../models/Quiz');
const Answer = require('../models/Answer');

// ✅ Submit answer
exports.submitAnswer = async (req, res) => {
  try {
    const { userID, quizID, questionID, answerID } = req.body;

    if (!userID || !quizID || !questionID || !answerID) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const session = await Quiz.findById(quizID);
    if (!session) return res.status(404).json({ error: "Quiz not found" });

    // Add question to answered list (avoid duplicates)
    if (!session.answered.includes(questionID)) {
      session.answered.push(questionID);
      await session.save();
    }

    // ✅ Check if the chosen answer is correct
    const chosenAnswer = await Answer.findOne({ _id: answerID, questionID });
    if (!chosenAnswer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    const isCorrect = chosenAnswer.isCorrect;

    // ✅ Create or update the user's answer
    const userAnswer = await UserAnswer.findOneAndUpdate(
      { userID, quizID, questionID },
      { answerID, correct: isCorrect },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: 'Answer submitted successfully',
      correct: isCorrect,
      reason: chosenAnswer.reason || "",
      response: userAnswer
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// ✅ Create or update attempt explicitly
exports.createOrUpdateAttempt = async (req, res) => {
  try {
    const { userID, quizID, questionID, answerID } = req.body;

    if (!userID || !quizID || !questionID || !answerID) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // ✅ Check correctness directly from Answer
    const chosenAnswer = await Answer.findOne({ _id: answerID, questionID });
    if (!chosenAnswer) {
      return res.status(404).json({ error: "Answer not found" });
    }
    const isCorrect = chosenAnswer.isCorrect;

    // Check if attempt exists
    let existingResponse = await UserAnswer.findOne({ userID, quizID, questionID });

    if (existingResponse) {
      existingResponse.answerID = answerID;
      existingResponse.correct = isCorrect;
      await existingResponse.save();

      return res.status(200).json({
        message: 'Attempt updated successfully',
        correct: isCorrect,
        reason: chosenAnswer.reason || "",
        response: existingResponse
      });
    } else {
      const newResponse = new UserAnswer({
        userID,
        quizID,
        questionID,
        answerID,
        correct: isCorrect
      });

      const savedResponse = await newResponse.save();

      return res.status(201).json({
        message: 'Attempt created successfully',
        correct: isCorrect,
        reason: chosenAnswer.reason || "",
        response: savedResponse
      });
    }
  } catch (error) {
    console.error('Error processing attempt:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// ✅ Get recent last 10 attempts by userId
exports.getRecentAttempts = async (req, res) => {
  try {
    const { userID } = req.params;

    const attempts = await UserAnswer.find({ userID })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({
        path: 'questionID',
        select: 'title'
      })
      .populate({
        path: 'answerID',
        select: 'title reason isCorrect'
      });

    const formatted = attempts.map(attempt => ({
      attemptID: attempt._id,
      questionID: attempt.questionID?._id,
      questionTitle: attempt.questionID?.title,
      answerID: attempt.answerID?._id,
      answerTitle: attempt.answerID?.title,
      reason: attempt.answerID?.reason || "",
      questionTags : attempt.questionID?.tags || [],
      correct: attempt.correct
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching recent attempts:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};
