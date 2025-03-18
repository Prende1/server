const express = require('express');
const { generateQuiz, getAllQuizzes, getQuizById } = require('../controllers/quizController');

const router = express.Router();

router.post('/generate-quiz', generateQuiz);
router.get('/quizzes', getAllQuizzes);
router.get('/quiz/:id', getQuizById);

module.exports = router;
