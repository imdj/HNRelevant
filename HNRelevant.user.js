// ==UserScript==
// @name         HNRelevant
// @version      0.1.10
// @description  Shows relevant submissions on Hacker News
// @author       imdj
// @match        https://news.ycombinator.com/item*
// @icon         https://raw.githubusercontent.com/imdj/HNRelevant/main/icon.png
// @run-at       document-start
// @grant        none
// @inject-into content
// ==/UserScript==

window.addEventListener('load', function () {
    (function () {
        'use strict';

/* query.js */
function optimizeSearchQuery(input) {
    // Remove punctuation
    input = input.replace(/[,;:.!?'"]/g, '');

    // Remove HN common keywords
    let HNWords = ['Ask HN', 'Tell HN', 'Show HN'];
    input = HNWords.reduce((str, word) => str.replace(new RegExp(word, 'gi'), ''), input);

    // Tokenize the sentence into words
    let words = input.toLowerCase().split(' ');

    // Remove stop words
    let stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'and', 'or'];
    words = words.filter(w => !stopWords.includes(w));

    // Apply stemming to the words
    let stems = words.map(w => {
        if (w.length < 3) return w;
        if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y';
        if (w.endsWith('es') && w.length > 3) w = w.slice(0, -2);
        if (w.endsWith('s') && w.length > 2) w = w.slice(0, -1);
        return w;
    });

    // Join the words with + to optimize for search 
    let query = stems.join(' ');
    return query;
}

/* utils.js */
// load preference from storage
function loadPreference(key, defaultValue) {
    if (chrome.storage) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(key, result => {
                resolve(result[key] || defaultValue);
            });
        });
    } else { // Firefox
        return browser.storage.sync.get(key).then(result => {
            return result[key] || defaultValue;
        });
    }
}

// Render dom element for a search result
function displayResult(object) {
    const element = document.createElement('li');
    element.style.padding = '5px 0';

    const titleContainer = document.createElement('span');
    titleContainer.style.display = 'block';
    titleContainer.classList.add('titleline');
    const link = document.createElement('a');
    link.href = object.url ? object.url : 'item?id=' + object.objectID;
    link.textContent = object.title;
    link.rel = 'no-referrer';

    titleContainer.appendChild(link);

    if (object.url) {
        const domainContainer = document.createElement('span');
        domainContainer.classList.add('sitebit', 'comhead');
        const domain = document.createElement('a');
        domain.href = 'from?site=' + (new URL(object.url)).hostname.replace('www.','');
        const domainChild = document.createElement('span');
        domainChild.classList.add('sitestr');
        domainChild.textContent = (new URL(object.url)).hostname.replace('www.','');

        domain.appendChild(domainChild);
        domainContainer.appendChild(domain);
        domain.insertAdjacentText('beforebegin', '(');
        domain.insertAdjacentText('afterend', ')');
        titleContainer.appendChild(domainContainer);
    }
    element.appendChild(titleContainer);

    const description = document.createElement('span');
    description.className = 'subtext';
    const author = document.createElement('a');
    author.href = 'user?id=' + object.author;
    author.textContent = object.author;
    const comments = document.createElement('a');
    comments.href = 'item?id=' + object.objectID;
    comments.textContent = object.num_comments + ' comments';
    description.insertAdjacentText('afterbegin',
        object.points + ' points '
        + 'by '
    );
    description.appendChild(author);
    description.insertAdjacentText('beforeend', ' | ');

    const timeurl = document.createElement('a');
    timeurl.href = 'item?id=' + object.objectID;
    timeurl.title = object.created_at;

    const time = document.createElement('time');
    time.dateTime = object.created_at;
    time.textContent = timestampToRelativeTime(object.created_at);
    timeurl.appendChild(time);

    description.appendChild(timeurl);
    
    description.insertAdjacentText('beforeend', ' | ');
    description.appendChild(comments);
    element.appendChild(description);

    return element;
}

// Update sidebar content
function updateSidebarResults() {
    sidebarResults.innerHTML = '';

    // Get search type
    const searchType = document.querySelector('input[name="searchType"]:checked')
        ? document.querySelector('input[name="searchType"]:checked').value
        : 'similar';

    let endDate = new Date().getTime() / 1000;
    let startDate;
    switch (dateRangeDropdown.value) {
        case 'Past week':
            startDate = endDate - 604800;
            break;
        case 'Past month':
            startDate = endDate - 2592000;
            break;
        case 'Past year':
            startDate = endDate - 31536000;
            break;
        case 'Custom':
            const startDateValue = document.getElementById('startDate').value;
            const endDateValue = document.getElementById('endDate').value;
            
            // if one of the dates is not set, use the default value
            endDate = endDateValue ? new Date(endDateValue).getTime() / 1000 : endDate;
            startDate = startDateValue ? new Date(startDateValue).getTime() / 1000 : 0;
            break;
        default:
            startDate = 0;
    }

    searchHackerNews(searchType, query, numOfResultsDropdown.value, startDate, endDate)
        .then(result => {
            const list = document.createElement('ul');
            list.style.padding = 'unset';
            list.style.listStyle = 'none';

            // if no results, display a message
            if (result.hits.length === 0) {
                const element = document.createElement('li');
                element.style = 'padding: 5px 0; text-align: center; white-space: pre-line;';
                element.textContent = searchType === 'verbatim' ? 'No matching results found.\r\nTry a different query or switch to \'Similar\' search.' : 'No results found. Try to customize the query.';
                list.appendChild(element);
            }
            result.hits.forEach(hit => {
                const element = displayResult(hit);
                list.appendChild(element);
            });
            sidebarResults.appendChild(list);
        })
        .catch(error => {
            sidebarResults.textContent = `An error occurred: ${error.message}`;
        });
}

// Get relative time from timestamp
function timestampToRelativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    let rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

    const units = {
        year: 365 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        hour: 60 * 60 * 1000,
        minute: 60 * 1000
    };

    for (const unit in units) {
        if (diff > units[unit]) {
            const time = Math.round(diff / units[unit]);
            return rtf.format(-time, unit);
        }
    }

    return rtf.format(-Math.round(diff / 1000), 'second');
}

/* dom.js */
function createElement(tag, attributes, children) {
    const element = document.createElement(tag);
    if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
    }
    if (children) {
        for (const child of children) {
            element.appendChild(child);
        }
    }
    return element;
}

