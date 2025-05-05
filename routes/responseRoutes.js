const express = require('express');
const router = express.Router();
const responseController = require('../controllers/quizAttemptController');

// POST /api/responses
router.post('/', responseController.createOrUpdateAttempt);

module.exports = router;
