const express = require('express');
const router = express.Router();
const { handleLikeDislike, getLikeDislikeStats, getUserReaction } = require('../controllers/likeController');

// Like or Dislike
router.post('/', handleLikeDislike);

// Get likes/dislikes count
router.get('/stats', getLikeDislikeStats);

// Get user like/dislike status
router.get('/user-status', getUserReaction);

module.exports = router;
