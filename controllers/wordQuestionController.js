const Word = require("../models/Word");
const WordQuestion = require("../models/WordQuestion");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
  },
});

exports.createWordQuestion = async (req, res) => {
  try {
    const { wordID, question, created_by } = req.body;

    if (!wordID || !question || !created_by) {
      return res
        .status(400)
        .json({ error: "wordID, question, and created_by are required" });
    }

    const wordData = await Word.findById(wordID);
    if (!wordData) {
      return res.status(404).json({ error: "Word not found" });
    }
    const wordTitle = wordData.title;

    // Gemini review prompt
    const reviewPrompt = `You're an English vocabulary expert. A question was submitted by a user:\n"${question}"\nThis question is supposed to be about the word: "${wordTitle}".\nIgnore grammar or spelling mistakes. Just answer if the question is relevant to the meaning, usage, or context of this word.\nReply only with "Valid" if relevant, or "Invalid" if unrelated.`;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: reviewPrompt }] }],
    });

    const reviewResponse =
      result.response.candidates[0].content.parts[0].text.trim();
    if (reviewResponse.toLowerCase() === "invalid") {
      return res.status(400).json({
        error: "The question is invalid. Please revise it.",
        reviewFeedback: reviewResponse,
      });
    }
    const wordQuestion = await WordQuestion.create({
      wordID,
      question,
      created_by,
      reviewed_by: "AI",
      created_ts: new Date(),
      updated_ts: new Date(),
    });

    res.status(201).json({
      message: "WordQuestion created and reviewed",
      wordQuestion,
      reviewFeedback: reviewResponse,
    });
  } catch (error) {
    console.error("Error creating word question:", error);
    res.status(500).json({
      error: "Failed to create word question",
      details: error.message,
    });
  }
};

// Get questions by wordID where wordId is given from request params
exports.getAllWordQuestions = async (req, res) => {
  try {
    const wordID = req.params.wordID;

    if (!wordID) {
      return res.status(400).json({ error: "wordID is required" });
    }

    const wordQuestions = await WordQuestion.find({ wordID });

    if (wordQuestions.length === 0) {
      return res
        .status(404)
        .json({ message: "No questions found for this word" });
    }

    res.status(200).json(wordQuestions);
  } catch (error) {
    console.error("Error fetching word questions:", error);
    res
      .status(500)
      .json({
        error: "Failed to fetch word questions",
        details: error.message,
      });
  }
};

// get all questions of all words
exports.getAllQuestions = async (req, res) => {
  try {
    const wordQuestions = await WordQuestion.find({});
    res.status(200).json(wordQuestions);
  } catch (error) {
    console.error("Error fetching word questions:", error);
    res
      .status(500)
      .json({
        error: "Failed to fetch word questions",
        details: error.message,
      });
  }
};

//get a random question from all questions without repetition
exports.getRandomQuestion = async (req, res) => {
  try {
    const wordQuestions = await WordQuestion.aggregate([
      { $sample: { size: 1 } },
    ]);
    res.status(200).json(wordQuestions[0]);
  } catch (error) {
    console.error("Error fetching word questions:", error);
    res
      .status(500)
      .json({
        error: "Failed to fetch word questions",
        details: error.message,
      });
  }
};