// ==UserScript==
// @name         HNRelevant
// @version      1.5.0
// @description  Adds a "Related Submissions" section to Hacker News
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



const __HNRelevantStorageKey = 'hnrelevant';
const __HNRelevantStyles = "#hnrelevant-controls-container, #hnrelevant-controls {\n    display: flex;\n    gap: 10px\n}\n\n#hnrelevant-controls-container {\n    flex-direction: column;\n}\n\n#hnrelevant-controls {\n    flex-direction: row;\n    flex-wrap: wrap;\n    align-items: center;\n}\n\n#query-customization-container {\n    display: flex;\n    flex-direction: row;\n    align-items: center;\n    margin: 5px 0;\n    padding-right: 10px;\n}\n\n#queryCustomization {\n    flex-grow: 1;\n}\n\n#hnrelevant-results-list {\n    list-style: none;\n    padding: 0;\n    width: 100%;\n    display: flex;\n    flex-direction: column;\n}\n\n#hnrelevant-results-list .result {\n    padding: 5px 0;\n    min-width: 280px;\n}\n\n@media screen and (max-width: 1200px) {\n    #hnrelevant-results {\n        display: grid;\n    }\n\n    #hnrelevant-results-list {\n        flex-direction: row;\n        gap: 10px;\n        overflow-x: auto;\n    }\n\n    #hnrelevant-results-list .result {\n        display: flex;\n        flex-direction: column;\n        justify-content: space-between;\n        border: 1px solid #d3d3d3;\n        border-radius: 5px;\n        padding: 5px;\n    }\n}";

