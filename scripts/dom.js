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
for (const row of rows) {
    NavbarIndex++;
    if (row.querySelector('td img[src="s.gif"]')) {
        row.querySelector("td").setAttribute("colspan", "100%");
        break;
    }
}

const HN_navbar = HN_Main.children[NavbarIndex];

// Since we add a new column to the table for the sidebar, we need to make navbar span the complete row (all columns)
HN_navbar.children[0].setAttribute('colspan', '100%');
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
const queryCustomizationContainer = document.createElement('details');
queryCustomizationContainer.style.margin = '8px 0';
const queryCustomizationSummary = document.createElement('summary');
queryCustomizationSummary.textContent = 'Customize query';
queryCustomizationContainer.appendChild(queryCustomizationSummary);

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
    style: 'margin: 5px 0;',
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
sidebarOptionsContainer.appendChild(queryCustomizationContainer);

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

sidebarOptionsContainer.appendChild(numberOfResultsLabel);
sidebarOptionsContainer.appendChild(numOfResultsDropdown);
sidebarOptionsContainer.appendChild(dateRangeLabel);
sidebarOptionsContainer.appendChild(dateRangeDropdown);
sidebarOptionsContainer.appendChild(dateRangeInputContainer);
