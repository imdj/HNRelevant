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
const queryCustomization = document.createElement('button');
queryCustomization.id = 'submitCustomization';
queryCustomization.textContent = 'Submit';
queryCustomization.style.marginLeft = '5px';
queryCustomization.onclick = () => {
    query = document.getElementById('queryCustomization').value;
    updateSidebarResults();
};
sidebarOptionsContainer.insertAdjacentHTML('beforeend',
    `<input type="text" id="queryCustomization" placeholder="${HN_SubmissionTitle}" style="margin: 8px 0;"/>`
);
sidebarOptionsContainer.appendChild(queryCustomization);

const numOfResultsDropdown = document.createElement('select');
numOfResultsDropdown.id = 'numOfResultsDropdown';
['5', '10', '15', '20', '30'].forEach(num => {
    numOfResultsDropdown.add(new Option(num));
});

sidebarOptionsContainer.insertAdjacentHTML('beforeend', `<div>Num of results: `);
sidebarOptionsContainer.appendChild(numOfResultsDropdown);
sidebarOptionsContainer.insertAdjacentHTML('beforeend', `</div>`);