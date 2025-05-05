// const axios = require('axios');

// Function to Generate Quiz
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const Solution = require("../models/Solution");

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { default: mongoose } = require("mongoose");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
  },
});

const generateQuiz = async (req, res) => {
  const { prompt, category, difficulty } = req.body;

  if (!prompt || !category || !difficulty) {
    return res
      .status(400)
      .json({ error: "Prompt, category, and difficulty are required" });
  }

  try {
    const inputPrompt = `Generate an English vocabulary quiz.
        - The topic is: ${prompt}.
        - Create 5 multiple-choice questions.
        - Each question should ask about a word's meaning, synonyms, antonyms, or usage in a sentence.
        - Each question must have 4 answer choices.
        - Clearly mark the correct answer and provide a brief explanation for it.
        - Also, generate a small hint that gives a subtle clue about the answer.
        - Return the output in a structured JSON format:
          {
            "questions": [
              {
                "question": "What does 'ephemeral' mean?",
                "hint": "Think about something that doesn't last long.",
                "choices": [
                  {"title": "Temporary", "correct": true, "reason": "Ephemeral means short-lived or temporary."},
                  {"title": "Loud", "correct": false},
                  {"title": "Strong", "correct": false},
                  {"title": "Bright", "correct": false}
                ]
              }
            ]
          }`;

    // Generate response from model
    const result = await model.generateContent({
      contents: [{ parts: [{ text: inputPrompt }] }],
    });

    let responseText = result.response.candidates[0].content.parts[0].text;
    responseText = responseText.replace(/```json|```/g, "").trim();
    const quizData = JSON.parse(responseText);

    // Create a new quiz entry
    const newQuiz = await Quiz.create({ title: prompt, category, difficulty });

    // Prepare question, answer, and solution arrays
    let questionsToInsert = [];
    let answersToInsert = [];
    let solutionsToInsert = [];

    quizData.questions.forEach((q, index) => {
      const questionID = new mongoose.Types.ObjectId();

      questionsToInsert.push({
        _id: questionID,
        quizID: newQuiz._id,
        position: index + 1,
        title: q.question,
        hint: q.hint || "",
      });

      q.choices.forEach((choice) => {
        const answerID = new mongoose.Types.ObjectId();
        answersToInsert.push({
          _id: answerID,
          questionID,
          title: choice.title,
          reason: choice.reason || "",
        });

        if (choice.correct) {
          solutionsToInsert.push({
            questionID,
            answerID,
            reason: choice.reason || "",
          });
        }
      });
    });

    // Insert all data in bulk
    await Question.insertMany(questionsToInsert);
    await Answer.insertMany(answersToInsert);
    if (solutionsToInsert.length > 0) {
      await Solution.insertMany(solutionsToInsert);
    }

    res.json({ message: "Quiz Created Successfully", quizID: newQuiz._id });
  } catch (error) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: "Error generating quiz", details: error.message });
  }
};



const getAllQuizzes = async (req, res) => {
  const quizzes = await Quiz.find({}, "title"); // Fetch only quiz titles
  res.json(quizzes);
};

const getQuizById = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  res.json(quiz);
};

const getQuestionsWithAnswers = async (req, res) => {
  try {
    const { quizID } = req.params;
    const questions = await Question.find({ quizID }).lean();

    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await Answer.find({ questionID: question._id }).lean();
        const solution = await Solution.findOne({ questionID: question._id });

        return {
          ...question,
          answers,
          correctAnswerId: solution?.answerID?.toString() || null,
        };
      })
    );

    res.json({ questions: questionsWithAnswers });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Error fetching questions", details: error.message });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const { quizID } = req.params;

    // Step 1: Delete the Quiz
    const deletedQuiz = await Quiz.findByIdAndDelete(quizID);
    if (!deletedQuiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Step 2: Find all questions related to this quiz
    const questions = await Question.find({ quizID });

    if (questions.length > 0) {
      const questionIDs = questions.map((q) => q._id);

      // Step 3: Delete related Answers and Solutions
      await Answer.deleteMany({ questionID: { $in: questionIDs } });
      await Solution.deleteMany({ questionID: { $in: questionIDs } });

      // Step 4: Delete all Questions
      await Question.deleteMany({ quizID });
    }

    res.json({ message: "Quiz and related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ error: "Error deleting quiz", details: error.message });
  }
};


module.exports = { generateQuiz, getAllQuizzes, getQuizById, getQuestionsWithAnswers, deleteQuiz };
