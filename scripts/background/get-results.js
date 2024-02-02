// Only import in the worker's context which has a different global object, one where 'importScripts' exists.
if( 'function' === typeof importScripts) {
    importScripts("../third-party/browser-polyfill.min.js");
}

async function searchHackerNews(id, type, query, numResults, startDate = 0, endDate = new Date().getTime() / 1000) {
    const url = `https://hn.algolia.com/api/v1/search`
        + (type === 'verbatim' ? `?query=` : `?similarQuery=`)
        + `${encodeURIComponent(query)}`
        + `&tags=story`
        + `&hitsPerPage=${numResults}` // number of results displayed
        + `&filters=NOT objectID:` + id // exclude current submission
        + `&numericFilters=created_at_i>${startDate},created_at_i<${endDate}` // filter by date
    return await fetch(url).then(res => res.json());
}

browser.runtime.onMessage.addListener((msg, sender, result) => {
    searchHackerNews(msg.itemId, msg.searchType, msg.query, msg.numResults, msg.startDate, msg.endDate).then(response => {
        result(response);
    });
    return true;
});