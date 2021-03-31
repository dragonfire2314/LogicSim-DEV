const User = require('../models/user');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pageController = require('../controller/page');
const oauth = require('./oauth');

//This function should probably be broken appart tbh
function loginAccount (req, res) {
    var userResult;

    try{
        //Check if the account exsists
        User.find({
            email: req.body.email   // search query
        })
        .then(doc => {
            //console.log(doc)
            if (doc.length === 1) {
                bcrypt.compare(req.body.password, doc[0].passwordHash).then(b_res => {
                    if (b_res) {
                        userResult = "Account found. Signed In";
                    }
                    else {
                        userResult = "Account not found.";
                    }
                    //Respond to the request
                    //Set cookies the the user is logged in
                    req.session.clientId = doc[0].uuid;
                    pageController.renderPage(req, res, 'pages/loginResult', {
                        result: userResult,
                    });
                    res.status(200).send();
                }).catch(error => {
                    //Password doesn't esist, this is most likely due to the user having signed in with google be before
                    userResult = "Account not found. Try using google to sign in.";
                    //Respond to the request
                    pageController.renderPage(req, res, 'pages/loginResult', {
                        result: userResult,
                    });
                    res.status(200).send();
                });
            }
            else {
                //Do a bcrypt to add protection against a timing attack
                userResult = "Account not found.";
                //Respond to the request
                pageController.renderPage(req, res, 'pages/loginResult', {
                    result: userResult,
                });
                res.status(200).send();
            }
        })
        .catch(err => {
            console.error(err)
        })
    }
    catch{
        console.log("ERROR");
        res.status(500).send();
    }
}

async function createAccount (req, res) {
    var resultForUser;

    try{
        //Password stuff
        const hashedPassword = await bcrypt.hash(req.body.password, 10); // Encrypt password

        //Check if user already has account
        User.find({
            email: req.body.email   // search query
        })
        .then(doc => {
            //Return to the request that the account already exsists
            if (doc.length) {
                resultForUser = "Account Already Exists.";
            }
            else {
                //Add user to database
                const user = new User(
                {
                    username: req.body.username,
                    email: req.body.email,
                    passwordHash: hashedPassword,
                    uuid: uuidv4(),
                    lessonCompleted: [{
                        lessonID: 0,
                    }],
                });
            
                user.save()
                .then((result) => {
                    //Log the user in right away
                    req.session.clientId = user.uuid;
                    resultForUser = "Account Created.";

                    //Respond to the request
                    pageController.renderPage(req, res, 'pages/signUpResult', {
                        result: resultForUser,
                    });
                    res.status(201).send();
                })
                .catch((err) => {
                    console.log(err)
                });
            }
        })
        .catch(err => {
            console.error("Error with /createAccount find: ", err)
        });
    } 
    catch(err) {
        console.error("Somthing went wrong: ", err);
        res.status(500).send();
    }
}

function googleLogin(req, res) {
    var resultForUser;
    //console.log("Google End point");
    try{
        oauth.verify(req.body.idtoken).then(g_res => {
            //Verify the g_res is right
            
            //Check if user already has account
            User.find({
                googleID: g_res.sub   // search query
            })
            .then(doc => {
                //Return to the request that the account already exsists
                if (doc.length) {
                    if (doc.length === 1) {
                        if (doc[0].googleID === g_res.sub) {
                            resultForUser = "Access Granted";
                        }
                        else {
                            resultForUser = "Access Denied";
                        }
                    }
                    else {
                        resultForUser = "Account Couldn't be found";
                    }
                    //Log the user in right away
                    req.session.clientId = doc[0].uuid;
                    console.log("google session: ", req.session.id);
                    //Respond to the request
                    // pageController.renderPage(req, res, 'pages/signUpResult', {
                    //     result: resultForUser,
                    // });
                    res.status(201).send();
                }
                else {
                    //Add user to database
                    const user = new User(
                    {
                        username: g_res.given_name,
                        email: g_res.email,
                        googleID: g_res.sub,
                        uuid: uuidv4(),
                    });
                
                    user.save()
                    .then((result) => {
                        resultForUser = "Access Granted";
                        //Log the user in right away
                        req.session.clientId = user.uuid;
                        console.log("google seesion: ", req.session);
                        //Respond to the request
                        // pageController.renderPage(req, res, 'pages/signUpResult', {
                        //     result: resultForUser,
                        // });
                        res.status(201).send();
                    })
                    .catch((err) => {
                        console.log(err)
                    });
                }
            })
            .catch(err => {
                console.error("Error with /googleLogin find: ", err)
            });
        }).catch(console.error);
    }
    catch(err) {
        console.log("Error: ", err);
        res.status(500).send();
    }
}

function googleAuthPassport(req ,res) {
    //Add the user to the database or sign them in
    try{
        //Check if user already has account
        User.find({
            googleID: req.user._json.sub   // search query
        })
        .then(doc => {
            //Return to the request that the account already exsists
            if (doc.length) {
                if (doc.length > 1) {
                    console.error("BIG PROBLEM, ACCOUNT HAS MORE THEN ONE ENTRIES, THIS SHOULD BE SENT TO A ADMIN");
                }
            }
            else {
                //Add user to database
                const user = new User(
                {
                    username: g_res.given_name,
                    email: g_res.email,
                    googleID: g_res.sub,
                    uuid: uuidv4(),
                });
            
                user.save()
                .then((result) => {
                    
                })
                .catch((err) => {
                    console.log(err)
                });
            }

            res.redirect('/');
        })
        .catch(err => {
            console.error("Error with /googleLogin find: ", err)
        });
    }
    catch(err) {
        console.log("Error: ", err);
        res.status(500).send();
    }
}

module.exports =  {
    loginAccount,
    createAccount,
    googleLogin,
    googleAuthPassport,
}