const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const lessonCompletion = new Schema({ 
//     lessonID: Number
// });

const lessonStatus = new Schema({ 
    lessonID: Number,
    status: String,
});

// Create schema for user info
const userSchema = new Schema({
    uuid: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    passwordHash: {
        type: String,
        //required: true
    },
    lessonStatus: {
        type: [lessonStatus]
    },
    username: {
        type: String,
        required: true
    },
    googleID: {
        type: String
    },
}, { timestamps: true });

// Export user schema
const User = mongoose.model('User', userSchema);
module.exports = User;