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

    // Gemini review prompt
    const reviewPrompt = `You're an English expert. Review the following user-submitted vocabulary question:\n"${question}"\nThe question is intended to be about the word: "${wordData.word}".\nIs it clear, grammatically correct, and relevant to this word? Respond with "Valid" or "Invalid".`;

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
