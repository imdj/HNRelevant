async function searchHackerNews(query, numResults) {
    const id = (new URLSearchParams(document.location.search)).get("id");
    const url = `https://hn.algolia.com/api/v1/search`
        + `?similarQuery=${encodeURIComponent(query)}`
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

(async () => {
    // Get preferences from storage
    // Mode: manual or automatic
    const mode = await loadPreference('mode', 'auto');

    // Number of results: default to 5
    numOfResultsDropdown.value = await loadPreference('results', 5);

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
})();