const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// Create schema for user info
const userSchema = new Schema({
    accountIdentifier: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    lessonCompleted: {
        type: Array
    }
}, { timestamps: true });

// Export user schema
const User = mongoose.model('User', userSchema);
module.exports = User;