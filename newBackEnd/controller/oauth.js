const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client("477838951887-1nrm34upa2qohl2ajkt4oppcn6tumsnp.apps.googleusercontent.com");
//Verify the user from the token
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: "477838951887-1nrm34upa2qohl2ajkt4oppcn6tumsnp.apps.googleusercontent.com",
    });
    //payload contains all the information that is returned form the request
    const payload = ticket.getPayload();
    //sub is the value we should use for the PK
    const userid = payload['sub'];

    return payload;
}

module.exports = {
    verify,
};