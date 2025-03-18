const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    title: String,
    questions: [
        {
            question: String,
            choices: [String],
            answer: String
        }
    ]
});

module.exports = mongoose.model('Quiz', quizSchema);
