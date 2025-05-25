const HNWords = ['Ask HN', 'Tell HN', 'Show HN', 'Launch HN'];

const stopWords = [
    'about',
    'after',
    'all',
    'also',
    'am',
    'an',
    'and',
    'another',
    'any',
    'are',
    'as',
    'at',
    'be',
    'because',
    'been',
    'before',
    'being',
    'between',
    'both',
    'but',
    'by',
    'came',
    'can',
    'come',
    'could',
    'did',
    'do',
    'does',
    'doing',
    'each',
    'finally',
    'for',
    'from',
    'get',
    'got',
    'has',
    'had',
    'he',
    'have',
    'her',
    'here',
    'him',
    'himself',
    'his',
    'how',
    'if',
    'in',
    'into',
    'is',
    'it',
    'just',
    'like',
    'make',
    'many',
    'maybe',
    'me',
    'might',
    'more',
    'most',
    'much',
    'must',
    'my',
    'never',
    'no',
    'not',
    'now',
    'of',
    'on',
    'once',
    'one',
    'only',
    'or',
    'other',
    'our',
    'out',
    'over',
    'said',
    'same',
    'should',
    'since',
    'so',
    'some',
    'still',
    'such',
    'take',
    'than',
    'that',
    'the',
    'their',
    'them',
    'then',
    'there',
    'these',
    'they',
    'thing',
    'this',
    'those',
    'through',
    'to',
    'too',
    'under',
    'up',
    'very',
    'want',
    'was',
    'way',
    'we',
    'well',
    'were',
    'what',
    'when',
    'where',
    'which',
    'while',
    'who',
    'with',
    'would',
    'you',
    'your',
    'a',
    'i'
]

const contractions = {
    "ain't": "is not",
    "aren't": "are not",
    "can't": "cannot",
    "couldn't": "could not",
    "didn't": "did not",
    "doesn't": "does not",
    "don't": "do not",
    "hadn't": "had not",
    "hasn't": "has not",
    "haven't": "have not",
    "he'd": "he would",
    "he'll": "he will",
    "he's": "he is",
    "i'd": "i would",
    "i'll": "i will",
    "i'm": "i am",
    "i've": "i have",
    "isn't": "is not",
    "it's": "it is",
    "let's": "let us",
    "shouldn't": "should not",
    "that's": "that is",
    "there's": "there is",
    "they'd": "they would",
    "they'll": "they will",
    "they're": "they are",
    "they've": "they have",
    "wasn't": "was not",
    "we'd": "we would",
    "we're": "we are",
    "we've": "we have",
    "weren't": "were not",
    "what's": "what is",
    "where's": "where is",
    "who's": "who is",
    "won't": "will not",
    "wouldn't": "would not",
    "you'd": "you would",
    "you'll": "you will",
    "you're": "you are",
    "you've": "you have"
};

function stripURLs(text) {
    return text.replace(/https?:\/\/[^\s]+/g, ' ')
        .replace(/www\.[^\s]+/g, ' ')
}

function expandContractions(text) {
    return text.replace(/\b\w+'?\w*\b/g, match => {
        return contractions[match.toLowerCase()] || match;
    });
}

function getTermFrequency(text) {
    text = stripURLs(text);
    text = expandContractions(text.toLowerCase());

    const tokens = text
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(token =>
            token.length >= 2 &&
            !HNWords.includes(token) &&
            !stopWords.includes(token)
        )

    // Count frequency of each term
    const frequency = {};
    for (const token of tokens) {
        frequency[token] = (frequency[token] || 0) + 1;
    }

    return frequency;
}

function extractKeywords(title, comments) {
    const titleTerms = getTermFrequency(title);
    const commentTerms = {};

    for (const comment of comments) {
        const termsPerSingleComment = getTermFrequency(comment.textContent);
        for (const [term, freq] of Object.entries(termsPerSingleComment)) {
            // count once per comment to avoid bias
            commentTerms[term] = (commentTerms[term] || 0) + 1;
        }
    }

    // Score terms based on:
    // 1. Frequency in title (weight: 5)
    // 2. Frequency in comments (weight: 1)
    const scores = {};

    for (const [term, freq] of Object.entries(titleTerms)) {
        scores[term] = freq * 5;
    }

    for (const [term, freq] of Object.entries(commentTerms)) {
        scores[term] = (scores[term] || 0) + freq;
    }

    // Sort terms by score and take top 5-7 terms
    const keywords = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 7)
        .map(([term]) => term);

    return keywords;
}