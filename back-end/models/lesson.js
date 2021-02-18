const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// Create schema for lesson info
const lessonSchema = new Schema({
    accountIdentifier: {
        type: String
        required: true
    },
    lessonData: {
        type: String
    },
    lessonID{
        type: string
    }
}, { timestamps: true });


// Export lesson schema
const Lesson = mongoose.model('Lesson', userSchema);
module.exports = Lesson;