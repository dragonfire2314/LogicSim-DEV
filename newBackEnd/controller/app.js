const User = require('../models/user');

function accessProtectionMiddleware(req, res, next) {  
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).json({
            message: 'must be logged in to continue',
        });
    }
};

function app(req, res) {
    res.sendFile(path.resolve('/public/public/index2.html'), {root: __dirname+'/../' })
}

function getUserData(req, res) {
    User.find({
        //This is for the final release, for testing i will be using a fixed uuid
        // uuid: req.session.passport.user
        uuid: "fd374123-55c3-4b69-b3fd-b3b7d8e273a8"
    })
    .then(doc => {
        console.log("Found user: ", doc);

        //Select the data to send back to the application
        var returnData = {
            username:        doc[0].username,
            lessonsCompleted: doc[0].lessonCompleted,
        };

        res.send(returnData);
    })
    .catch(err => {
        console.error(err)
    })
}

function loadUserLessonData(req, res) {
    
}

module.exports = {
    accessProtectionMiddleware,
    app,
    getUserData,
    loadUserLessonData,
};