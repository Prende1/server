require('dotenv').config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const userRoutes = require('./routes/userRoutes');


const app = express();
const client_url=process.env.CLIENT_URL;
connectDB();
app.use(express.json());
app.use(cookieParser()); 
app.use(cors({origin:`${client_url}`,credentials:true}))


app.use('/api/users',userRoutes )


module.exports = app;