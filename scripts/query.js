function optimizeSearchQuery(input) {
    // Remove punctuation
    input = input.replace(/[,;:.!?'"]/g, '');

    input = stripYearFromTitle(input);

    // Remove HN common keywords
    let HNWords = ['Ask HN', 'Tell HN', 'Show HN', 'Launch HN'];
    input = HNWords.reduce((str, word) => str.replace(new RegExp(word, 'gi'), ''), input);

    // Tokenize the sentence into words
    let words = input.toLowerCase().split(' ');

    // Remove stop words
    let stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'and', 'or'];
    words = words.filter(w => !stopWords.includes(w));

    // Apply stemming to the words
    let stems = words.map(w => {
        if (w.length < 3) return w;
        if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y';
        if (w.endsWith('es') && w.length > 3) w = w.slice(0, -2);
        if (w.endsWith('s') && w.length > 2) w = w.slice(0, -1);
        return w;
    });

    let query = stems.join(' ');
    return query;
}