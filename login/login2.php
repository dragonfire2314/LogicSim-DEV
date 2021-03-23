<!DOCTYPE html>

<html>

<head>
    <title>Login</title>
    
    <script src="https://apis.google.com/js/platform.js" async defer></script>

    <meta name="google-signin-client_id" content="477838951887-1nrm34upa2qohl2ajkt4oppcn6tumsnp.apps.googleusercontent.com">

    <script>
        function onSignIn(googleUser) {
            console.log("Test");
            var profile = googleUser.getBasicProfile();
            console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
            console.log('Name: ' + profile.getName());
            console.log('Image URL: ' + profile.getImageUrl());
            console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

            var id_token = googleUser.getAuthResponse().id_token;

            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://www.learnlogic.today/tokenSignIn');
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.onload = function() {
                console.log('Signed in as: ' + xhr.responseText);
            };
            xhr.send('idtoken=' + id_token);
        }
    </script>

    <link rel="stylesheet" type="text/css" href="login2.css">
    <link rel="stylesheet" type="text/css" href="header.css">
</head>



<body>
    <?php include 'header.html'; ?>
    <!-- main section -->
    <div class="form">
        <h2 class="elt">Login</h2> 

        <form method="post" action="#" id="login">

         <p class="elt">
            <input type="text" name="email" placeholder="Email" form="login">
        </p>
    <!--
        <p class="elt">
            <input type="text" name="userName" placeholder="Username" form="login">
        </p>
    -->
        <p class="elt">
            <input type="password" name="password" placeholder="Password" form="login">
            
        </p>


        <p class="elt">
            <input type="submit" name="submit" value="Submit" form="login">
            <!--<input type="reset" name="reset" value="Clear Form" form="login"> -->
        </p>
        <p class="elt">
            
        </p>

        </form>
    </div>

</body>

</html>