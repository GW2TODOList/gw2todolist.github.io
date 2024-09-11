function isUserLogged() {
    /*
     * Get and verify user token is exists
     **/
    let storage = window.localStorage;
    if (!storage.getItem("token")) {
        console.log("user not logged");
        return false;
    }
    token = storage.getItem("token");
    if (!token || !verifyToken(token)[0]) {
        console.log("bad token");
        return false;
    }
    return true;
}

function getUserData() {
    /*
     * Returns all the user data stored in the storage
     *
     **/
    let storage = window.localStorage;
}

function _alertGenerator(text, color) {
    /* Template for alerts
    */
    $("#alert-header").html("");
    let html = `
      <div class="alert alert-`+color+` d-flex align-items-center alert-dismissible fade show" role="alert">
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
        <div>
    ` + text + `
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      </div>`
    return html;
}

function submitUserToken() {
    /* Store user token in storage, and
     * verify it
    */
    let storage = window.localStorage;
    storage.setItem("token", $("#input_apikey")[0].value);
    // api.js
    let [is_ok, msg] = verifyToken();
    if (is_ok) {
        // Token ok, remove modal and load things
    } else {
        // Bad token, show toast
        storage.removeItem("token");
        let token_alert = _alertGenerator(msg, "danger");
        $("#alert-header").append(token_alert);
    }
}


function offsetNav() {
    var navbar = document.getElementById("navbar");
    var offset = navbar.offsetHeight;
    return offset;
}

/* ====== SCROLL ANYWHERE ====== */
function scrollToIt(section) {
    var sectionHeight = $(section.toString()).offset().top;
    var offset = 84;

    var distance = sectionHeight - offset / 5;

    $(window).scrollTop(distance);
}


$(document).ready(function() {
    $("#loginModal button").on("click", submitUserToken);

    // Check if user has a session with valid token
    let userLogged = isUserLogged();
    if (!userLogged) {
        $('#loginModal').modal('show');
    } else {
        getUserData();
    }
});