/* HN DOM elements */
const HN_Main = document.querySelector('#hnmain > tbody');
let NavbarIndex = 0;
const rows = HN_Main.querySelectorAll("tr");

// handle special case if death banner is present
if (rows[0].querySelector('td img[src="s.gif"]')) {
    rows[0].querySelector("td").setAttribute("colspan", "2");
    NavbarIndex = 1;
}

const HN_navbar = HN_Main.children[NavbarIndex];

// Since we add a new column to the table for the sidebar, we need to make navbar span the complete row (all columns)
HN_navbar.children[0].setAttribute('colspan', '2');
const HN_Content = HN_Main.children[NavbarIndex + 2];
const HN_SubmissionTitle = HN_Content.children[0].querySelector('.titleline>a').textContent;
// Make sure all table data elements are aligned to the top
// (they're centered vertically by default which causes problem when coupled with long sidebar)
const HN_TableData = HN_Main.querySelectorAll('td');
HN_TableData.forEach(td => td.style.verticalAlign = 'baseline');

/* Sidebar */
const sidebar = createElement('td', {
    style: 'min-width: 250px; width: 25%; vertical-align: baseline; margin-left: 20px;'
});

let query = HN_SubmissionTitle;
const sidebarHeading = createElement('h2', {}, [document.createTextNode('Relevant Submissions')]);
const sidebarResults = document.createElement('p')

/* Sidebar options */
const sidebarOptionsContainer = document.createElement('div');
const queryCustomizationDetails = document.createElement('details');
queryCustomizationDetails.style.margin = '8px 0';
const queryCustomizationSummary = document.createElement('summary');
queryCustomizationSummary.textContent = 'Customize query';
queryCustomizationDetails.appendChild(queryCustomizationSummary);

const queryCustomizationContainer = createElement('div', {
    style: 'display: flex; flex-direction: row; align-items: center; padding-right: 10px;'
});

const submitCustomizationButton = createElement('button', {
    type: 'submit',
    id: 'submitCustomization',
    style: 'margin-left: 5px;'
}, [document.createTextNode('Submit')]);

submitCustomizationButton.onclick = () => {
    query = document.getElementById('queryCustomization').value;
    updateSidebarResults();
};

const queryCustomizationInput = createElement('input', {
    id: 'queryCustomization',
    style: 'margin: 5px 0; flex-grow: 1;',
    placeholder: 'Customize: ' + HN_SubmissionTitle,
    value: HN_SubmissionTitle
});


// Allow user to submit query by pressing enter
queryCustomizationInput.addEventListener('keydown', function (event) {
    if (event.code === 'Enter' && queryCustomizationInput === document.activeElement) {
        submitCustomizationButton.click();
    }
});

queryCustomizationContainer.appendChild(queryCustomizationInput);
queryCustomizationContainer.appendChild(submitCustomizationButton);
queryCustomizationDetails.appendChild(queryCustomizationContainer);
sidebarOptionsContainer.appendChild(queryCustomizationDetails);

