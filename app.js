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


module.exports = app;