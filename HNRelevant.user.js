// ==UserScript==
// @name         HNRelevant
// @version      0.1.3
// @description  Related submissions sidebar for Hacker News
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

        /* Util.js */

        // Render dom element for a search result
        function displayResult(object) {
            const element = document.createElement('li');
            element.style.padding = '5px 0';

            const link = document.createElement('a');
            link.href = object.url;
            link.textContent = object.title;
            link.style.display = 'block';

            element.appendChild(link);
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
            description.insertAdjacentText('beforeend',
                ' | '
                + timestampToRelativeTime(object.created_at)
                + ' | '
            );
            description.appendChild(comments);
            element.appendChild(description);

            return element;
        }

        // Update sidebar content
        function updateSidebarResults() {
            sidebarResults.innerHTML = '';
            searchHackerNews(query, numOfResultsDropdown.value)
                .then(result => {
                    const list = document.createElement('ul');
                    list.style.padding = 'unset';
                    list.style.listStyle = 'none';
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

        /* dom.js */
        /* HN DOM elements */
        const HN_Main = document.querySelector('#hnmain > tbody');
        const HN_navbar = HN_Main.children[0];
        // Since we add a new column to the table for the sidebar, we need to make navbar span the complete row (all columns)
        HN_navbar.children[0].setAttribute('colspan', '100%');
        const HN_Content = HN_Main.children[2];
        const HN_SubmissionTitle = HN_Content.children[0].querySelector('.titleline>a').textContent;
        // Make sure all table data elements are aligned to the top
        // (they're centered vertically by default which causes problem when coupled with long sidebar)
        const HN_TableData = HN_Main.querySelectorAll('td');
        HN_TableData.forEach(td => td.style.verticalAlign = 'baseline');

        /* Sidebar */
        const sidebar = document.createElement('td');
        sidebar.style.minWidth = '250px';
        sidebar.style.width = '25%';
        sidebar.style.verticalAlign = 'baseline';
        sidebar.style.marginLeft = '20px';

        let query = HN_SubmissionTitle;
        const sidebarHeading = document.createElement('h2');
        sidebarHeading.textContent = 'Relevant Submissions';
        const sidebarResults = document.createElement('p')

        /* Sidebar options */
        const sidebarOptionsContainer = document.createElement('div');
        const queryCustomizationContainer = document.createElement('details');
        queryCustomizationContainer.style.margin = '8px 0';
        const queryCustomizationSummary = document.createElement('summary');
        queryCustomizationSummary.textContent = 'Customize query';
        queryCustomizationContainer.appendChild(queryCustomizationSummary);

        const submitCustomizationButton = document.createElement('input');
        submitCustomizationButton.type = 'submit';
        submitCustomizationButton.id = 'submitCustomization';
        submitCustomizationButton.textContent = 'Submit';
        submitCustomizationButton.style.marginLeft = '5px';
        submitCustomizationButton.onclick = () => {
            query = document.getElementById('queryCustomization').value;
            updateSidebarResults();
        };
        const queryCustomizationInput = document.createElement('input');
        queryCustomizationInput.id = 'queryCustomization';
        queryCustomizationInput.style.margin = '5px 0';
        queryCustomizationInput.placeholder = 'Customize: ' + HN_SubmissionTitle;
        queryCustomizationInput.value = HN_SubmissionTitle;

        // Allow user to submit query by pressing enter
        queryCustomizationInput.addEventListener('keydown', function (event) {
            if (event.code === 'Enter' && queryCustomizationInput === document.activeElement) {
                submitCustomizationButton.click();
            }
        });
        queryCustomizationContainer.appendChild(queryCustomizationInput);
        queryCustomizationContainer.appendChild(submitCustomizationButton);
        sidebarOptionsContainer.appendChild(queryCustomizationContainer);

        const numberOfResultsLabel = document.createElement('label');
        numberOfResultsLabel.for = 'numOfResultsDropdown';
        numberOfResultsLabel.textContent = 'Num of results';
        const numOfResultsDropdown = document.createElement('select');
        numOfResultsDropdown.style.marginLeft = '5px';
        numOfResultsDropdown.id = 'numOfResultsDropdown';
        ['5', '10', '15', '20', '30'].forEach(num => {
            numOfResultsDropdown.add(new Option(num));
        });

        sidebarOptionsContainer.appendChild(numberOfResultsLabel);
        sidebarOptionsContainer.appendChild(numOfResultsDropdown);

        /* main.js */
        async function searchHackerNews(query, numResults) {
            const id = (new URLSearchParams(document.location.search)).get("id");
            const url = `https://hn.algolia.com/api/v1/search`
                + `?similarQuery=${query}`
                + `&tags=story`
                + `&hitsPerPage=${numResults}` // number of results displayed
                + `&filters=NOT objectID:` + id; // exclude current submission
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
            updateSidebarResults()
        );
    })();
}, false);

