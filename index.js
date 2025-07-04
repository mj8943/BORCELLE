require("dotenv").config()
const express = require("express")
const app = express();
const session =  require("express-session");
const mongoose = require("mongoose");
// mongoose.connect(process.env.MONGO_DB+"BORCELLE");
const nocache = require('nocache')
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const connectDB = require("./utils/db");


connectDB();


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

app.listen(8080,function(){
    console.log("Server is running....")
})  
