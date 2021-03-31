const User = require('../models/user');
const Lesson = require('../models/lesson');

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
        uuid: req.session.passport.user
        // uuid: '932bdf9e-0251-4400-8511-5c8fb1fb2514',
    })
    .then(doc => {
        //Account was found
        if (doc.length <= 0) {
            console.log("Account not found");
            res.status(500).send();
        }
        else {
            //Select the data to send back to the application
            var returnData = {
                username:        doc[0].username,
                lessonsCompleted: doc[0].lessonCompleted,
            };
            res.send(returnData);
        }
    })
    .catch(err => {
        console.error(err)
    })
}

function loadUserLessonData(req, res) {
    console.log("Loading: ", req.session);
    Lesson.find({
        //This is for the final release, for testing i will be using a fixed uuid
        // uuid: req.session.passport.user
        uuid: req.session.passport.user,
        // uuid: '932bdf9e-0251-4400-8511-5c8fb1fb2514',
        lessonID: req.body.lessonID.toString(),
    })
    .then(doc => {
        console.log("body: ", req.body);

        //Account was found
        if (doc.length <= 0) {
            // console.log("No lessons found for user: ", req.session.passport.user);
            res.status(500).send();
            return;
        }
        //Find the right lessonID
        // var index;
        // for (var i = 0; i < doc.length; i++) {
        //     if (doc[i].lessonID == req.body.lessonID)
        //         index = i;
        // }
        // //No matching lesson found
        // if (!index) {
        //     console.log("lesson " + req.body.lessonID + " not found for user: ", req.session.passport.user);
        //     res.status(500).send();
        //     return;
        // }
        //Select the data to send back to the application
        var returnData = {
            data:        JSON.parse(doc[0].lessonData),
        };
        res.send(returnData);
    })
    .catch(err => {
        console.error(err)
    })
}

function saveUserLessonData(req, res) {
    console.log("Saving");
    //Check if a user is logged in
    // if (!req.session.passport.user) {
    //     console.log("user is not logged in.");
    //     res.status(500).send();
    //     return;
    // }
    //Check to see if the lesson already exists
    Lesson.find({
        uuid: req.session.passport.user,
        // uuid: '932bdf9e-0251-4400-8511-5c8fb1fb2514',
        lessonID: req.body.lessonID.toString(),
    })
    .then(doc => {
        //Account wasn't found
        if (doc.length <= 0) {
            //Add a lesson
            const lesson = new Lesson(
            {
                uuid: req.session.passport.user,
                // uuid: '932bdf9e-0251-4400-8511-5c8fb1fb2514',
                lessonID: req.body.lessonID,
                lessonData: JSON.stringify(req.body.lessonData)
            });

            lesson.save();
            res.status(200).send();
            return;
        } else {
            console.log("replace");
            Lesson.updateOne({ //Thing to find
                uuid: req.session.passport.user,
                // uuid: '932bdf9e-0251-4400-8511-5c8fb1fb2514',
                lessonID: req.body.lessonID,
            }, 
            { //Things to update
                lessonData: JSON.stringify(req.body.lessonData)
            }).then(r => {
                console.log("Done: ", r);
            });
        }

        res.status(200).send();
    })
    .catch(err => {
        console.error(err)
    })
}

module.exports = {
    accessProtectionMiddleware,
    app,
    getUserData,
    loadUserLessonData,
    saveUserLessonData,
};