const numberOfResultsLabel = createElement('label', {
    for: 'numOfResultsDropdown'
}, [document.createTextNode('Num of results')]);
const numOfResultsDropdown = createElement('select', {
    style: 'margin-left: 5px;',
    id: 'numOfResultsDropdown'
}, ['5', '10', '15', '20', '30'].map(num => {
    return new Option(num, num);
}));

// Set initial value for numOfResultsDropdown
numOfResultsDropdown.value = 15;

// create date range dropdown
const dateRangeLabel = createElement('label', {
    for: 'dateRangeDropdown',
    style: 'margin-left: 5px;'
}, [document.createTextNode('Date')]);
const dateRangeDropdown = createElement('select', {
    style: 'margin-left: 5px;',
    id: 'dateRangeDropdown',
}, [ 'Past week', 'Past month', 'Past year', 'All time', 'Custom'].map(num => {
    return new Option(num, num);
}));

// Set initial value for dateRangeDropdown
dateRangeDropdown.value = 'All time';

// create date range input if custom is selected
const dateRangeInputContainer = document.createElement('div');
dateRangeInputContainer.style.display = 'none';
dateRangeInputContainer.style.margin = '5px 0';
const startDateInput = createElement('input', {
    type: 'date',
    id: 'startDate',
    style: 'margin-left: 5px;'
});
const endDateInput = createElement('input', {
    type: 'date',
    id: 'endDate',
    style: 'margin-left: 5px;'
});
dateRangeInputContainer.appendChild(startDateInput);
dateRangeInputContainer.appendChild(endDateInput);

// handle date range dropdown change
dateRangeDropdown.addEventListener('change', () => {
    if (dateRangeDropdown.value === 'Custom') {
        dateRangeInputContainer.style.display = 'block';
    } else {
        dateRangeInputContainer.style.display = 'none';
    }
});

// search type radio buttons
const searchTypeContainer = document.createElement('div');

const searchTypeLabel = createElement('label', {
    for: 'searchType',
    style: 'margin-left: 5px;'
}, [document.createTextNode('Search type')]);
const verbatimSearch = createElement('input', {
    type: 'radio',
    name: 'searchType',
    value: 'verbatim',
    style: 'margin-left: 5px;'
});
const similarSearch = createElement('input', {
    type: 'radio',
    name: 'searchType',
    value: 'similar',
    checked: true,
    style: 'margin-left: 5px;'
});

searchTypeContainer.appendChild(searchTypeLabel);
searchTypeContainer.appendChild(verbatimSearch);
searchTypeContainer.appendChild(document.createTextNode('Verbatim'));
searchTypeContainer.appendChild(similarSearch);
searchTypeContainer.appendChild(document.createTextNode('Similar'));


sidebarOptionsContainer.appendChild(numberOfResultsLabel);
sidebarOptionsContainer.appendChild(numOfResultsDropdown);
sidebarOptionsContainer.appendChild(dateRangeLabel);
sidebarOptionsContainer.appendChild(dateRangeDropdown);
sidebarOptionsContainer.appendChild(dateRangeInputContainer);
sidebarOptionsContainer.appendChild(searchTypeContainer);


/* main.js */
async function searchHackerNews(type, query, numResults, startDate = 0, endDate = new Date().getTime() / 1000) {
    query = type === 'verbatim' ? query : optimizeSearchQuery(query);

    const id = (new URLSearchParams(document.location.search)).get("id");
    const url = `https://hn.algolia.com/api/v1/search`
        + (type === 'verbatim' ? `?query=` : `?similarQuery=`)
        + `${encodeURIComponent(query)}`
        + `&tags=story`
        + `&hitsPerPage=${numResults}` // number of results displayed
        + `&filters=NOT objectID:` + id // exclude current submission
        + `&numericFilters=created_at_i>${startDate},created_at_i<${endDate}` // filter by date
    return await fetch(url).then(res => res.json());
}

// Append elements
sidebar.appendChild(sidebarHeading);
sidebar.appendChild(sidebarOptionsContainer);
sidebar.appendChild(sidebarResults);
HN_Content.appendChild(sidebar);

        // Make sure to run this after the page has loaded
        updateSidebarResults();
        
        // Run on dropdown change (changing num of results: 5, 10, 15, 20, 30)
        numOfResultsDropdown.addEventListener('change', () =>
           updateSidebarResults());
    
        // Run on dropdown change (changing date range: past week, past month, past year, all time)
        dateRangeDropdown.addEventListener('change', () =>
            updateSidebarResults());
    
        // Run on date range input change
        startDateInput.addEventListener('change', () =>
            updateSidebarResults());
    
        endDateInput.addEventListener('change', () =>
            updateSidebarResults());

        // Run on change of search type (verbatim or similar)
        document.querySelectorAll('input[name="searchType"]').forEach(radio => {
            radio.addEventListener('change', () => 
            updateSidebarResults());
        });
})();
});
