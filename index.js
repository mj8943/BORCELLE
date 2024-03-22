require("dotenv").config()
const express = require("express")
const app= express();
const session =  require("express-session");
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/BORCELLE");
const nocache = require('nocache')
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use(express.static('public'));

app.set('view engine','ejs');
app.set('views','views');
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(nocache())
app.use('/',userRoute)

app.use('/admin',adminRoute)

app.listen(5000,function(){
    console.log("Server is running....")
})  
