const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const User = require('./models/user')
const Lesson = require('./models/lesson')

// Express stuff
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public/html'));
app.use(express.static('public/login'));
app.use(express.static('public/signUp'));
app.use(express.static('public/public'));
// app.use(express.static('public/public'));

app.set('view engine', 'ejs');

// MongoDB stuff

//Need to deal with the posiblity of the database connection failing and requiring a reconnect
const dbConnString = 'mongodb+srv://tanner:qwertyuiop@cluster0.19ail.mongodb.net/LearnLogic?retryWrites=true&w=majority' // Connection string
mongoose.connect(dbConnString, { useNewUrlParser: true, useUnifiedTopology: true }) // Connect to database
    .then((result) => {
        app.listen(80);
        console.log("Connected");
    }) // After successful connection, server listen on port 3000
    .catch((err) => console.log("Error: ", err)); // Send error to console on failed connection

/*
    This code is the verification code for the google services
*/
//From: https://developers.google.com/identity/sign-in/web/backend-auth
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client("477838951887-1nrm34upa2qohl2ajkt4oppcn6tumsnp.apps.googleusercontent.com");
//Verify the user from the token
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: "477838951887-1nrm34upa2qohl2ajkt4oppcn6tumsnp.apps.googleusercontent.com",
    });
    //payload contains all the information that is returned form the request
    const payload = ticket.getPayload();
    //sub is the value we should use for the PK
    const userid = payload['sub'];

    return payload;
}


//www.learnlogic.today
app.get("/", (req, res) => {
    res.render('pages/index');
});
//www.learnlogic.today/login
app.get("/login", (req, res) => {
    res.render('pages/login');
});
//www.learnlogic.today/signUp
app.get("/signup", (req, res) => {
    res.render('pages/signUp');
});
//www.learnlogic.today/learn
app.get("/learn", (req, res) => {
    res.sendFile('./public/public/index.html', {root: __dirname })
    //res.render('pages/signUp');
});
//Load
//Save
//Login
app.post('/loginAccount', async (req, res) => {

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
                    console.log("User res", userResult);
                    res.render('pages/loginResult', {
                        result: userResult,
                    });
                    res.status(200).send();
                }).catch(error => {
                    //Password doesn't esist, this is most likely due to the user having signed in with google be before
                    userResult = "Account not found. Try using google to sign in.";
                    //Respond to the request
                    console.log("User res", userResult);
                    res.render('pages/loginResult', {
                        result: userResult,
                    });
                    res.status(200).send();
                });
            }
            else {
                userResult = "Account not found.";
                //Respond to the request
                console.log("User res", userResult);
                res.render('pages/loginResult', {
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
});
//SignUp
app.post('/createAccount', async (req, res) => {
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
                //console.log("doc: ", doc);
                //Replace with the responce page to send
                // res.send("Account Already Exists.");
                // res.status(201).send();
                resultForUser = "Account Already Exists.";
            }
            else {
                //Add user to database
                const user = new User(
                {
                    username: req.body.username,
                    email: req.body.email,
                    passwordHash: hashedPassword,
                });
            
                user.save()
                .then((result) => {
                    //res.send(result);
                    //console.log("result:", result);
                })
                .catch((err) => {
                    console.log(err)
                });

                //Replace with the responce page to send
                // res.send("Account Created.");
                // res.status(201).send();
                resultForUser = "Account Created.";
            }

            //Respond to the request
            res.render('pages/signUpResult', {
                result: resultForUser,
            });
            res.status(201).send();
        })
        .catch(err => {
            console.error("Error with /createAccount find: ", err)
        });
    } 
    catch{
        res.status(500).send();
    }
});
//Login/SignUp(Google)
app.post('/api/tokenSignIn', async (req, res) => {
    //console.log("Google End point");
    try{
        verify(req.body.idtoken).then(g_res => {
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
                            res.send("Access Granted");
                            res.status(200).send();
                        }
                        else {
                            res.send("Access Denied");
                            res.status(200).send();
                        }
                    }
                    else {
                        res.send("Account Couldn't be found");
                        res.status(200).send();
                    }
                }
                else {
                    //Add user to database
                    const user = new User(
                    {
                        username: g_res.given_name,
                        email: g_res.email,
                        googleID: g_res.sub,
                    });
                
                    user.save()
                    .then((result) => {
                        //res.send(result);
                        //console.log("result:", result);
                    })
                    .catch((err) => {
                        console.log(err)
                    });

                    //Replace with the responce page to send
                    res.send("Account Created.");
                    res.status(201).send();
                }
            })
            .catch(err => {
                console.error("Error with /createAccount find: ", err)
            });
        }).catch(console.error);
    }
    catch{
        console.log("Error");
        res.status(500).send();
    }
});


































// // Add user info to DB
// app.get('/add-user', (req, res) => {
//     const user = new User(
//     {
//         accountIdentifier: 'testID',
//         email: 'test@gmail.com',
//         passwordHash: 'fdsgdsfgwgwgegwgwgwg',
//         lessonCompleted: [1, 2, 3]
//     });

//     user.save()
//         .then((result) => {
//             res.send(result);
//             console.log("Test");
//         })
//         .catch((err) => {
//             console.log(err)
//         })
// })

// // Add lesson info to DB
// app.get('/add-lesson', (req, res) => {
//     const lesson = new Lesson(
//     {
//         accountIdentifier: 'testID',
//         lessonData: 'test lesson data',
//         lessonID: '1'
//     });

//     lesson.save()
//         .then((result) => {
//             res.send(result)
//         })
//         .catch((err) => {
//             console.log(err)
//         })

// })

// // Users container for testing
// const users = []

// // Get user info
// app.get('/users', (req, res) => {
//     res.json(users)
// })

// // Post user info
// app.post('/users', async (req, res) => {
//     try{
//         const hashedPassword = await bcrypt.hash(req.body.password, 10) // Encrypt password
//         const user = { name: req.body.name, password: hashedPassword } // Set user information
//         users.push(user)
//         res.status(201).send()
//     } 
//     catch{
//         res.status(500).send()
//     }
// })

// // Validate user info
// app.post('/users/login', async (req, res) => {
//     const user = users.find(user => user.name = req.body.name)
//     if (user == null) {
//         return res.status(400).send('Cannot find user') // If username does not match records
//     }
//     try{
//         if(await bcrypt.compare(req.body.password, user.password))
//         {
//             res.send('Success') // If username and password both match
//         }
//         else
//         {
//             res.send('Not Allowed') // If password is invalid
//         }
//     }
//     catch{
//         res.status(500).send()
//     }
// })


