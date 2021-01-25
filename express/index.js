// grab the packages we need
var express = require('express');
const cors = require('cors');
const fs = require('fs');
var app = express();
var port = process.env.PORT || 8080;

app.use(cors());

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// POST http://localhost:8080/api/save
app.post('/api/save', function(req, res) {
    console.log("received");
    console.log(req.body);

    let response = {
        message: "saved"
    };

    fs.writeFile("./usr/test", JSON.stringify(req.body), function(err) {
        if(err) {
            response.message = "error";
            return console.log(err);
        }
        console.log("The file was saved!");
    }); 

    console.log(response);

    res.send(response);
});

// POST http://localhost:8080/api/load
app.post('/api/load', function(req, res) {
    console.log("loading");
    console.log(req.body);

    let response = {
        data: ""
    };

    // __dirname means relative to script. Use "./data.txt" if you want it relative to execution path.
    fs.readFile("./usr/test", (error, data) => {
        if(error) {
            throw error;
        }
        console.log(data);
        response = JSON.parse(data);
        console.log(response);

        res.send(response);
    });
});

// start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);