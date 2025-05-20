const express = require("express");
const router = express.Router();
const wordQuestionController = require("../controllers/wordQuestionController");

// POST: Create and review a word question
router.post("/", wordQuestionController.createWordQuestion);

module.exports = router;
