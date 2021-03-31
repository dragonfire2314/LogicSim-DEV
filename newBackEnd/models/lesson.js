const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// Create schema for lesson info
const lessonSchema = new Schema({
    uuid: {
        type: String,
        required: true
    },
    lessonData: {
        type: String
    },
    lessonID: {
        type: String
    }
}, { timestamps: true });


// Export lesson schema
const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;