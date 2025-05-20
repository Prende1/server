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

    // Prompt Gemini to review the answer
    const reviewPrompt = `You're an AI reviewing an English vocabulary answer. Please:
1. Score the quality of the following answer on a scale from 0 to 1.
2. Identify the narrative style as one of the following: general, professional, academic, casual, or technical.
Here is the answer:
"${answer}"
Respond in JSON:
{
  "ai_score": 0.85,
  "narrative": "professional"
}`;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: reviewPrompt }] }],
    });

    const rawText = result.response.candidates[0].content.parts[0].text.trim();

    // Try to extract JSON from raw text using a regex
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

    // Insert the answer into DB
    const wordAnswer = await WordAnswer.create({
      wordID,
      wqID,
      answer,
      answered_by,
      reviewed_by: "gemini-2.0",
      ai_score: reviewData.ai_score * 10,
      narrative: reviewData.narrative,
      created_ts: new Date(),
      updated_ts: new Date(),
    });

    // Increment num_ans in WordQuestion
    await WordQuestion.findByIdAndUpdate(wqID, { $inc: { num_ans: 1 } });

    res.status(201).json({
      message: "Answer created and reviewed by AI",
      wordAnswer,
      aiReview: reviewData,
    });
  } catch (error) {
    console.error("Error creating word answer:", error);
    res
      .status(500)
      .json({ error: "Failed to create word answer", details: error.message });
  }
};
