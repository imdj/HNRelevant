// ==UserScript==
// @name         HNRelevant
// @version      0.3.1
// @description  Shows relevant submissions on Hacker News
// @author       imdj
// @match        *://news.ycombinator.com/item*
// @connect      *://hn.algolia.com/*
// @icon         https://raw.githubusercontent.com/imdj/HNRelevant/main/icon.png
// @updateURL    https://raw.githubusercontent.com/imdj/HNRelevant/main/HNRelevant.user.js
// @downloadURL  https://raw.githubusercontent.com/imdj/HNRelevant/main/HNRelevant.user.js
// @license      MIT
// @run-at       document-start
// @grant        none
// @inject-into  content
// ==/UserScript==

let searchQuery = {
    mode: "auto", // "auto" or "manual"
    rawQuery: "",
    query: "",
    type: "similar", // "similar" or "verbatim"
    numOfResults: 15,
    date: {
        start: 0,
        end: Math.floor(new Date().getTime() / 1000)
    }
};

let itemId = (new URLSearchParams(document.location.search)).get("id");

function optimizeSearchQuery() {
    // Remove punctuation
    searchQuery.query = searchQuery.rawQuery.replace(/[,;:.!?'"]/g, '');

    searchQuery.query = stripYearFromTitle(searchQuery.query);

    // Remove HN common keywords
    let HNWords = ['Ask HN', 'Tell HN', 'Show HN', 'Launch HN'];
    searchQuery.query = HNWords.reduce((str, word) => str.replace(new RegExp(word, 'gi'), ''), searchQuery.query);

    // Tokenize the sentence into words
    let words = searchQuery.query.toLowerCase().split(' ');

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

    return stems.join(' ');
}

async function searchHackerNews() {
    searchQuery.query = optimizeSearchQuery();
    const url = `https://hn.algolia.com/api/v1/search`
        + (searchQuery.type === 'verbatim' ? `?query=${encodeURIComponent(searchQuery.rawQuery)}` : `?similarQuery=${encodeURIComponent(searchQuery.query)}`)
        + `&tags=story`
        + `&hitsPerPage=${searchQuery.numOfResults}`
        + `&filters=NOT objectID:` + itemId // exclude current submission
        + `&numericFilters=created_at_i>${searchQuery.date.start},created_at_i<${searchQuery.date.end}` // filter by date
        ;

    const response = await fetch(url).then(response => response.json());
    return response;
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
        day: 24 * 60 * 60 * 1000,
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

// i.e. "Title (2021)" -> "Title"
function stripYearFromTitle(title) {
    return title.replace(/\s\(\d{4}\)$/, '');
}

// Render dom element for a search result
function displayResult(object) {
    const element = document.createElement('li');
    element.className = 'result';

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
        domain.href = 'from?site=' + (new URL(object.url)).hostname.replace('www.', '');
        const domainChild = document.createElement('span');
        domainChild.classList.add('sitestr');
        domainChild.textContent = (new URL(object.url)).hostname.replace('www.', '');

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

function updateDateRange() {
    const dateRange = document.getElementById('dateRangeDropdown').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    searchQuery.date.end = Math.floor(new Date().getTime() / 1000);

    switch (dateRange) {
        case 'Past week':
            searchQuery.date.start = searchQuery.date.end - 604800;
            break;
        case 'Past month':
            searchQuery.date.start = searchQuery.date.end - 2592000;
            break;
        case 'Past year':
            searchQuery.date.start = searchQuery.date.end - 31536000;
            break;
        case 'Custom':
            searchQuery.date.start = Math.floor(new Date(startDate).getTime() / 1000) || 0;
            searchQuery.date.end = Math.floor(new Date(endDate).getTime() / 1000) || searchQuery.date.end;
            break;
        default:
            searchQuery.date.start = 0;
    }
}

// Update sidebar content
function updateResults() {
    document.getElementById('hnrelevant-results').innerHTML = '';

    searchHackerNews().then((result) => {
        const list = document.createElement('ul');
        list.id = 'hnrelevant-results-list';

        // if no results, display a message
        if (result.hits.length === 0) {
            const element = document.createElement('li');
            element.className = 'result';
            element.style = 'padding: 5px 0; text-align: center; white-space: pre-line;';
            element.textContent = searchQuery.type === 'verbatim' ? 'No matching results found.\r\nTry a different query or switch to \'Similar\' search.' : 'No results found. Try to customize the query.';
            list.appendChild(element);
        }
        else {
            result.hits.forEach(hit => {
                const element = displayResult(hit);
                list.appendChild(element);
            });
        }
        document.getElementById('hnrelevant-results').appendChild(list);
    });
}

const style = `
#hnrelevant-controls-container, #hnrelevant-controls {
    display: flex;
    gap: 10px
}

#hnrelevant-controls-container {
    flex-direction: column;
}

#hnrelevant-controls {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
}

#query-customization-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 5px 0;
    padding-right: 10px;
}

#queryCustomization {
    flex-grow: 1;
}

#hnrelevant-results-list {
    list-style: none;
    padding: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
}

#hnrelevant-results-list .result {
    padding: 5px 0;
    min-width: 280px;
}

#hnrelevant-results-list .result .titleline > * {
    display: inline-block;
}

@media screen and (max-width: 1200px) {
    #hnrelevant-results {
        display: grid;
    }

    #hnrelevant-results-list {
        flex-direction: row;
        gap: 10px;
        overflow-x: auto;
    }

    #hnrelevant-results-list .result {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border: 1px solid #d3d3d3;
        border-radius: 5px;
        padding: 5px;
    }
}
`;

const relevantContent = `
    <h2 id="hnrelevant-header">Relevant Submissions</h2>
    <div id="hnrelevant-controls-container">
        <div id="query-customization-container">
            <input id="queryCustomization" placeholder="${searchQuery.rawQuery}" value="${searchQuery.query}">
            <button type="submit" id="submitCustomization" style="margin-left: 5px;">Submit</button>
        </div>
        <div id="hnrelevant-controls">
            <div>
                <label for="numOfResultsDropdown">Num of results</label>
                <select style="margin-left: 5px;" id="numOfResultsDropdown">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15" selected>15</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                </select>
            </div>
            <div>
                <label for="dateRangeDropdown">Date</label>
                <select style="margin-left: 5px;" id="dateRangeDropdown">
                    <option value="Past week">Past week</option>
                    <option value="Past month">Past month</option>
                    <option value="Past year">Past year</option>
                    <option value="All time" selected>All time</option>
                    <option value="Custom">Custom</option>
                </select>
            </div>
            <div id="dateRangeInputContainer" style="display: none;">
                <div style="display: flex; flex-direction: row; align-items: center; gap: 5px;">
                    <label for="startDate">Start</label>
                    <input type="date" id="startDate" style="margin-left: 5px;">
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; gap: 5px;">
                    <label for="endDate">End</label>
                    <input type="date" id="endDate" style="margin-left: 5px;">
                </div>
            </div>
            <fieldset style="border: none; padding: 0; display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 5px;">
                <legend style="float: left; margin-bottom: 5px;">Search type</legend>
                <div style="display: inline-block;">
                    <input type="radio" id="verbatim" name="searchType" value="verbatim" style="margin-left: 5px;">
                    <label for="verbatim">Verbatim</label>
                </span>
                <div style="display: inline-block;">
                    <input type="radio" id="similar" name="searchType" value="similar" checked style="margin-left: 5px;">
                    <label for="similar">Similar</label>
                </span>
            </fieldset>
        </div>
    </div>
    <div id="hnrelevant-results" style="width: 100%;">
    </div>
`;

function updateData(key, value) {
    searchQuery[key] = value;

    if (searchQuery.mode === 'auto') {
        updateResults();
    }
}

function installSection() {
    // Submissions and Comments share the same page URL
    // Abort if we are not on a submission page
    if (!document.querySelector('.fatitem .titleline')) {
        return;
    }

    const hnBody = document.querySelector('#hnmain > tbody');
    let NavbarIndex = 0;
    const rows = hnBody.querySelectorAll("tr");

    // handle special case if death banner is present
    if (rows[0].querySelector('td img[src="s.gif"]')) {
        rows[0].querySelector("td").setAttribute("colspan", "2");
        NavbarIndex = 1;
    }

    // Since we add a new column to the table for the sidebar, we need to make navbar span all columns
    const hnNavBar = hnBody.children[NavbarIndex];
    hnNavBar.children[0].setAttribute('colspan', '2');

    const hnContent = hnBody.children[NavbarIndex + 2];
    searchQuery.rawQuery = hnBody.querySelector('.fatitem .titleline > a').textContent;

    // Make sure all table data elements are aligned to the top
    // (they're centered vertically by default which causes problem when coupled with long sidebar)
    hnBody.querySelectorAll(':scope > tr > td').forEach(td => td.style.verticalAlign = 'top');

    if (window.innerWidth < 1200) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.innerHTML = relevantContent;
        td.style = 'padding-top: 1rem;';
        tr.innerHTML = '<td></td><td></td>';
        tr.appendChild(td);
        const submissionMetadata = hnContent.querySelector('table.fatitem > tbody');
        submissionMetadata.appendChild(tr);
    } else {
        const td = document.createElement('td');
        td.style = 'min-width: 280px; width: 25%; vertical-align: baseline; padding-left: 10px;';
        td.innerHTML = relevantContent;
        hnContent.appendChild(td);
    }

    // inject styles
    const styleElement = document.createElement('style');
    styleElement.textContent = style;
    document.head.appendChild(styleElement);
    
    document.getElementById('queryCustomization').placeholder = searchQuery.rawQuery;
    document.getElementById('queryCustomization').value = searchQuery.rawQuery;
    document.getElementById('numOfResultsDropdown').value = searchQuery.numOfResults;

    document.getElementsByName('searchType').forEach((radio) => {
        radio.checked = radio.value === searchQuery.type;
    });

    if (searchQuery.mode === 'auto') {
        updateResults();
    }

    document.getElementById('numOfResultsDropdown').addEventListener('change', () => {
        updateData('numOfResults', document.getElementById('numOfResultsDropdown').value);
    });
    document.getElementById('dateRangeDropdown').addEventListener('change', () => {
        updateDateRange();
        updateData('date', searchQuery.date);
    });
    document.getElementById('startDate').addEventListener('change', () => {
        updateDateRange();
        updateData('date', searchQuery.date);
    });
    document.getElementById('endDate').addEventListener('change', () => {
        updateDateRange();
        updateData('date', searchQuery.date);
    });

    document.getElementById('dateRangeDropdown').addEventListener('change', (event) => {
        if (event.target.value === 'Custom') {
            document.getElementById('dateRangeInputContainer').style = 'display: flex; flex-direction: row; gap: 5px;';
        } else {
            document.getElementById('dateRangeInputContainer').style.display = 'none';
        }
    });

    document.getElementsByName('searchType').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            updateData('type', event.target.value);
        });
    });

    document.getElementById('submitCustomization').addEventListener('click', () => {
        searchQuery.rawQuery = document.getElementById('queryCustomization').value;
        updateResults();
    });

    document.getElementById('queryCustomization').addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchQuery.rawQuery = document.getElementById('queryCustomization').value;
            updateResults();
        }
    });
}

window.addEventListener('load', () => {
        'use strict';
        installSection();
});