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
