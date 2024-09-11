function api_request(endpoint) {
    let storage = window.localStorage;
    return $.ajax({
        url: "https://api.guildwars2.com/v2/" + endpoint + "?access_token=" + storage.getItem("token") + "&v=2024-07-20T01:00:00.000Z",
        method: 'GET',
        dataType: 'json'
    });
}

function verifyToken() {
    /**
     * Verify token has the right permissions
     **/
    let token_info = api_request("tokeninfo");
    let response_code = token_info.status;
    if (response_code != 200) {
        // Token error
        console.log(token_info);
        return [false, "Bad token"];
    } else {
        // Token good, check permissions
        const needed_perm = [
            "progression", "wallet", "account", "inventories", "unlocks"
        ];
        let resp_perms = token_info.responseJSON.permissions;
        for (let perm of needed_perm) {
            if (!resp_perms.includes(perm)) {
                return [false, "Missing " + perm + " permission in API Token"];
            }
        }
        return [true, ""]
    }
}


function login() {
    /*
     * Verify user token and save data in storage
     **/
    let storage = window.localStorage;
    // Verify token
    let token_ok = verifyToken();
    if (token_ok) {
        return true;
    } else {
        return false;
    }
}

