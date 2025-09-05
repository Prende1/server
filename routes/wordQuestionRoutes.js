const express = require("express");
const router = express.Router();
const wordQuestionController = require("../controllers/wordQuestionController");

// POST: Create and review a word question
router.post("/", wordQuestionController.createWordQuestion);
// GET: Retrieve a random question from all questions without repetition
router.get("/random", wordQuestionController.getRandomQuestion);
// GET: Retrieve all word questions
router.get("/:wordID", wordQuestionController.getAllWordQuestions);
// GET: Retrieve all questions of all words
router.get("/", wordQuestionController.getAllQuestions);  
//delete a question by ID
router.delete("/:id", wordQuestionController.deleteWordQuestionById);  


module.exports = router;
