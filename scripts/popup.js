const permissionsToRequest = {
    origins: ["*://news.ycombinator.com/*", "*://hn.algolia.com/api/*"]
}

function requestPermission() {
    browser.permissions.request(permissionsToRequest);
    window.close();
}

(async () => {
    const permissionStatus = await browser.permissions.contains(permissionsToRequest);
 
    if (!permissionStatus) {
        document.body.innerHTML = "";

        const description = document.createElement("p");
        description.textContent = "HNRelevant needs some permissions to access Hacker News and Algolia API to fetch results.";
        description.style = "padding: 0.5em; margin-bottom: 1em;";
        document.body.appendChild(description);

        const grantPermissionButton = document.createElement("button");
        grantPermissionButton.textContent = "Grant Permission";
        grantPermissionButton.style = "font-size: 1.5em; padding: 0.5em; margin: 0.5em; border: 0; border-radius: 0.5em; background-color: #ff6600; color: white; cursor: pointer;";
        grantPermissionButton.addEventListener("click", requestPermission);

        document.body.appendChild(grantPermissionButton);
    }
})();


// get references to the input elements
const modeRadioButtons = document.getElementsByName("mode");
const resultsDropdown = document.getElementById("results");
const searchType = document.getElementsByName("searchType");

async function initPopup() {
    const preferences = await loadPreferences() || savePreferences({
        mode: "auto", // "auto" or "manual"
        rawQuery: "",
        query: "",
        type: "similar", // "similar" or "verbatim"
        numOfResults: 15,
        date: {
            start: 0,
            end: new Date().getTime() / 1000
        }
    });

    // set the input elements to the saved values
    for (const radioButton of modeRadioButtons) {
        if (radioButton.value === preferences.mode) {
            radioButton.checked = true;
            break;
        }
    }
    for (const radioButton of searchType) {
        if (radioButton.value === preferences.type) {
            radioButton.checked = true;
            break;
        }
    }
    resultsDropdown.value = preferences.numOfResults;

    // add event listeners to the input elements
    for (const radioButton of modeRadioButtons) {
        radioButton.addEventListener("change", (event) => {
            preferences.mode = event.target.value;
            savePreferences(preferences);
        });
    }
    resultsDropdown.addEventListener("change", (event) => {
        preferences.numOfResults = event.target.value;
        savePreferences(preferences);
        }
    );

    for (const radioButton of searchType) {
        radioButton.addEventListener("change", (event) => {
            preferences.type = event.target.value;
            savePreferences(preferences);
        });
    }
}

initPopup();