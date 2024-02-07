// Only import in the worker's context which has a different global object, one where 'importScripts' exists.
if( 'function' === typeof importScripts) {
    importScripts("../third-party/browser-polyfill.min.js");
}

async function searchHackerNews(submissionID, searchObject) {
    const url = `https://hn.algolia.com/api/v1/search`
        + (searchObject.type === 'verbatim' ? `?query=${encodeURIComponent(searchObject.rawQuery)}` : `?similarQuery=${encodeURIComponent(searchObject.query)}`)
        + `&tags=story`
        + `&hitsPerPage=${searchObject.numOfResults}`
        + `&filters=NOT objectID:` + submissionID // exclude current submission
        + `&numericFilters=created_at_i>${searchObject.date.start},created_at_i<${searchObject.date.end}` // filter by date
        ;

    const response = await fetch(url).then(response => response.json());
    return response;
}

browser.runtime.onMessage.addListener((msg, sender, result) => {
    searchHackerNews(msg.id, msg.object).then(response => {
        result(response);
    });
    return true;
});