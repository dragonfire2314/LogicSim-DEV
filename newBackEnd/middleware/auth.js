function auth(req, res, next) {
    if (!req.session || !req.session.clientId) {
        const err = new Error("Failed to log in");
        err.statusCode = 401;
        next(err);
    }
    next();
}

module.exports = auth;