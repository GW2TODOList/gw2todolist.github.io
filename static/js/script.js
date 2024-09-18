/////////////////
//     API     //
/////////////////

async function api_request(endpoint, args="") {
    let storage = window.localStorage;
    return $.ajax({
        url: "https://api.guildwars2.com/v2/" + endpoint + "?access_token=" + storage.getItem("token") + "&v=2024-07-20T01:00:00.000Z" + args,
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

function convertToId(chatLink) {
    // Took from https://wiki.guildwars2.com/wiki/Talk:Chat_link_format
    // Thank you very much. I simplified it to only return id
    if (!chatLink.trim()) {
        return "noitem";
    }
    const clean_chatLink = chatLink.slice(2,-1);
    const base64Decoded = atob(clean_chatLink).split("");
    const hexCodes = base64Decoded.map(c => "0x" + c.charCodeAt(0).toString(16))
    const bytes = hexCodes.map(h => parseInt(h, 16))
    return bytes[2] << 0 | bytes[3] << 8 | bytes[4] << 16;
}

async function search() {
    let storage = window.localStorage;
    let item = $("#item-input-id").val().trim();
    let lang = storage.getItem("lang") || "en";
    return await api_request("items/"+convertToId(item), "&lang="+lang);
}

/////////////////////////////////
/////////////////////////////////

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
      </div>`;
    $("#alert-header").append(html);
}

async function isUserLogged() {
    /* Get and verify user token is exists
     */
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

async function submitUserToken() {
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
        _alertGenerator(msg, "danger");
    }
}

function drawItem(item_json){
    /* Paint the item in the todo-list according to user's
     * api key.
     * A bit transparent if not unlocked, no transparency if unlocked
     * TODO Also draw related items if it can be crafted
     * TODO Wiki link
    */
    console.log(item_json);
    let _url = item_json['icon'];
    let _name = item_json['name'];
    let _rarity = item_json['rarity'];
    // TODO check if item unlocked
    let html = `
    <div class="row d-flex align-items-center mb-4">
      <!-- item image -->
      <div class="col-auto">
        <img src="`+_url+`" alt="`+_name+` icon">
      </div>
      <!-- related info -->
      <div class="col-auto">
        <h4 class="col-12 align-self-start">
          `+_name+`
        </h4>
        <div class="row">
          <div class="col-auto">
            Thing 1
          </div>
          <div class="col-auto">
            Thing 2
          </div>
        </div>
      </div>
    </div>`
    $("#item-grid").append(html);

}

function addItem() {
    /* Read item chat link from the input text, add it to localStorage
     * and paint it in the todo-list
     */
    let storage = window.localStorage;
    let registered_items = storage.getItem("items");
    let input_val = $("#item-input-id").val();
    let item_id = convertToId(input_val);

    if (!registered_items)
        registered_items = []
    else
        registered_items = registered_items.split(",").map((x) => parseInt(x));

    if (registered_items && registered_items.includes(item_id)) {
        console.log("alert");
        _alertGenerator("Item already in TODO List", "warning");
    } else {
        search().then(function(resp){
            registered_items.push(item_id);
            storage.setItem("items", registered_items);
            drawItem(resp);
        });
    }

}

function getUserData() {
    /*
     * Returns all the user data stored in the storage
     *
     **/
    let storage = window.localStorage;
    // TODO Draw user items
}




/// NAVBAR FUNCTIONS
function resetToken() {
    /* User wants to change token
    */
    let storage = window.localStorage;
    storage.removeItem("token");
    $("#input_apikey").val("");
    $("#loginModal").modal("show");
}
////////////////////


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
    $("#addItem-addon").on("click", addItem);
    $("#item-input-id").on("keydown", function(e){
        console.log("keydown");
        if (e.keyCode == 13) { console.log("enter"); addItem(); }
    });

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

