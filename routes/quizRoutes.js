const express = require('express');
const { generateQuiz, getAllQuizzes, getQuizById , getQuestionsWithAnswers,deleteQuiz } = require('../controllers/quizController');

const router = express.Router();

router.post('/generate-quiz', generateQuiz);
router.get('/quizzes', getAllQuizzes);
router.get('/quiz/:id', getQuizById);
router.get("/getQuiz/:quizID/questions", getQuestionsWithAnswers);
router.delete("/deleteQuiz/:quizID", deleteQuiz);


module.exports = router;
