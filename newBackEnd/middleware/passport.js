const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcrypt');

passport.serializeUser(function(user, done) {
    /*
    From the user take just the id (to minimize the cookie size) and just pass the id of the user
    to the done callback
    PS: You dont have to do it like this its just usually done like this
    */

    //Check if Google or local
    console.log("User: ", user);
    if (user.signInType === 'google') {
        //Get the uuid form the users account
        User.findOne({ googleID: user._json.sub }, function(err, result) {
            if (err) {
                console.error("Error with google sign in, no account in system: ", err);
            }
            done(null, result.uuid);
        });
    }
    else if (user.signInType === 'local') {
        done(null, user.uuid);
    }
    else {
        console.error("USER HAS NOT SIGNIN TPYE?????");
    }
  });
  
passport.deserializeUser(function(user, done) {
    /*
    Instead of user this function usually recives the id 
    then you use the id to select the user from the db and pass the user obj to the done callback
    PS: You can later access this data in any routes in: req.user
    */
    //I dont really care about fixing the data for this step
    //Wwe could search the database for the matching UUID, but this step shouldn't be required

    done(null, user);
});

//Google Oauth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    passReqToCallback: true,
    scope: ['profile', 'email'],
    },
    function(request, accessToken, refreshTocken, profile, done) {
        //Verify the user is real
        profile.signInType = 'google';
        //Account stuff
        return done(null, profile);
    }
));

//Regular password and email auth
passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(username, password, done) {
        console.log("Local strat: ", username, password);
        User.findOne({ email: username }, function(err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            bcrypt.compare(password, user.passwordHash).then(b_res => {
                if (b_res) {
                    console.log("user: ", user);
                    user.signInType = 'local';
                    return done(null, user);
                }
                else {
                    return done(null, false, { message: 'Incorrect password.' });
                }
            }).catch(error => {
                res.status(500).send();
            });
        });
    }
  ));