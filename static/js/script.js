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
    /* Search the item in the input box
    */
    let storage = window.localStorage;
    let item = $("#item-input-id").val().trim();
    let lang = storage.getItem("lang") || "en";
    return await api_request("items/"+convertToId(item), "&lang="+lang);
}

async function getItemRecipe(item_id) {
    /* Obtain possible recipes for an item
    */
    let storage = window.localStorage;
    let lang = storage.getItem("lang") || "en";

    let recipes = await api_request("recipes/search", "&output="+item_id);
    let alternatives = [];
    if (recipes.length > 0) {
        let ingredients = [];
        // For each possible recipe, store related items
        for (let recp_id of recipes) {
            let recp = await api_request("recipes/"+recp_id);
            for (let ingr of recp['ingredients']) {
                let recp_ingr = await api_request("items/"+ingr['id'], "&lang="+lang);
                recp_ingr['count'] = ingr['count'];  // Add this info
                ingredients.push(recp_ingr);
            }
        }
        alternatives.push(ingredients);
    }
    return alternatives;
}

async function refreshMaterials() {
    /* Update user material information and visual icons
     * */
    $("#materials-flag i").removeClass("fa-check");
    $("#materials-flag i").addClass("fa-refresh fa-spin");

    let mat_dict = {};
    api_request("account/materials").then(
        function(resp) {
            // Remap list of dicts into a dict by id
            resp.map((it) => (
                mat_dict[it["id"]] = it["count"]
            ))
            // https://stackoverflow.com/a/13743332/9304067
            localStorage.setItem("materials", JSON.stringify(mat_dict))
            // TODO update materials indicator
            $("#materials-flag i").removeClass("fa-refresh fa-spin");
            $("#materials-flag i").addClass("fa-check");
        }
    );
}

async function updateUserInformation() {
    /* Update user account materials and bank references
    */
    await refreshMaterials();
    // TODO bank references
    console.log("User information updated");
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

    // Update stored data about materials
    // and items
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
        await updateUserInformation();
        $("#loginModal").modal("toggle");
        return true;
    } else {
        // Bad token, show alert
        console.log("bad token");
        storage.removeItem("token");
        _alertGenerator(msg, "danger");
    }
}

function checkUnlocked(item_json, count) {
    /* Check availability in inventory, etc
     * according to the item type
     * return true if user has enough items, false otherwise
    */
    let type = item_json['type'];
    let item_id = item_json['id'];

    if (type == "CraftingMaterial") {
        let materials = JSON.parse(localStorage.getItem("materials"));
        console.log("enough mats", materials[item_id] >= count);
        return materials[item_id] >= count;
    } else {
        console.log("Unsupport type");
        return false;
    }

}

function drawItem(item_json) {
    /* Paint the item in the todo-list according to user's
     * api key.
     * A bit transparent if not unlocked, no transparency if unlocked
     * TODO Also draw related items if it can be crafted
     * TODO Wiki link
    */
    console.log(item_json);
    let _id = item_json['id'];
    let _url = item_json['icon'];
    let _name = item_json['name'];
    let _rarity = item_json['rarity'].toLocaleLowerCase();
    let _recipes = item_json['recipes'];
    let todo_unlocked = checkUnlocked(item_json, 1);


    let recipes_html = "<div>";
    for (let recipe of _recipes) {
        recipes_html += "<div class='d-flex align-content-center'>";
        for (let ingr of recipe) {
            let extra_classes = "";
            let unlocked = checkUnlocked(ingr, ingr['count']);
            if (!unlocked) {
                extra_classes += " not-yet ";
            }
            let wiki_link = "https://wiki.guildwars2.com/index.php?search="+encodeURIComponent(ingr['chat_link'])+"&go=Go&ns0=1";
            let tooltip_title = ingr['name']+ " <a href='"+wiki_link+"' target='_blank'><i class='fa fa-wikipedia-w'></i></a>";
            recipes_html += `<div class="d-flex ingredient pointer me-4`+extra_classes+`">
              <p class="item-count">x`+ingr['count']+`</p>
              <img src="`+ingr['icon']+`" alt="`+ingr['name']+` icon"
                data-bs-toggle="tooltip" data-bs-html="true"
                data-bs-trigger="click"
                title="`+tooltip_title+`">
            </div>`;
        }
        recipes_html += "</div>";
    }
    recipes_html += "</div>";
    // TODO check if item unlocked
    // TODO Get account materials and process them to do this part
    // A way to do this is check specific endpoints according to the
    // item's type
    let wiki_link = "https://wiki.guildwars2.com/index.php?search="+encodeURIComponent(item_json['chat_link'])+"&go=Go&ns0=1";
    let extra_classes = "";
    if (!todo_unlocked) {
        extra_classes += " not-yet ";
    }
    let html = `
    <div id=`+_id+` class="todo-item row d-flex align-items-center mb-4`+extra_classes+`">
      <!-- item image -->
      <div class="col-auto main-item">
        <img class=`+_rarity+` src="`+_url+`" alt="`+_name+` icon">
      </div>
      <!-- related info -->
      <div class="col-auto">
        <h4 class="col-12 align-self-start">
          `+_name+` <a href="`+wiki_link+`" target="_blank"><i class="fa fa-wikipedia-w"></i></a>
        </h4>
        `+recipes_html+`
      </div>
      <i id="delete-`+_id+`" class="todo-delete fa fa-trash" itemId="`+_id+`"></i>
    </div>`;
    $("#item-grid").append(html);
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    $("#"+_id+" .ingredient").on('show.bs.tooltip', function() {
        // Only one tooltip should ever be open at a time
        $('.tooltip').not(this).tooltip('hide');
    });
    $("#delete-"+_id).on("click", removeItem);

}

function addItem() {
    /* Read item chat link from the input text, add it to localStorage
     * and paint it in the todo-list
     */
    let storage = window.localStorage;
    let registered_items = JSON.parse(storage.getItem("items"));
    let input_val = $("#item-input-id").val();
    let item_id = convertToId(input_val);

    if (!registered_items)
        registered_items = [];

    if (registered_items && registered_items.map(it => (it['id'] == item_id)).includes(true)) {
        _alertGenerator("Item already in TODO List", "warning");
    } else {
        search().then(function(resp){
            // Search and store related recipes
            getItemRecipe(resp['id']).then(function(recipes){
                resp['recipes'] = recipes;
                registered_items.push(resp);
                storage.setItem("items", JSON.stringify(registered_items));

                drawItem(resp);
            })
        });
    }
}

function removeItem() {
    let item_id = $(this).attr("itemid");
    $("#"+item_id).remove();
    let items = JSON.parse(localStorage.items);
    items = items.filter( (it) => (it['id'] != item_id) );
    localStorage.setItem("items", JSON.stringify(items));
}

function getUserData() {
    /*
     * Returns all the user data stored in the storage
     *
     **/
    let storage = window.localStorage;
    let items = JSON.parse(storage.getItem("items"));
    if (items)  {
        for (let item of items) {
            drawItem(item);
        }
    }
}


/// NAVBAR FUNCTIONS
function resetToken() {
    /* User wants to change token
    */
    localStorage.clear();
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
    // Header
    $("#resetToken").on("click", resetToken);
    /////
    // Add item row
    $("#item-input-id").on("click", function(){ this.select(); });
    $("#refresh-materials").on("click", refreshMaterials);
    $("#addItem-addon").on("click", addItem);
    $("#item-input-id").on("keydown", function(e){
        console.log("keydown");
        if (e.keyCode == 13) { console.log("enter"); addItem(); }
    });
    //////

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

