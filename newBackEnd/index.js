require('dotenv').config();

const express = require('express');
const router = require('./routes');
const https = require('https');
const fs = require('fs');
const session = require('./middleware/session');
const mongo = require('./database/mongo');
const corsMw = require('./middleware/cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('./middleware/passport');

const app = express();

//Trust proxy, used to let node wit behind nginx
app.enable("trust proxy");
//json middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Static web routes
app.use(express.static('public/html'));
app.use(express.static('public/login'));
app.use(express.static('public/signUp'));
app.use(express.static('public/public'));
//Remove powered by
app.disable('x-powered-by');
//Let us use ejs
app.set('view engine', 'ejs');

//Use the session
app.use(session);

//Setup cors
app.options('*', corsMw);
app.use(corsMw);

//Passport
app.use(passport.initialize());
app.use(passport.session());

//Use the router
app.use(router);

//Connect to mongo and start the server
mongo(app);