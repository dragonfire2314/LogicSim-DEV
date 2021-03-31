function sendApp(res) {
    res.sendFile('./public/index2.html', {root: __dirname})
}

module.exports = {
    sendApp,
};