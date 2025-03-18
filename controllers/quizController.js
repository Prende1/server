// const axios = require('axios');

const Quiz = require('../models/Quiz');

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
    },
});

// Function to Generate Quiz
const generateQuiz = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    try {
        const inputPrompt = `Generate an English vocabulary quiz.
        - The topic is: ${prompt}.  
        - Create 5 multiple-choice questions.  
        - Each question should ask about a word's meaning, synonyms, antonyms, or usage in a sentence.  
        - Each question must have 4 answer choices.  
        - Clearly mark the correct answer.  
        - Return the output in a structured JSON format:
          {
            "questions": [
              {
                "question": "What does 'ephemeral' mean?",
                "choices": ["Temporary", "Loud", "Strong", "Bright"],
                "answer": "Temporary"
              }
            ]
          }`;

        // Generate response
        const result = await model.generateContent({ contents: [{ parts: [{ text: inputPrompt }] }] });
        let responseText = result.response.candidates[0].content.parts[0].text;

        responseText = responseText.replace(/```json|```/g, '').trim();

        // Parse JSON response
        const quizData = JSON.parse(responseText);

        const newQuiz = new Quiz({
            title: prompt,
            questions: quizData.questions
        });

        await newQuiz.save();
        res.json({ message: "Quiz Created Successfully", quiz: newQuiz });
    } catch (error) {
        console.error("Error generating quiz:", error);
        res.status(500).json({ error: "Error generating quiz", details: error.message });
    }
};

const getAllQuizzes = async (req, res) => {
    const quizzes = await Quiz.find({}, 'title'); // Fetch only quiz titles
    res.json(quizzes);
};

const getQuizById = async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
};

module.exports = { generateQuiz, getAllQuizzes, getQuizById };
