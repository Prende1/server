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

const generateQuestions = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const inputPrompt = `Generate 10 English vocabulary multiple-choice questions about the word or topic "${prompt}".
    - Each question should ask about meaning, synonyms, antonyms, or sentence usage.
    - Each question must have 4 answer choices.
    - Mark the correct answer clearly and provide a brief explanation.
    - Also include a subtle hint for each question.
    - Assign a random difficulty: easy, medium, or hard.
    - Return the output in the following JSON format:
      {
        "questions": [
          {
            "question": "What does 'ephemeral' mean?",
            "difficulty": "easy",
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

    const result = await model.generateContent({
      contents: [{ parts: [{ text: inputPrompt }] }],
    });

    let responseText = result.response.candidates[0].content.parts[0].text;
    responseText = responseText.replace(/```json|```/g, "").trim();
    const quizData = JSON.parse(responseText);

    let questionsToInsert = [];
    let answersToInsert = [];
    let solutionsToInsert = [];

    quizData.questions.forEach((q) => {
      const questionID = new mongoose.Types.ObjectId();

      questionsToInsert.push({
        _id: questionID,
        title: q.question,
        hint: q.hint || "",
        difficulty: q.difficulty || "medium", // fallback
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

    await Question.insertMany(questionsToInsert);
    await Answer.insertMany(answersToInsert);
    if (solutionsToInsert.length > 0) {
      await Solution.insertMany(solutionsToInsert);
    }

    res.json({ message: "Questions generated successfully" });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ error: "Failed to generate questions", details: error.message });
  }
};

const startQuiz = async (req, res) => {
  const { userId, difficulty } = req.body;

  try {
    const quiz = await Quiz.create({ userId, difficulty , answered: [] });
    res.json(quiz);
  } catch (error) {
    console.error("Error starting quiz:", error);
    res.status(500).json({ error: "Failed to start quiz", details: error.message });
  }
};

const nextQuestion = async (req, res) => {
  const { quizId } = req.params;
  try {
    const session = await Quiz.findById(quizId);
    if (!session) return res.status(404).json({ error: "Quiz not found" });

    // Find next unanswered question with matching difficulty
    const question = await Question.findOne({
      _id: { $nin: session.answered },
      difficulty: session.difficulty,
    }).lean();

    if (!question) {
      return res.json({ finished: true, message: "No more questions available." });
    }

    // Manually fetch related answers and solution
    const [answers, solution] = await Promise.all([
      Answer.find({ questionID: question._id }).lean(),
      Solution.findOne({ questionID: question._id }).lean()
    ]);

    res.json({
      question: {
        _id: question._id,
        title: question.title,
        hint: question.hint,
        difficulty: question.difficulty,
        answers: answers.map(a => ({
          _id: a._id,
          title: a.title,
          reson: a.reason || ""
        })),
        correctAnswerId: solution?.answerID?.toString() || null,
        reason: solution?.reason || ""
      }
    });
  } catch (error) {
    console.error("Error fetching next question:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { nextQuestion };


const getAllQuizzes = async (req, res) => {
  const quizzes = await Quiz.find({}, "title"); // Fetch only quiz titles
  res.json(quizzes);
};

const getQuizById = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  res.json(quiz);
};




module.exports = { generateQuestions, startQuiz, nextQuestion, getAllQuizzes, getQuizById };
