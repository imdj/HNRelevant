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

async function installSection() {
    // Submissions and Comments share the same page URL
    // Abort if we are not on a submission page
    if (!document.querySelector('.fatitem .titleline')) {
        return;
    }

    // Load preferences from storage
    // if not present save the default preferences to storage and use them
    searchQuery = await loadPreferences() || savePreferences(searchQuery);

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