const UserAnswer = require('../models/UserAnswer');
const Solution = require('../models/Solution');

exports.createOrUpdateAttempt = async (req, res) => {
  try {
    const { userID, quizID, questionID, answerID } = req.body;

    if (!userID || !quizID || !questionID || !answerID) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Determine correctness
    const isCorrect = await Solution.exists({ questionID, answerID });

    // Check for existing attempt
    let existingResponse = await UserAnswer.findOne({ userID, quizID, questionID });

    if (existingResponse) {
      // Update existing attempt
      existingResponse.answerID = answerID;
      existingResponse.correct = !!isCorrect;
      await existingResponse.save();

      return res.status(200).json({
        message: 'Attempt updated successfully',
        correct: !!isCorrect,
        response: existingResponse
      });
    } else {
      // Create new attempt
      const newResponse = new UserAnswer({
        userID,
        quizID,
        questionID,
        answerID,
        correct: !!isCorrect
      });

      const savedResponse = await newResponse.save();

      return res.status(201).json({
        message: 'Attempt created successfully',
        correct: !!isCorrect,
        response: savedResponse
      });
    }
  } catch (error) {
    console.error('Error processing attempt:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//get recent last 10 questions and thier answers by userId


exports.getRecentAttempts = async (req, res) => {
  try {
    const { userID } = req.params;

    const attempts = await UserAnswer.find({ userID })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({
        path: 'questionID',
        select: 'title'
      });

    const formatted = attempts.map(attempt => ({
      attemptID: attempt._id,
      questionID: attempt.questionID._id,
      questionTitle: attempt.questionID.title,
      answerID: attempt.answerID,
      correct: attempt.correct
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching recent attempts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
