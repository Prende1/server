const express = require('express');
const router = express.Router();
const wordAnswerController = require('../controllers/wordAnswerController');

// POST: Submit an answer with AI review
router.post('/', wordAnswerController.createWordAnswer);
// GET: Retrieve answers for a specific word question
router.get('/:wqID', wordAnswerController.getWordAnswersByWqID);

module.exports = router;
