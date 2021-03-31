const cors = require('cors');

var whitelist = new Set(['http://learnlogic.today', 'http://localhost:8080', 'http://localhost:5000', 'http://localhost:5000/profile']);

const corsOptions = {
    optionsSuccessStatus: 200,
    origin: function (origin, callback) {
        if (whitelist.has(origin) !== -1){
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
}

module.exports = cors(corsOptions);