const WordAnswer = require("../models/WordAnswer");
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

exports.createWordAnswer = async (req, res) => {
  try {
    const { wordID, wqID, answer, answered_by } = req.body;

    if (!wordID || !wqID || !answer || !answered_by) {
      return res
        .status(400)
        .json({ error: "wordID, wqID, answer, and answered_by are required" });
    }

    const wordQuestion = await WordQuestion.findById(wqID);
    if (!wordQuestion) {
      return res.status(404).json({ error: "Word question not found" });
    }

    // Gemini prompt with relevance focus
    const reviewPrompt = `You're an AI reviewing an English vocabulary answer. Ignore grammar and spelling errors. Focus only on whether the answer is relevant, meaningful, and appropriate in response to the question.
        Your task:
        1. Determine if the answer is valid (clearly relevant and appropriate for the question).
        2. Score the answer's relevance on a scale from 0 to 1.
        3. Identify the narrative style used in the answer.

        Question: "${wordQuestion.question}"
        Answer: "${answer}"

        Respond in the following JSON format:
        {
          "validity": "Valid",                  // or "Invalid"
          "ai_score": 0.85,                     // Float from 0 to 1
          "narrative": "professional"           // One of: general, professional, academic, casual, technical
        }`;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: reviewPrompt }] }],
    });

    const rawText = result.response.candidates[0].content.parts[0].text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({
        error: "AI response did not include valid JSON",
        rawResponse: rawText,
      });
    }

    let reviewData;
    try {
      reviewData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      return res.status(500).json({
        error: "Failed to parse AI response",
        details: parseError.message,
        rawResponse: jsonMatch[0],
      });
    }

    if (reviewData.validity.toLowerCase() === "invalid") {
      return res.status(400).json({
        error: "The answer is invalid. Please revise it.",
        reviewFeedback: reviewData,
      });
    }

    // Save the answer
    const wordAnswer = await WordAnswer.create({
      wordID,
      wqID,
      answer,
      answered_by,
      reviewed_by: "gemini-2.0",
      ai_score: reviewData.ai_score * 10, // Convert 0–1 to 0–10 scale
      narrative: reviewData.narrative,
      created_ts: new Date(),
      updated_ts: new Date(),
    });

    // Increment answer count
    await WordQuestion.findByIdAndUpdate(wqID, { $inc: { num_ans: 1 } });

    res.status(201).json({
      message: "Answer created and reviewed by AI",
      wordAnswer,
      aiReview: reviewData,
    });
  } catch (error) {
    console.error("Error creating word answer:", error);
    res.status(500).json({
      error: "Failed to create word answer",
      details: error.message,
    });
  }
};

//get word answers by wordQuestion ID
exports.getWordAnswersByWqID = async (req, res) => {
  try {
    const { wqID } = req.params;

    if (!wqID) {
      return res.status(400).json({ error: "wqID is required" });
    }

    const wordAnswers = await WordAnswer.find({ wqID })
      .populate("answered_by", "username")
      .populate("reviewed_by", "username");

    if (!wordAnswers || wordAnswers.length === 0) {
      return res
        .status(404)
        .json({ message: "No answers found for this question" });
    }

    res.status(200).json(wordAnswers);
  } catch (error) {
    console.error("Error fetching word answers:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch word answers", details: error.message });
  }
};
