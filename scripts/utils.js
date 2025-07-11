const DEFAULT_PREFERENCES = {
    mode: "auto", // "auto" or "manual"
    rawQuery: "",
    query: "",
    type: "similar", // "similar" or "verbatim"
    numOfResults: 15,
    hidePostswithLowComments: true,
    minComments: 3,
    date: {
        start: 0,
        end: Math.floor(new Date().getTime() / 1000)
    }
};

function getDefaultPreferences() {
    return {
        ...DEFAULT_PREFERENCES,
        date: {
            ...DEFAULT_PREFERENCES.date,
            end: Math.floor(new Date().getTime() / 1000)
        }
    };
}

async function loadPreferences() {
    const stored = await browser.storage.sync.get('hnrelevant');
    const storedPreferences = stored.hnrelevant;

    if (!storedPreferences) {
        return getDefaultPreferences();
    }

    const mergedPreferences = {
        ...getDefaultPreferences(),
        ...storedPreferences,
        date: {
            ...getDefaultPreferences().date,
            ...(storedPreferences.date || {})
        }
    };

    // Save the merged preferences back to ensure new fields are persisted
    savePreferences(mergedPreferences);
    
    return mergedPreferences;
}

function savePreferences(preferences) {
    browser.storage.sync.set({ hnrelevant: preferences });
    return preferences;
}

function optimizeSearchQuery() {
    const textAnalyzer = new TextAnalyzer();
    searchQuery.query = stripYearFromTitle(searchQuery.rawQuery);

    const title = document.querySelector('.fatitem .titleline > a').textContent;
    const topLevelComments = document.querySelectorAll('td.ind[indent="0"] + td + td .commtext');    
    let keywords = [];

    // Use comments only showing results for the current discussion
    if (searchQuery.rawQuery === title) {
        keywords = textAnalyzer.extractKeywords(searchQuery.query, topLevelComments);
        searchQuery.query = keywords.join(' ');
    }

    return searchQuery.query;
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
        domain.insertAdjacentText('beforebegin', ' (');
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
    searchQuery.query = optimizeSearchQuery();

    browser.runtime.sendMessage({id: itemId, object: searchQuery}).then((result) => {
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
