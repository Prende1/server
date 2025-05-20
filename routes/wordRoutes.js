const express = require('express');
const router = express.Router();
const wordController = require('../controllers/wordController');

// POST: Create a new word
router.post('/', wordController.createWord);

// PUT: Update an existing word by ID
router.put('/:id', wordController.updateWord);

// Get all words
router.get('/', wordController.getAllWords);

// Get a word by ID
router.get('/:id', wordController.getWordById);

// Delete a word
router.delete('/:id', wordController.deleteWord);

module.exports = router;
