const mongoose = require('mongoose');

function MongoConnect(app) {
    const dbConnString = 'mongodb+srv://tanner:qwertyuiop@cluster0.19ail.mongodb.net/LearnLogic?retryWrites=true&w=majority' // Connection string
    mongoose.connect(dbConnString, { useNewUrlParser: true, useUnifiedTopology: true }) // Connect to database
        .then((result) => {
            app.listen(8080, () => console.log('http://localhost:7777'));
            console.log("Connected to the mongo server");
        })
        .catch((err) => console.log("Error: ", err)); // Send error to console on failed connection
}

module.exports = MongoConnect;