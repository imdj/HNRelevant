// ==UserScript==
// @name         HNRelevant
// @version      1.4.0
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

let searchQuery = {
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

let itemId = (new URLSearchParams(document.location.search)).get("id");

class TextAnalyzer {
    constructor() {
        this.HNWords = ['ask hn', 'tell hn', 'show hn', 'launch hn'];

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
            'how',
            'if',
            'in',
            'into',
            'is',
            'it',
            'just',
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
            'since',
            'so',
            'some',
            'still',
            'such',
            'take',
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
        ]

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

    cleanText(text) {
        return text
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
                !this.HNWords.includes(token) &&
                !this.stopWords.includes(token)
            )
            .join(' ');
    }

    // Find the top n-grams in the comments
    // group related ones using LCS or character similarity
    findTopNGrams(comments, n = 2, topCount = 10, similarityThreshold = 0.9, title = '') {
        const ngramFreq = {};

        // Extract title keywords for boosting
        const titleKeywords = title ? this.cleanText(title).split(' ').filter(token => token.length > 0) : [];

        // Generate n-grams from all comments
        for (const comment of comments) {
            const cleanedText = this.cleanText(comment.textContent);
            const tokens = cleanedText.split(' ').filter(token => token.length > 0);

            // Generate n-grams
            for (let i = 0; i <= tokens.length - n; i++) {
                const ngram = tokens.slice(i, i + n).join(' ');
                if (ngram.trim()) {
                    let baseFreq = (ngramFreq[ngram] || 0) + 1;

                    // Boost frequency if ngram is similar to title keywords
                    let titleBoost = 0;
                    for (const keyword of titleKeywords) {
                        const similarity = this.calculateStringSimilarity(ngram, keyword);
                        if (similarity >= 0.6) {
                            titleBoost += similarity * 3;
                        }
                    }

                    ngramFreq[ngram] = baseFreq + titleBoost;
                }
            }
        }

        // Sort n-grams by frequency
        const sortedNgrams = Object.entries(ngramFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, topCount * 4);

        // Group similar n-grams
        const groups = [];
        const used = new Set();

        // Group n-grams by similarity
        for (const [ngram, freq] of sortedNgrams) {
            if (used.has(ngram)) continue;

            const group = {
                representative: ngram,
                frequency: freq,
                similar: [ngram]
            };
            used.add(ngram);

            // Find similar n-grams
            for (const [otherNgram, otherFreq] of sortedNgrams) {
                if (used.has(otherNgram) || ngram === otherNgram) continue;

                if (this.calculateStringSimilarity(ngram, otherNgram) >= similarityThreshold) {
                    group.similar.push(otherNgram);
                    group.frequency += otherFreq;
                    used.add(otherNgram);
                }
            }

            groups.push(group);
        }

        // Sort groups by combined frequency and return top results
        return groups
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, topCount);
    }

    calculateStringSimilarity(str1, str2) {
        const norm1 = str1.replace(/\s+/g, '').toLowerCase();
        const norm2 = str2.replace(/\s+/g, '').toLowerCase();

        if (norm1 === norm2) return 1.0;

        // Check for substring containment
        if (norm1.includes(norm2) || norm2.includes(norm1)) {
            const shorterLen = Math.min(norm1.length, norm2.length);
            const longerLen = Math.max(norm1.length, norm2.length);
            return shorterLen / longerLen;
        }

        // Check for word-level similarity
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);
        const wordSet1 = new Set(words1);
        const wordSet2 = new Set(words2);
        const wordIntersection = new Set([...wordSet1].filter(x => wordSet2.has(x)));
        const wordUnion = new Set([...wordSet1, ...wordSet2]);
        const wordJaccard = wordIntersection.size / wordUnion.size;

        if (wordJaccard > 0.3) {
            return wordJaccard;
        }

        // Character-based similarity using LCS
        const minLength = Math.min(norm1.length, norm2.length);
        const maxLength = Math.max(norm1.length, norm2.length);

        if (minLength / maxLength < 0.6) {
            return 0;
        }

        const lcs = this.longestCommonSubsequence(norm1, norm2);
        const lcsSimilarity = (2.0 * lcs) / (norm1.length + norm2.length);

        return lcsSimilarity > 0.7 ? lcsSimilarity : 0;
    }

    longestCommonSubsequence(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        return dp[m][n];
    }

    extractKeywords(title, comments) {
        const titleTerms = this.cleanText(title).split(' ');

        const usedTerms = new Set();
        const keywords = [];

        // Add all title keywords
        for (const titleTerm of titleTerms) {
            if (!usedTerms.has(titleTerm.toLowerCase())) {
                keywords.push(titleTerm);
                usedTerms.add(titleTerm.toLowerCase());
            }
        }

        if (keywords.length <= 5) {
            const topNGrams = this.findTopNGrams(comments, 2, 10, 0.9, title);

            // Add one diverse n-gram
            let addedDiverseNgram = false;
            for (const group of topNGrams.slice(0, 3)) {
                if (keywords.length >= 8 || addedDiverseNgram) break;

                const rep = group.representative;
                const repWords = rep.split(' ');

                if (usedTerms.has(rep.toLowerCase())) continue;

                // Check if similar to title terms
                let isSimilarToTitle = false;
                for (const titleTerm of titleTerms) {
                    const similarity = this.calculateStringSimilarity(rep, titleTerm);
                    const containsTitle = rep.toLowerCase().includes(titleTerm.toLowerCase()) ||
                        repWords.some(word => word.toLowerCase() === titleTerm.toLowerCase());

                    if (similarity > 0.9 || containsTitle) { // Use consistent threshold
                        isSimilarToTitle = true;
                        break;
                    }
                }

                if (!isSimilarToTitle) {
                    const hasUsedWords = repWords.some(word => usedTerms.has(word.toLowerCase()));

                    if (!hasUsedWords) {
                        keywords.push(rep);
                        usedTerms.add(rep.toLowerCase());
                        repWords.forEach(word => usedTerms.add(word.toLowerCase()));
                        addedDiverseNgram = true;
                    }
                }
            }
        }

        return keywords;
    }
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

async function searchHackerNews() {
    searchQuery.query = optimizeSearchQuery();
    const url = `https://hn.algolia.com/api/v1/search`
        + (searchQuery.type === 'verbatim' ? `?query=${encodeURIComponent(searchQuery.rawQuery)}` : `?similarQuery=${encodeURIComponent(searchQuery.query)}`)
        + `&tags=story`
        + `&hitsPerPage=${searchQuery.numOfResults}`
        + `&filters=NOT objectID:` + itemId // exclude current submission
        + `&numericFilters=created_at_i>${searchQuery.date.start},created_at_i<${searchQuery.date.end}` // filter by date
        + (searchQuery.hidePostswithLowComments ? `,num_comments>=${searchQuery.minComments}` : ``) // filter by minimum comments if enabled
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
        <details>
            <summary>The results aren't good?</summary>
            <p>Try the following:
                <ul>
                    <li>Omit years and numbers</li>
                    <li>Remove irrelevant words to avoid noise</li>
                    <li>Scrap the title and use a custom query instead</li>
                </ul>
            </p>
        </details>
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