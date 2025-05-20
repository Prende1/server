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

    // Gemini review prompt
    const reviewPrompt = `You're an English expert. Review the following user-submitted vocabulary question:\n"${question}"\nIs it clear, grammatically correct, and relevant to the given word? Respond with "Valid" or suggest an improved version.`;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: reviewPrompt }] }],
    });

    const reviewResponse =
      result.response.candidates[0].content.parts[0].text.trim();

    const wordQuestion = await WordQuestion.create({
      wordID,
      question,
      created_by,
      reviewed_by: "gemini-2.0",
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
    res
      .status(500)
      .json({
        error: "Failed to create word question",
        details: error.message,
      });
  }
};
