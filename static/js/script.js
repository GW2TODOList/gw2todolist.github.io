/////////////////
//     API     //
/////////////////

async function api_request(endpoint) {
    let storage = window.localStorage;
    return $.ajax({
        url: "https://api.guildwars2.com/v2/" + endpoint + "?access_token=" + storage.getItem("token") + "&v=2024-07-20T01:00:00.000Z",
        method: 'GET',
        dataType: 'json',
        success: function(data) { return data; }
    });
}

async function verifyToken() {
    /**
     * Verify token has the right permissions
     **/
    let token_info = await api_request("tokeninfo")
    console.log(token_info)
    // Token good, check permissions
    const needed_perm = [
        "progression", "wallet", "account", "inventories", "unlocks"
    ];
    let resp_perms = token_info.permissions;
    for (let perm of needed_perm) {
        if (!resp_perms.includes(perm)) {
            console.log("Bad, no ok");
            return [false, "Missing " + perm + " permission in API Token"];
        }
    }
    return [true, ""];
}

/////////////////////////////////
/////////////////////////////////


async function isUserLogged() {
    /*
     * Get and verify user token is exists
     **/
    let storage = window.localStorage;
    if (!storage.getItem("token")) {
        console.log("user not logged");
        return false;
    }
    let [is_ok, _] = await verifyToken();
    if (!is_ok) {
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

async function submitUserToken () {
    /* Store user token in storage, and
     * verify it
    */
    let storage = window.localStorage;
    storage.setItem("token", $("#input_apikey")[0].value);

    let [is_ok, msg] = await verifyToken()
    if (is_ok) {
        console.log("OK");
        $("#loginModal").modal("toggle");
        return true;
    } else {
        // Bad token, show alert
        console.log("bad token");
        storage.removeItem("token");
        let token_alert = _alertGenerator(msg, "danger");
        $("#alert-header").append(token_alert);
    }
}

function resetToken() {
    /* User wants to change token
    */
    let storage = window.localStorage;
    storage.removeItem("token");
    $("#input_apikey").val("");
    $("#loginModal").modal("show");
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
    $("#resetToken").on("click", resetToken);
    $("#item-input-id").on("click", function(){ this.select(); });

    // Check if user has a session with valid token
    isUserLogged().then(function(userLogged){
        console.log(userLogged);
        if (!userLogged) {
            $('#loginModal').modal('show');
        } else {
            getUserData();
        }
    });
});

