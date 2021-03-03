function renderPage(req, res, page, stuffToSend) {
    console.log("Session: ", req.session);

    var isLoggedIn = false;

    if (req.session.passport)
        var isLoggedIn = ((req.session.passport.user) ? true : false);

    res.render(page, {
        isLoggedIn: isLoggedIn,
        ...stuffToSend
    });
}

module.exports = {
    renderPage,
}