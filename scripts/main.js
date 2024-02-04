// Append elements
sidebar.appendChild(sidebarHeading);
sidebar.appendChild(sidebarOptionsContainer);
sidebar.appendChild(sidebarResults);
HN_Content.appendChild(sidebar);

(async () => {
    // Get preferences from storage
    // Mode: manual or automatic
    const mode = await loadPreference('mode', 'auto');

    // Number of results: default to 5
    numOfResultsDropdown.value = await loadPreference('results', 5);
    dateRangeDropdown.value = 'All time';

    // Search type: verbatim or similar (default to similar)
    const searchType = await loadPreference('searchType', 'similar');
    document.querySelector(`input[name="searchType"][value="${searchType}"]`).checked = true;

    // Don't run if mode is set to `manual`
    if (mode !== 'manual') {
        // Make sure to run this after the page has loaded
        if (document.readyState !== 'complete') {
            window.addEventListener('load', updateSidebarResults);
        } else {
            updateSidebarResults();
        }
    }

    // Run on dropdown change (changing num of results: 5, 10, 15, 20, 30)
    numOfResultsDropdown.addEventListener('change', () => {
        if (mode !== 'manual') {
            updateSidebarResults();
        }
    });

    // Run on dropdown change (changing date range: past week, past month, past year, all time)
    dateRangeDropdown.addEventListener('change', () => {
        if (mode !== 'manual') {
            updateSidebarResults();
        }
    });

    // Run on date range input change
    startDateInput.addEventListener('change', () => {
        if (mode !== 'manual') {
            updateSidebarResults();
        }
    });

    endDateInput.addEventListener('change', () => {
        if (mode !== 'manual') {
            updateSidebarResults();
        }
    });

    // Run on change of search type (verbatim or similar)
    document.querySelectorAll('input[name="searchType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (mode !== 'manual') {
                updateSidebarResults();
            }
        });
    });
})();