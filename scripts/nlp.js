class TextAnalyzer {
    constructor() {
        this.HNWords = ['ask hn', 'tell hn', 'show hn', 'launch hn'];

        this.stopWords = [
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
            'think',
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
            'will',
            'with',
            'would',
            'you',
            'your',
            'a',
            'i'
        ]

        this.contractions = {
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
    }

    cleanText(text) {
        return text
            .toLowerCase()
            .replace(/https?:\/\/[^\s]+/g, ' ')
            .replace(/www\.[^\s]+/g, ' ')
            .replace(/\b\w+'?\w*\b/g, match => {
                return this.contractions[match.toLowerCase()] || match;
            })
            .replace(/[^a-z0-9\s]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .filter(token =>
                token.length >= 2 &&
                !this.HNWords.includes(token) &&
                !this.stopWords.includes(token)
            )
            .join(' ');
    }

    // Find the top n-grams in the comments
    // group related ones using LCS or character similarity
    findTopNGrams(comments, n = 2, topCount = 10, similarityThreshold = 0.9, title = '') {
        const ngramFreq = {};

        // Extract title keywords for boosting
        const titleKeywords = title ? this.cleanText(title).split(' ').filter(token => token.length > 0) : [];

        // Generate n-grams from all comments
        for (const comment of comments) {
            const cleanedText = this.cleanText(comment.textContent);
            const tokens = cleanedText.split(' ').filter(token => token.length > 0);

            // Generate n-grams
            for (let i = 0; i <= tokens.length - n; i++) {
                const ngram = tokens.slice(i, i + n).join(' ');
                if (ngram.trim()) {
                    let baseFreq = (ngramFreq[ngram] || 0) + 1;

                    // Boost frequency if ngram is similar to title keywords
                    let titleBoost = 0;
                    for (const keyword of titleKeywords) {
                        const similarity = this.calculateStringSimilarity(ngram, keyword);
                        if (similarity >= 0.6) {
                            titleBoost += similarity * 3;
                        }
                    }

                    ngramFreq[ngram] = baseFreq + titleBoost;
                }
            }
        }

        // Sort n-grams by frequency
        const sortedNgrams = Object.entries(ngramFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, topCount * 4);

        // Group similar n-grams
        const groups = [];
        const used = new Set();

        // Group n-grams by similarity
        for (const [ngram, freq] of sortedNgrams) {
            if (used.has(ngram)) continue;

            const group = {
                representative: ngram,
                frequency: freq,
                similar: [ngram]
            };
            used.add(ngram);

            // Find similar n-grams
            for (const [otherNgram, otherFreq] of sortedNgrams) {
                if (used.has(otherNgram) || ngram === otherNgram) continue;

                if (this.calculateStringSimilarity(ngram, otherNgram) >= similarityThreshold) {
                    group.similar.push(otherNgram);
                    group.frequency += otherFreq;
                    used.add(otherNgram);
                }
            }

            groups.push(group);
        }

        // Sort groups by combined frequency and return top results
        return groups
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, topCount);
    }

    calculateStringSimilarity(str1, str2) {
        const norm1 = str1.replace(/\s+/g, '').toLowerCase();
        const norm2 = str2.replace(/\s+/g, '').toLowerCase();

        if (norm1 === norm2) return 1.0;

        // Check for substring containment
        if (norm1.includes(norm2) || norm2.includes(norm1)) {
            const shorterLen = Math.min(norm1.length, norm2.length);
            const longerLen = Math.max(norm1.length, norm2.length);
            return shorterLen / longerLen;
        }

        // Check for word-level similarity
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);
        const wordSet1 = new Set(words1);
        const wordSet2 = new Set(words2);
        const wordIntersection = new Set([...wordSet1].filter(x => wordSet2.has(x)));
        const wordUnion = new Set([...wordSet1, ...wordSet2]);
        const wordJaccard = wordIntersection.size / wordUnion.size;

        if (wordJaccard > 0.3) {
            return wordJaccard;
        }

        // Character-based similarity using LCS
        const minLength = Math.min(norm1.length, norm2.length);
        const maxLength = Math.max(norm1.length, norm2.length);

        if (minLength / maxLength < 0.6) {
            return 0;
        }

        const lcs = this.longestCommonSubsequence(norm1, norm2);
        const lcsSimilarity = (2.0 * lcs) / (norm1.length + norm2.length);

        return lcsSimilarity > 0.7 ? lcsSimilarity : 0;
    }

    longestCommonSubsequence(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        return dp[m][n];
    }

    extractKeywords(title, comments) {
        const titleTerms = this.cleanText(title).split(' ');

        const usedTerms = new Set();
        const keywords = [];

        // Add all title keywords
        for (const titleTerm of titleTerms) {
            if (!usedTerms.has(titleTerm.toLowerCase())) {
                keywords.push(titleTerm);
                usedTerms.add(titleTerm.toLowerCase());
            }
        }

        if (keywords.length <= 5) {
            const topNGrams = this.findTopNGrams(comments, 2, 10, 0.9, title);

            // Add one diverse n-gram
            let addedDiverseNgram = false;
            for (const group of topNGrams.slice(0, 3)) {
                if (keywords.length >= 8 || addedDiverseNgram) break;

                const rep = group.representative;
                const repWords = rep.split(' ');

                if (usedTerms.has(rep.toLowerCase())) continue;

                // Check if similar to title terms
                let isSimilarToTitle = false;
                for (const titleTerm of titleTerms) {
                    const similarity = this.calculateStringSimilarity(rep, titleTerm);
                    const containsTitle = rep.toLowerCase().includes(titleTerm.toLowerCase()) ||
                        repWords.some(word => word.toLowerCase() === titleTerm.toLowerCase());

                    if (similarity > 0.9 || containsTitle) { // Use consistent threshold
                        isSimilarToTitle = true;
                        break;
                    }
                }

                if (!isSimilarToTitle) {
                    const hasUsedWords = repWords.some(word => usedTerms.has(word.toLowerCase()));

                    if (!hasUsedWords) {
                        keywords.push(rep);
                        usedTerms.add(rep.toLowerCase());
                        repWords.forEach(word => usedTerms.add(word.toLowerCase()));
                        addedDiverseNgram = true;
                    }
                }
            }
        }

        return keywords;
    }
}