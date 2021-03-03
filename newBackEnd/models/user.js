const mongoose = require('mongoose');
const Schema = mongoose.Schema;


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
    lessonCompleted: {
        type: Array
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