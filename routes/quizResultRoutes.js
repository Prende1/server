const express = require('express');
const router = express.Router();
const quizResultController = require('../controllers/quizResultController');

// POST /api/quiz-results
router.post('/', quizResultController.submitOrUpdateQuizResult);

module.exports = router;
