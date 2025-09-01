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
    const inputPrompt = `Generate 10 multiple-choice quiz questions for children about the word or topic "${prompt}".
    - Cover different aspects: meaning, synonyms, antonyms, sentence usage, and real-world context.
    - Each question must include a "hint" that helps children think critically.
    - Assign a random difficulty: easy, medium, or hard.
    - Add tags to each question such as ["philosophical", "grammatical", "historical", "practical"] to reflect its context.
    - Each question must have exactly 4 answer choices.
    - Exactly one answer choice must be correct (isCorrect: true). The other three must be incorrect (isCorrect: false).
    - For the correct answer: provide a short "reason" explaining why it is correct.
    - For each incorrect answer: provide a short "reason" explaining why it is wrong (e.g., “This word means something else” or “This does not fit the sentence usage.”).
    - Return the output strictly in the following JSON format:
      {
        "questions": [
          {
            "question": "What does 'ephemeral' mean?",
            "difficulty": "easy",
            "hint": "Think about something that doesn't last long.",
            "tags": ["grammatical", "philosophical"],
            "choices": [
              {"title": "Temporary", "isCorrect": true, "reason": "Ephemeral means short-lived or temporary."},
              {"title": "Loud", "isCorrect": false, "reason": "Loud relates to sound, not duration."},
              {"title": "Strong", "isCorrect": false, "reason": "Strong refers to power, not something short-lived."},
              {"title": "Bright", "isCorrect": false, "reason": "Bright describes light or intelligence, not shortness of time."}
            ]
          }
        ]
      }`;

    // Call the AI model
    const result = await model.generateContent({
      contents: [{ parts: [{ text: inputPrompt }] }],
    });

    let responseText = result.response.candidates[0].content.parts[0].text;

    // Clean up response (remove ```json code fences if present)
    responseText = responseText.replace(/```json|```/g, "").trim();

    const quizData = JSON.parse(responseText);

    let questionsToInsert = [];
    let answersToInsert = [];

    quizData.questions.forEach((q) => {
      const questionID = new mongoose.Types.ObjectId();

      // Prepare question
      questionsToInsert.push({
        _id: questionID,
        title: q.question,
        hint: q.hint || "",
        difficulty: q.difficulty || "medium",
        tags: q.tags || []
      });

      // Prepare answers (with reasons for both correct + incorrect)
      q.choices.forEach((choice) => {
        answersToInsert.push({
          questionID,
          title: choice.title,
          isCorrect: choice.isCorrect || false,
          reason: choice.reason || "No reason provided"
        });
      });
    });

    // Save to DB
    await Question.insertMany(questionsToInsert);
    await Answer.insertMany(answersToInsert);

    res.json({ message: "Questions generated successfully", count: questionsToInsert.length });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ 
      error: "Failed to generate questions", 
      details: error.message 
    });
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

    // Find next unanswered question matching difficulty
    const question = await Question.findOne({
      _id: { $nin: session.answered },
      difficulty: session.difficulty,
    }).lean();

    if (!question) {
      return res.json({ finished: true, message: "No more questions available." });
    }

    // Fetch related answers (with correctness & reasons)
    const answers = await Answer.find({ questionID: question._id }).lean();

    res.json({
      question: {
        _id: question._id,
        title: question.title,
        hint: question.hint,
        difficulty: question.difficulty,
        tags: question.tags,
        answers: answers.map(a => ({
          _id: a._id,
          title: a.title,
          isCorrect: a.isCorrect, // can be hidden on frontend until user submits
          reason: a.reason || ""
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching next question:", error);
    res.status(500).json({ error: "Server error", details: error.message });
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
