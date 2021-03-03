function accessProtectionMiddleware(req, res, next) {  
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).json({
            message: 'must be logged in to continue',
        });
    }
};

function app() {
    res.sendFile(path.resolve('/public/public/index2.html'), {root: __dirname+'/../' })
}

module.exports = {
    accessProtectionMiddleware,
    app,
};