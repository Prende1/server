require('dotenv').config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const userRoutes = require('./routes/userRoutes');
const quizRoutes = require("./routes/quizRoutes");


const app = express();
// const client_url=process.env.CLIENT_URL;
connectDB();
app.use(express.json());
app.use(cookieParser()); 
app.use(cors({origin:`*`,credentials:true}))


app.use('/api/users',userRoutes )
app.use('/api', quizRoutes); 


module.exports = app;