function __HNRelevantInjectStyles() {
    if (document.getElementById('hnrelevant-style')) {
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'hnrelevant-style';
    styleElement.textContent = __HNRelevantStyles;
  (document.head || document.documentElement).appendChild(styleElement);
}

function __HNRelevantSearchUrl(submissionID, searchObject) {
  return 'https://hn.algolia.com/api/v1/search'
    + (searchObject.type === 'verbatim'
      ? '?query=' + encodeURIComponent(searchObject.rawQuery)
      : '?similarQuery=' + encodeURIComponent(searchObject.query))
    + '&tags=story'
    + '&hitsPerPage=' + searchObject.numOfResults
    + '&filters=NOT objectID:' + submissionID
    + '&numericFilters=created_at_i>' + searchObject.date.start + ',created_at_i<' + searchObject.date.end
    + (searchObject.hidePostswithLowComments ? ',num_comments>=' + searchObject.minComments : '');
}

function __HNRelevantFetchSearch(submissionID, searchObject) {
    return fetch(__HNRelevantSearchUrl(submissionID, searchObject)).then(response => response.json());
}

const browser = {
    storage: {
        sync: {
            async get(key) {
                const raw = localStorage.getItem(__HNRelevantStorageKey);
                const stored = raw ? JSON.parse(raw) : null;
                return { [key]: stored };
            },
            async set(value) {
                localStorage.setItem(__HNRelevantStorageKey, JSON.stringify(value.hnrelevant));
            }
        }
    },
    runtime: {
        async sendMessage(message) {
            return __HNRelevantFetchSearch(message.id, message.object);
        },
        onMessage: {
            addListener() {
                return undefined;
            }
        }
    }
};

__HNRelevantInjectStyles();


class TextAnalyzer {
    constructor() {
        this.titleNoiseWords = new Set([
            'acquired',
            'acquires',
            'acquisition',
            'announce',
            'announced',
            'announces',
            'build',
            'built',
            'buy',
            'buys',
            'buying',
            'come',
            'comes',
            'coming',
            'do',
            'does',
            'doing',
            'get',
            'gets',
            'getting',
            'go',
            'goes',
            'going',
            'join',
            'joined',
            'joining',
            'launch',
            'launched',
            'launches',
            'make',
            'made',
            'makes',
            'moving',
            'move',
            'moves',
            'new',
            'raise',
            'raised',
            'raises',
            'release',
            'released',
            'releases',
            'say',
            'says',
            'said',
            'start',
            'started',
            'starts',
            'use',
            'used',
            'uses'
        ]);

        this.stopWords = [
            'about',
            'after',
            'all',
            'also',
            'am',
            'an',
            'and',
            'another',
            'any',
            'are',
            'as',
            'at',
            'ask',
            'be',
            'because',
            'been',
            'before',
            'being',
            'between',
            'both',
            'but',
            'by',
            'came',
            'can',
            'come',
            'could',
            'did',
            'do',
            'does',
            'doing',
            'each',
            'finally',
            'for',
            'from',
            'get',
            'got',
            'has',
            'had',
            'he',
            'have',
            'her',
            'here',
            'him',
            'himself',
            'his',
            'hn',
            'how',
            'if',
            'in',
            'into',
            'is',
            'it',
            'just',
            'launch',
            'like',
            'make',
            'many',
            'maybe',
            'me',
            'might',
            'more',
            'most',
            'much',
            'must',
            'my',
            'never',
            'no',
            'not',
            'now',
            'of',
            'on',
            'once',
            'one',
            'only',
            'or',
            'other',
            'our',
            'out',
            'over',
            'said',
            'same',
            'should',
            'show',
            'since',
            'so',
            'some',
            'still',
            'such',
            'take',
            'tell',
            'than',
            'that',
            'the',
            'their',
            'them',
            'then',
            'there',
            'these',
            'they',
            'thing',
            'think',
            'this',
            'those',
            'through',
            'to',
            'too',
            'under',
            'up',
            'very',
            'want',
            'was',
            'way',
            'we',
            'well',
            'were',
            'what',
            'when',
            'where',
            'which',
            'while',
            'who',
            'will',
            'with',
            'would',
            'you',
            'your',
            'a',
            'i'
        ];

        this.contractions = {
            "ain't": "is not",
            "aren't": "are not",
            "can't": "cannot",
            "couldn't": "could not",
            "didn't": "did not",
            "doesn't": "does not",
            "don't": "do not",
            "hadn't": "had not",
            "hasn't": "has not",
            "haven't": "have not",
            "he'd": "he would",
            "he'll": "he will",
            "he's": "he is",
            "i'd": "i would",
            "i'll": "i will",
            "i'm": "i am",
            "i've": "i have",
            "isn't": "is not",
            "it's": "it is",
            "let's": "let us",
            "shouldn't": "should not",
            "that's": "that is",
            "there's": "there is",
            "they'd": "they would",
            "they'll": "they will",
            "they're": "they are",
            "they've": "they have",
            "wasn't": "was not",
            "we'd": "we would",
            "we're": "we are",
            "we've": "we have",
            "weren't": "were not",
            "what's": "what is",
            "where's": "where is",
            "who's": "who is",
            "won't": "will not",
            "wouldn't": "would not",
            "you'd": "you would",
            "you'll": "you will",
            "you're": "you are",
            "you've": "you have"
        };
    }

    normalizeTitle(title = '') {
        return title
            .replace(/^(ask|show|tell|launch)\s+hn\s*[:\-]?\s*/i, '')
            .replace(/\s*\(\d{4}\)$/, '')
            .trim();
    }

    extractDomainKeyword(url = '') {
        if (!url) return '';

        let hostname = '';
        try {
            hostname = new URL(url).hostname.toLowerCase();
        } catch {
            return '';
        }

        if (!hostname || hostname.includes('ycombinator.com')) {
            return '';
        }

        const ignoreLabels = new Set([
            'www', 'm', 'amp', 'blog', 'news', 'dev', 'docs', 'support',
            'research', 'careers', 'about', 'help', 'status', 'app', 'beta'
        ]);
        const ignoreTlds = new Set([
            'com', 'org', 'net', 'io', 'co', 'uk', 'us', 'dev', 'ai', 'edu', 'gov', 'app'
        ]);

        const labels = hostname.split('.').filter(Boolean);
        const meaningfulLabels = labels.filter(label =>
            !ignoreLabels.has(label) &&
            !ignoreTlds.has(label) &&
            label.length >= 3 &&
            !/^\d+$/.test(label)
        );

        if (!meaningfulLabels.length) {
            return '';
        }

        return meaningfulLabels[0].replace(/[^a-z0-9]/g, '');
    }

    cleanText(text = '') {
        return text
            .toString()
            .toLowerCase()
            .replace(/https?:\/\/[^\s]+/g, ' ')
            .replace(/www\.[^\s]+/g, ' ')
            .replace(/\b\w+'?\w*\b/g, match => {
                return this.contractions[match.toLowerCase()] || match;
            })
            .replace(/[^a-z0-9\s]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .filter(token =>
                token.length >= 2 &&
                !this.stopWords.includes(token)
            )
            .join(' ');
    }

    tokenize(text = '') {
        return this.cleanText(text).split(' ').filter(token => token.length > 0);
    }

    isEntityLike(token = '') {
        return /[A-Z]/.test(token) || /[0-9]/.test(token) || /[a-z][A-Z]/.test(token);
    }

    isMeaningfulTitleToken(token = '') {
        const lowerToken = token.toLowerCase();
        return !!lowerToken &&
            lowerToken.length >= 3 &&
            !this.stopWords.includes(lowerToken) &&
            !this.titleNoiseWords.has(lowerToken);
    }

    extractTitleKeywords(title = '') {
        const normalizedTitle = this.normalizeTitle(title);
        const rawTokens = normalizedTitle.match(/[A-Za-z0-9][A-Za-z0-9'_-]*/g) || [];
        const scoredTokens = [];
        const meaningfulTokens = [];

        rawTokens.forEach((token, index) => {
            const cleanToken = token.replace(/[^A-Za-z0-9]/g, '');
            const lowerToken = cleanToken.toLowerCase();

            if (!cleanToken) return;
            if (this.stopWords.includes(lowerToken)) return;
            if (this.titleNoiseWords.has(lowerToken)) return;
            if (lowerToken.length < 3 && !/^[A-Z0-9]{2,}$/.test(cleanToken)) return;

            meaningfulTokens.push({ token: lowerToken, index });

            let score = 0;

            if (this.isEntityLike(cleanToken)) {
                score += 4;
            }

            if (cleanToken.length >= 8) {
                score += 2;
            } else if (cleanToken.length >= 5) {
                score += 1;
            }

            if (index > 0) {
                score += 0.5;
            }

            if (index === rawTokens.length - 1) {
                score += 6;
            } else if (index >= rawTokens.length - 2) {
                score += 2;
            }

            if (/(ing|ed|es|ize|ify|ate)$/.test(lowerToken) && index !== rawTokens.length - 1) {
                score -= 2;
            }

            scoredTokens.push({ token: lowerToken, score, index });
        });

        if (!scoredTokens.length) {
            return this.tokenize(normalizedTitle).slice(0, 2);
        }

        const selectedTokens = [];

        const entityTokens = scoredTokens
            .filter(entry => this.isEntityLike(entry.token))
            .sort((left, right) => left.index - right.index)
            .map(entry => entry.token);

        for (const token of entityTokens) {
            if (!selectedTokens.includes(token)) selectedTokens.push(token);
            if (selectedTokens.length >= 2) break;
        }

        for (let index = meaningfulTokens.length - 1; index >= 0; index--) {
            const token = meaningfulTokens[index].token;
            if (!selectedTokens.includes(token)) {
                selectedTokens.push(token);
                break;
            }
        }

        const remainingTokens = scoredTokens
            .sort((left, right) => right.score - left.score || left.index - right.index)
            .map(entry => entry.token);

        for (const token of remainingTokens) {
            if (selectedTokens.includes(token)) continue;
            selectedTokens.push(token);
            if (selectedTokens.length >= 3) break;
        }

        return selectedTokens.slice(0, 3);
    }

    shouldUseCommentFallback(titleTerms) {
        if (!titleTerms || !titleTerms.length) return true;

        if (titleTerms.length === 1) {
            const token = titleTerms[0];
            return token.length < 5 || this.titleNoiseWords.has(token);
        }

        return titleTerms.every(token => this.titleNoiseWords.has(token));
    }

    shouldIncludeDomainKeyword(titleTerms, domainKeyword) {
        if (!domainKeyword) return false;
        if (!titleTerms || !titleTerms.length) return true;

        const hasEntityLikeTitle = titleTerms.some(token => this.isEntityLike(token));

        if (titleTerms.length <= 2) return true;
        if (!hasEntityLikeTitle && titleTerms.length <= 3) return true;

        return titleTerms.every(token => this.titleNoiseWords.has(token));
    }

    findTopNGrams(comments, n = 2, topCount = 8, title = '') {
        const ngramFreq = {};
        const titleTerms = new Set(this.tokenize(this.normalizeTitle(title)));

        for (const comment of comments || []) {
            const commentText = comment?.textContent || comment?.text || '';
            const tokens = this.tokenize(commentText);

            for (let index = 0; index <= tokens.length - n; index++) {
                const ngramTokens = tokens.slice(index, index + n);
                if (!ngramTokens.length) continue;

                if (ngramTokens.every(token => titleTerms.has(token))) {
                    continue;
                }

                const ngram = ngramTokens.join(' ');
                ngramFreq[ngram] = (ngramFreq[ngram] || 0) + 1;
            }
        }

        return Object.entries(ngramFreq)
            .sort(([, left], [, right]) => right - left)
            .slice(0, topCount)
            .map(([representative, frequency]) => ({ representative, frequency }));
    }

    extractKeywords(title, comments, url = '') {
        const titleTerms = this.extractTitleKeywords(title);
        const titleTermSet = new Set(titleTerms);
        const usedTerms = new Set();
        const keywords = [];

        const domainKeyword = this.extractDomainKeyword(url);

        for (const titleTerm of titleTerms) {
            if (!usedTerms.has(titleTerm)) {
                keywords.push(titleTerm);
                usedTerms.add(titleTerm);
            }
        }

        if (this.shouldIncludeDomainKeyword(titleTerms, domainKeyword) && !usedTerms.has(domainKeyword)) {
            keywords.push(domainKeyword);
            usedTerms.add(domainKeyword);
        }

        if (keywords.length < 2 && this.shouldUseCommentFallback(titleTerms)) {
            const topNGrams = this.findTopNGrams(comments, 2, 5, title);

            for (const group of topNGrams) {
                if (group.frequency < 2 || keywords.length >= 6) {
                    break;
                }

                const rep = group.representative;
                const repWords = rep.split(' ').filter(Boolean);

                if (!repWords.length || usedTerms.has(rep)) continue;
                if (repWords.some(word => usedTerms.has(word))) continue;
                if (repWords.some(word => word.length < 3)) continue;
                if (repWords.every(word => titleTermSet.has(word))) continue;

                keywords.push(rep);
                usedTerms.add(rep);
                repWords.forEach(word => usedTerms.add(word));
                break;
            }
        }

        return keywords;
    }
}

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
    searchQuery.query = textAnalyzer.normalizeTitle(searchQuery.rawQuery);

    const titleLink = document.querySelector('.fatitem .titleline > a');
    const title = titleLink.textContent;
    const titleUrl = titleLink.href;
    const topLevelComments = document.querySelectorAll('td.ind[indent="0"] + td + td .commtext');
    let keywords = [];

    // Use comments only showing results for the current discussion
    if (searchQuery.rawQuery === title) {
        keywords = textAnalyzer.extractKeywords(searchQuery.query, topLevelComments, titleUrl);
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
    document.getElementById('hnrelevant-results').replaceChildren();
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


let searchQuery = getDefaultPreferences();

let itemId = (new URLSearchParams(document.location.search)).get("id");

function appendOption(select, value, label, selected = false) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = selected;
    select.appendChild(option);
}

function appendRelevantSection(container) {
    const header = document.createElement('h2');
    header.id = 'hnrelevant-header';
    header.textContent = 'Relevant Submissions';
    container.appendChild(header);

    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'hnrelevant-controls-container';

    const queryContainer = document.createElement('div');
    queryContainer.id = 'query-customization-container';

    const queryInput = document.createElement('input');
    queryInput.id = 'queryCustomization';
    queryContainer.appendChild(queryInput);

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.id = 'submitCustomization';
    submitButton.style.marginLeft = '5px';
    submitButton.textContent = 'Submit';
    queryContainer.appendChild(submitButton);
    controlsContainer.appendChild(queryContainer);

    const helpDetails = document.createElement('details');
    const helpSummary = document.createElement('summary');
    helpSummary.textContent = "The results aren't good?";
    helpDetails.appendChild(helpSummary);

    const helpParagraph = document.createElement('p');
    helpParagraph.textContent = 'Try the following:';
    const helpList = document.createElement('ul');
    for (const item of ['Omit years and numbers', 'Remove irrelevant words to avoid noise', 'Scrap the title and use a custom query instead']) {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        helpList.appendChild(listItem);
    }
    helpParagraph.appendChild(helpList);
    helpDetails.appendChild(helpParagraph);
    controlsContainer.appendChild(helpDetails);

    const controls = document.createElement('div');
    controls.id = 'hnrelevant-controls';

    const resultsControl = document.createElement('div');
    const resultsLabel = document.createElement('label');
    resultsLabel.htmlFor = 'numOfResultsDropdown';
    resultsLabel.textContent = 'Num of results';
    const resultsSelect = document.createElement('select');
    resultsSelect.style.marginLeft = '5px';
    resultsSelect.id = 'numOfResultsDropdown';
    appendOption(resultsSelect, '5', '5');
    appendOption(resultsSelect, '10', '10');
    appendOption(resultsSelect, '15', '15', true);
    appendOption(resultsSelect, '20', '20');
    appendOption(resultsSelect, '30', '30');
    resultsControl.appendChild(resultsLabel);
    resultsControl.appendChild(resultsSelect);
    controls.appendChild(resultsControl);

    const dateControl = document.createElement('div');
    const dateLabel = document.createElement('label');
    dateLabel.htmlFor = 'dateRangeDropdown';
    dateLabel.textContent = 'Date';
    const dateSelect = document.createElement('select');
    dateSelect.style.marginLeft = '5px';
    dateSelect.id = 'dateRangeDropdown';
    appendOption(dateSelect, 'Past week', 'Past week');
    appendOption(dateSelect, 'Past month', 'Past month');
    appendOption(dateSelect, 'Past year', 'Past year');
    appendOption(dateSelect, 'All time', 'All time', true);
    appendOption(dateSelect, 'Custom', 'Custom');
    dateControl.appendChild(dateLabel);
    dateControl.appendChild(dateSelect);
    controls.appendChild(dateControl);

    const dateRangeInputContainer = document.createElement('div');
    dateRangeInputContainer.id = 'dateRangeInputContainer';
    dateRangeInputContainer.style.display = 'none';

    const startDateRow = document.createElement('div');
    startDateRow.style.display = 'flex';
    startDateRow.style.flexDirection = 'row';
    startDateRow.style.alignItems = 'center';
    startDateRow.style.gap = '5px';
    const startDateLabel = document.createElement('label');
    startDateLabel.htmlFor = 'startDate';
    startDateLabel.textContent = 'Start';
    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.id = 'startDate';
    startDateInput.style.marginLeft = '5px';
    startDateRow.appendChild(startDateLabel);
    startDateRow.appendChild(startDateInput);

    const endDateRow = document.createElement('div');
    endDateRow.style.display = 'flex';
    endDateRow.style.flexDirection = 'row';
    endDateRow.style.alignItems = 'center';
    endDateRow.style.gap = '5px';
    const endDateLabel = document.createElement('label');
    endDateLabel.htmlFor = 'endDate';
    endDateLabel.textContent = 'End';
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.id = 'endDate';
    endDateInput.style.marginLeft = '5px';
    endDateRow.appendChild(endDateLabel);
    endDateRow.appendChild(endDateInput);

    dateRangeInputContainer.appendChild(startDateRow);
    dateRangeInputContainer.appendChild(endDateRow);
    controls.appendChild(dateRangeInputContainer);

    const searchTypeFieldset = document.createElement('fieldset');
    searchTypeFieldset.style.border = 'none';
    searchTypeFieldset.style.padding = '0';
    searchTypeFieldset.style.display = 'flex';
    searchTypeFieldset.style.flexDirection = 'row';
    searchTypeFieldset.style.alignItems = 'center';
    searchTypeFieldset.style.justifyContent = 'flex-start';
    searchTypeFieldset.style.gap = '5px';

    const searchTypeLegend = document.createElement('legend');
    searchTypeLegend.style.float = 'left';
    searchTypeLegend.style.marginBottom = '5px';
    searchTypeLegend.textContent = 'Search type';
    searchTypeFieldset.appendChild(searchTypeLegend);

    const verbatimControl = document.createElement('div');
    verbatimControl.style.display = 'inline-block';
    const verbatimInput = document.createElement('input');
    verbatimInput.type = 'radio';
    verbatimInput.id = 'verbatim';
    verbatimInput.name = 'searchType';
    verbatimInput.value = 'verbatim';
    verbatimInput.style.marginLeft = '5px';
    const verbatimLabel = document.createElement('label');
    verbatimLabel.htmlFor = 'verbatim';
    verbatimLabel.textContent = 'Verbatim';
    verbatimControl.appendChild(verbatimInput);
    verbatimControl.appendChild(verbatimLabel);
    searchTypeFieldset.appendChild(verbatimControl);

    const similarControl = document.createElement('div');
    similarControl.style.display = 'inline-block';
    const similarInput = document.createElement('input');
    similarInput.type = 'radio';
    similarInput.id = 'similar';
    similarInput.name = 'searchType';
    similarInput.value = 'similar';
    similarInput.checked = true;
    similarInput.style.marginLeft = '5px';
    const similarLabel = document.createElement('label');
    similarLabel.htmlFor = 'similar';
    similarLabel.textContent = 'Similar';
    similarControl.appendChild(similarInput);
    similarControl.appendChild(similarLabel);
    searchTypeFieldset.appendChild(similarControl);
    controls.appendChild(searchTypeFieldset);

    controlsContainer.appendChild(controls);
    container.appendChild(controlsContainer);

    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'hnrelevant-results';
    resultsContainer.style.width = '100%';
    container.appendChild(resultsContainer);
}

function updateData(key, value) {
    searchQuery[key] = value;

    if (searchQuery.mode === 'auto') {
        updateResults();
    }
}

async function installSection() {
    // Submissions and Comments share the same page URL
    // Abort if we are not on a submission page
    if (!document.querySelector('.fatitem .titleline')) {
        return;
    }

    // Load preferences from storage
    // if not present save the default preferences to storage and use them
    searchQuery = await loadPreferences();

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
        tr.appendChild(document.createElement('td'));
        tr.appendChild(document.createElement('td'));
        const td = document.createElement('td');
        td.style.paddingTop = '1rem';
        appendRelevantSection(td);
        tr.appendChild(td);
        const submissionMetadata = hnContent.querySelector('table.fatitem > tbody');
        submissionMetadata.appendChild(tr);
    } else {
        const td = document.createElement('td');
        td.style.minWidth = '280px';
        td.style.width = '25%';
        td.style.verticalAlign = 'baseline';
        td.style.paddingLeft = '10px';
        appendRelevantSection(td);
        hnContent.appendChild(td);
    }

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

if (document.readyState !== 'complete') {
    window.addEventListener('load', installSection);
} else {
    installSection();
}