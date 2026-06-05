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