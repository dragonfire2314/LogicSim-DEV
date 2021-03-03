const express = require('express');
const auth = require('../middleware/auth');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const authController = require('../controller/auth');
const profileController = require('../controller/profile');
const pageController = require('../controller/page');
const appController = require('../controller/app');

const router = express.Router();

//Can asccess without loggin in

//www.learnlogic.today
router.get("/", (req, res) => {
    pageController.renderPage(req, res, 'pages/index');
});
//www.learnlogic.today/login
router.get("/login", (req, res) => {
    pageController.renderPage(req, res, 'pages/login');
});
router.get("/loginFailed", (req, res) => {
    pageController.renderPage(req, res, 'pages/loginFailed');
});
//www.learnlogic.today/signUp
router.get("/signup", (req, res) => {
    pageController.renderPage(req, res, 'pages/signUp');
});
//www.learnlogic.today/logout
router.get("/logout", (req, res) => {
    //Log the user out
    req.logout();
    res.redirect('/');
});
//www.learnlogic.today/learn
router.get("/learn", (req, res) => {
    res.sendFile(path.resolve('/public/public/index2.html'), {root: __dirname+'/../' })
});


//Account Stuff
router.post('/loginAccount', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/loginFailed'}));
router.post('/createAccount', authController.createAccount);
router.get('/google/callback', passport.authenticate('google', {failureRedirect: '/loginFailed'}), authController.googleAuthPassport);

//App User page
app.get('/app', appController.accessProtectionMiddleware, appController.app);

//User must be logged in to access this
router.get('/profile', profileController.profile);

//Export the router for the main file
module.exports = router;