const express = require('express');
const { generateQuestions, getAllQuizzes, getQuizById , startQuiz, nextQuestion } = require('../controllers/quizController');

const router = express.Router();

router.post('/generate-questions', generateQuestions);
router.post('/start-quiz', startQuiz); // Assuming this is the same as generating questions
router.get('/next-question/:quizId',nextQuestion); // Assuming this is the same as generating questions
router.get('/quizzes', getAllQuizzes);
router.get('/quiz/:id', getQuizById);


module.exports = router;
