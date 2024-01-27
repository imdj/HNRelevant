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
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    const year = 365 * day;

    if (diff < hour) {
        return Math.floor(diff / minute) + " minute" + (diff < 2 * minute ? "" : "s") + " ago";
    } else if (diff < day) {
        return Math.floor(diff / hour) + " hour" + (diff < 2 * hour ? "" : "s") + " ago";
    } else if (diff < month) {
        return Math.floor(diff / day) + " day" + (diff < 2 * day ? "" : "s") + " ago";
    } else if (diff < year) {
        return Math.floor(diff / month) + " month" + (diff < 2 * month ? "" : "s") + " ago";
    } else {
        return Math.floor(diff / year) + " year" + (diff < 2 * year ? "" : "s") + " ago";
    }
}