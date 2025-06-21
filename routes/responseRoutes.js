const express = require('express');
const router = express.Router();
const responseController = require('../controllers/quizAttemptController');

// POST /api/responses
router.post('/', responseController.createOrUpdateAttempt);
router.get("/recent/:userID", responseController.getRecentAttempts);

module.exports = router;
