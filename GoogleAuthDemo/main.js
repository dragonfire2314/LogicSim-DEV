/* ====== create node.js server with express.js framework ====== */
// dependencies
const express = require("express");

//Creates the express app
const app = express();
//Lets express use json (used for POST)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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

    console.log(payload);
}

/*
    These are callbacks, when a request comes in these functions will be called to process the request
*/
//A GET handler for a blank usl (www.learnlogic.today)
app.get("/", (req, res) => {
    res.sendFile('index.html', {root: __dirname })
});

//A POST request for www.learnlogic.today/tokenSignIn
app.post("/tokenSignIn", (req, res) => {
    //The data being sent over is stored in req.body

    //Calls the google verify function on the token sent from the signin
    verify(req.body.idtoken).catch(console.error);
});


/*
    This funcion has the server start listening
*/
// PORT
const PORT = 80;

//This starts the web server on PORT
app.listen(PORT, () => {
   console.log(`Server is running on PORT: ${PORT}`);
});
