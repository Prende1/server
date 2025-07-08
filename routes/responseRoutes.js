const express = require('express');
const router = express.Router();
const responseController = require('../controllers/quizAttemptController');

// POST /api/responses
router.post('/', responseController.submitAnswer);
router.get("/recent/:userID", responseController.getRecentAttempts);

module.exports = router;
