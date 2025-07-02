const Like = require('../models/Like');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

const handleLikeDislike = async (req, res) => {
  try {
    const { username, questionID, answerID, like } = req.body;

    if (!username || (questionID && answerID) || (!questionID && !answerID)) {
      return res.status(400).json({ error: 'Provide exactly one of questionID or answerID and a username.' });
    }

    const filter = { username };
    if (questionID) filter.questionID = questionID;
    if (answerID) filter.answerID = answerID;

    const existing = await Like.findOne(filter);
    const isQuestion = !!questionID;
    const targetModel = isQuestion ? Question : Answer;
    const target = await targetModel.findById(isQuestion ? questionID : answerID);

    if (!target) return res.status(404).json({ error: 'Target not found' });

    if (existing) {
      if (existing.like === like) {
        // Remove the like/dislike
        await Like.deleteOne({ _id: existing._id });
        if (like) target.likes -= 1;
        else target.dislikes -= 1;
      } else {
        // Switch from like <-> dislike
        existing.like = like;
        await existing.save();
        if (like) {
          target.likes += 1;
          target.dislikes -= 1;
        } else {
          target.dislikes += 1;
          target.likes -= 1;
        }
      }
    } else {
      // New like or dislike
      await Like.create({ username, questionID, answerID, like });
      if (like) target.likes += 1;
      else target.dislikes += 1;
    }

    await target.save();
    return res.status(200).json({
      message: 'Reaction updated successfully',
      likes: target.likes,
      dislikes: target.dislikes,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getLikeDislikeStats = async (req, res) => {
  try {
    const { questionID, answerID } = req.body;

    if ((questionID && answerID) || (!questionID && !answerID)) {
      return res.status(400).json({ error: 'Provide exactly one of questionID or answerID in body.' });
    }

    const target = questionID
      ? await Question.findById(questionID)
      : await Answer.findById(answerID);

    if (!target) {
      return res.status(404).json({ error: 'Target not found' });
    }

    res.status(200).json({
      likes: target.likes || 0,
      dislikes: target.dislikes || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


const getUserReaction = async (req, res) => {
  try {
    const { username, questionID, answerID } = req.body;

    if (!username || (questionID && answerID) || (!questionID && !answerID)) {
      return res.status(400).json({ error: 'Provide username and exactly one of questionID or answerID in body.' });
    }

    const filter = { username };
    if (questionID) filter.questionID = questionID;
    if (answerID) filter.answerID = answerID;

    const reaction = await Like.findOne(filter);

    if (!reaction) {
      return res.status(200).json({ reacted: false });
    }

    res.status(200).json({
      reacted: true,
      like: reaction.like,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};



module.exports = { handleLikeDislike, getLikeDislikeStats, getUserReaction };
