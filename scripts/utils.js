async function loadPreferences() {
    const preferences = await browser.storage.sync.get('hnrelevant');
    return preferences.hnrelevant;
}

function savePreferences(preferences) {
    browser.storage.sync.set({ hnrelevant: preferences });
    return preferences;
}

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
    document.getElementById('sidebarResults').innerHTML = '';
    searchQuery.query = optimizeSearchQuery();

    browser.runtime.sendMessage({id: itemId, object: searchQuery}).then((result) => {
        const list = document.createElement('ul');
        list.style.padding = 'unset';
        list.style.listStyle = 'none';

        // if no results, display a message
        if (result.hits.length === 0) {
            const element = document.createElement('li');
            element.style = 'padding: 5px 0; text-align: center; white-space: pre-line;';
            element.textContent = searchQuery.type === 'verbatim' ? 'No matching results found.\r\nTry a different query or switch to \'Similar\' search.' : 'No results found. Try to customize the query.';
            list.appendChild(element);
        }
        result.hits.forEach(hit => {
            const element = displayResult(hit);
            list.appendChild(element);
        });
        document.getElementById('sidebarResults').appendChild(list);
    }
    );
}
