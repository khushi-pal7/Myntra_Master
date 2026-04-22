const express = require('express')
const app = express(); 
const bodyParser =  require('body-parser')
const cookieParser = require('cookie-parser')
const User = require('./routes/userroutes.js')
const Product = require('./routes/productroute')
const Order = require('./routes/orderroutes')
const Friends = require('./routes/friendsroutes')
const Reviews = require('./routes/reviewroutes')
const Squad = require('./routes/squadroutes')
const TryOn = require('./routes/TryOnRoute')
const errorMiddleware = require('./Middelwares/error');
const path = require("path");
const cors = require('cors');
if (process.env.NODE_ENV !== "PRODUCTION") {
    require("dotenv").config({ path: "backend/config/config.env" });
}

app.use(cors({
    origin: ['https://myntra-master-orcin.vercel.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended:true}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/v1', User)
app.use('/api/v1', Product)
app.use('/api/v1', Order)
app.use('/api/v1/friends', Friends)
app.use('/api/v1/reviews', Reviews)
app.use('/api/v1/squad', Squad)
app.use('/api/v1/try-on', TryOn)

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});

app.use(errorMiddleware)
module.exports = app
