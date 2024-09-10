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
    if (!token || !verifyToken(token)) {
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
    // Check if user has a session with valid token
    let userLogged = isUserLogged();
    if (!userLogged) {
        $('#loginModal').modal('show');
    } else {
        getUserData();
    }
});

