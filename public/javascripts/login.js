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
            window.location = '/';
        },
        error: function (error) {
            if (error.status === 401) {
                //TODO: Display error
            }
        }
    });
}

function handle(e) {
    if (e.keyCode == 13) {
        login();
    }
}