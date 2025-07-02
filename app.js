require('dotenv').config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const userRoutes = require('./routes/userRoutes');
const quizRoutes = require("./routes/quizRoutes");
const responseRoutes = require("./routes/responseRoutes");
const quizResultRoutes = require("./routes/quizResultRoutes");
const wordRoutes = require("./routes/wordRoutes"); // Import word routes
const wordQuestionRoutes = require("./routes/wordQuestionRoutes"); // Import word question routes
const wordAnswerRoutes = require("./routes/wordAnswerRoutes"); // Import word answer routes
const likeRoutes = require("./routes/likeRoutes");


const app = express();
// const client_url=process.env.CLIENT_URL;
connectDB();
app.use(express.json());
app.use(cookieParser()); 
app.use(cors({origin:`*`,credentials:true}))


app.use('/api/users',userRoutes )
app.use('/api', quizRoutes); 
app.use('/api/responses', responseRoutes);
app.use('/api/quiz-results', quizResultRoutes);
app.use('/api/words', wordRoutes); // Add this line to include word routes
app.use('/api/wordQuestion', wordQuestionRoutes)
app.use('/api/wordAnswer', wordAnswerRoutes)
app.use("/api/like", likeRoutes)


module.exports = app;