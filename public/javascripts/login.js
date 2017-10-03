function login() {
    var userData = {};
    userData.username = document.getElementById('username').value;
    userData.password = document.getElementById('password').value;

    $.ajax({
        type: "POST",
        contentType: 'application/json',
        dataType: "json",
        url: "/data/login",
        data: JSON.stringify(userData),
        success: function (result) {
            console.log(JSON.stringify(result, null, 2));
            window.location = '/';
        },
        error: function (error) {
            if (error.status === 401) {
                console.log("Invalid Username or Password")
            }
        }
    });
}