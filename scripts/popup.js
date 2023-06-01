const isChrome = chrome.storage.sync ? true : false;

// get references to the input elements
const modeRadioButtons = document.getElementsByName("mode");
const resultsDropdown = document.getElementsByName("results")[0];

if (isChrome) { // load saved settings from storage in Chrome
    chrome.storage.sync.get(["mode", "results"], function (settings) {
        // set the input elements to the saved values
        if (settings.mode) {
            for (const radioButton of modeRadioButtons) {
                if (radioButton.value === settings.mode) {
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
    browser.storage.sync.get(["mode", "results"], function (settings) {
        // set the input elements to the saved values
        if (settings.mode) {
            for (const radioButton of modeRadioButtons) {
                if (radioButton.value === settings.mode) {
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