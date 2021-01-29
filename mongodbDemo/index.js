const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;

// Make sure you place body-parser before your CRUD handlers!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




MongoClient.connect('mongodb://192.168.1.146:27017/test', (err, client) => {
    if (err) return console.error(err)
    console.log('Connected to Database')
});




app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


app.post('/createAccount', (req, res) => {
    console.log(req.body);

    res.status(200).send();
});


app.listen(3000, function() {
    console.log('listening on 3000');
});