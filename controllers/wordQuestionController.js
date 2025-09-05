const Word = require("../models/Word");
const WordQuestion = require("../models/WordQuestion");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const WordAnswer = require("../models/WordAnswer");

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

    // Gemini review prompt with tags
    const reviewPrompt = `You're an English vocabulary expert. A question was submitted by a user:\n"${question}"\nThis question is supposed to be about the word: "${wordTitle}".\nIgnore grammar or spelling mistakes. First, reply with "Valid" if the question is relevant to the meaning, usage, or context of this word, or "Invalid" if unrelated. Then, on a new line, provide a comma-separated list of tags that best describe the type of question (e.g., philosophical, grammatical, historical, contextual, usage, definition, etc.).\nExample:\nValid\nTags: grammatical, usage`;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: reviewPrompt }] }],
    });

    const reviewText = result.response.candidates[0].content.parts[0].text.trim();
    const [validityLine, tagsLine] = reviewText.split('\n');
    const reviewFeedback = validityLine.trim();
    let tags = [];
    if (tagsLine && tagsLine.toLowerCase().startsWith('tags:')) {
      tags = tagsLine.replace(/tags:/i, '').split(',').map(tag => tag.trim());
    }

    if (reviewFeedback.toLowerCase() === "invalid") {
      return res.status(400).json({
        error: "The question is invalid. Please revise it.",
        reviewFeedback,
        tags,
      });
    }
    const wordQuestion = await WordQuestion.create({
      wordID,
      question,
      created_by,
      reviewed_by: "AI",
      tags,
      created_ts: new Date(),
      updated_ts: new Date(),
    });

    res.status(201).json({
      message: "WordQuestion created and reviewed",
      wordQuestion,
      reviewFeedback,
      tags,
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

//delete a question by its id if and only if there are no answers to it
exports.deleteWordQuestionById = async (req, res) => {
  try {
    const questionID = req.params.id;
    const question = await WordQuestion.findById(questionID);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    const answers = await WordAnswer.find({ questionID });
    if (answers.length > 0) {
      return res
        .status(400)
        .json({ error: "Cannot delete question with answers" });
    }
    await WordQuestion.findByIdAndDelete(questionID);
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res
      .status(500)
      .json({ error: "Failed to delete question", details: error.message });
  }
};