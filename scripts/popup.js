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

const isChrome = chrome.storage.sync ? true : false;

// get references to the input elements
const modeRadioButtons = document.getElementsByName("mode");
const resultsDropdown = document.getElementsByName("results")[0];
const searchType = document.getElementsByName("searchType");

if (isChrome) { // load saved settings from storage in Chrome
    chrome.storage.sync.get(["mode", "results","searchType"], function (settings) {
        // set the input elements to the saved values
        if (settings.mode) {
            for (const radioButton of modeRadioButtons) {
                if (radioButton.value === settings.mode) {
                    radioButton.checked = true;
                    break;
                }
            }
        }
        if (settings.searchType) {
            for (const radioButton of searchType) {
                if (radioButton.value === settings.searchType) {
                    radioButton.checked = true;
                    break;
                }
            }
        }
        if (settings.results) {
            resultsDropdown.value = settings.results;
        }
    });
} else { // load saved settings from storage in Firefox
    browser.storage.sync.get(["mode", "results","searchType"], function (settings) {
        // set the input elements to the saved values
        if (settings.mode) {
            for (const radioButton of modeRadioButtons) {
                if (radioButton.value === settings.mode) {
                    radioButton.checked = true;
                    break;
                }
            }
        }
        if (settings.searchType) {
            for (const radioButton of searchType) {
                if (radioButton.value === settings.searchType) {
                    radioButton.checked = true;
                    break;
                }
            }
        }
        if (settings.results) {
            resultsDropdown.value = settings.results;
        }
    });
}

// add event listeners to the input elements
for (const radioButton of modeRadioButtons) {
    radioButton.addEventListener("change", function () {
        if (isChrome) { // save the selected mode to storage in Chrome
            chrome.storage.sync.set({mode: this.value});
        } else { // save the selected mode to storage in Firefox
            browser.storage.sync.set({mode: this.value});
        }
    });
}
resultsDropdown.addEventListener("change", function () {
    if (isChrome) { // save the selected results to storage in Chrome
        chrome.storage.sync.set({results: this.value});
    } else { // save the selected results to storage in Firefox
        browser.storage.sync.set({results: this.value});
    }
});

for (const radioButton of searchType) {
    radioButton.addEventListener("change", function () {
        if (isChrome) { // save the selected mode to storage in Chrome
            chrome.storage.sync.set({searchType: this.value});
        } else { // save the selected mode to storage in Firefox
            browser.storage.sync.set({searchType: this.value});
        }
    });
}