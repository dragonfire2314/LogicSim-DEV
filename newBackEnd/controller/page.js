function renderPage(req, res, page, stuffToSend) {
    console.log("Session: ", req.session);

    var isLoggedIn = false;

    console.log(req.session);

    if (req.session.passport)
        var isLoggedIn = ((req.session.passport.user) ? true : false);

    res.render(page, {
        isLoggedIn: isLoggedIn,
        ...stuffToSend
    });
}

//Check if the user can enter a webpage or not
function auth(req, res, next) {
    if (req.session.passport && req.session.passport.user) { //Short circuit magic
        next();
        return;
    }
    //renderPage(req, res, );
    res.send("NOT SIGNED IN. ACCESS DENIED.");
}

module.exports = {
    renderPage,
    auth,
}