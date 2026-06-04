class TextAnalyzer {
    constructor() {
        this.titleNoiseWords = new Set([
            'acquired',
            'acquires',
            'acquisition',
            'announce',
            'announced',
            'announces',
            'build',
            'built',
            'buy',
            'buys',
            'buying',
            'come',
            'comes',
            'coming',
            'do',
            'does',
            'doing',
            'get',
            'gets',
            'getting',
            'go',
            'goes',
            'going',
            'join',
            'joined',
            'joining',
            'launch',
            'launched',
            'launches',
            'make',
            'made',
            'makes',
            'moving',
            'move',
            'moves',
            'new',
            'raise',
            'raised',
            'raises',
            'release',
            'released',
            'releases',
            'say',
            'says',
            'said',
            'start',
            'started',
            'starts',
            'use',
            'used',
            'uses'
        ]);

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
            'ask',
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
            'hn',
            'how',
            'if',
            'in',
            'into',
            'is',
            'it',
            'just',
            'launch',
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
            'show',
            'since',
            'so',
            'some',
            'still',
            'such',
            'take',
            'tell',
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
        ];

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

    normalizeTitle(title = '') {
        return title
            .replace(/^(ask|show|tell|launch)\s+hn\s*[:\-]?\s*/i, '')
            .replace(/\s*\(\d{4}\)$/, '')
            .trim();
    }

    extractDomainKeyword(url = '') {
        if (!url) return '';

        let hostname = '';
        try {
            hostname = new URL(url).hostname.toLowerCase();
        } catch {
            return '';
        }

        if (!hostname || hostname.includes('ycombinator.com')) {
            return '';
        }

        const ignoreLabels = new Set([
            'www', 'm', 'amp', 'blog', 'news', 'dev', 'docs', 'support',
            'research', 'careers', 'about', 'help', 'status', 'app', 'beta'
        ]);
        const ignoreTlds = new Set([
            'com', 'org', 'net', 'io', 'co', 'uk', 'us', 'dev', 'ai', 'edu', 'gov', 'app'
        ]);

        const labels = hostname.split('.').filter(Boolean);
        const meaningfulLabels = labels.filter(label =>
            !ignoreLabels.has(label) &&
            !ignoreTlds.has(label) &&
            label.length >= 3 &&
            !/^\d+$/.test(label)
        );

        if (!meaningfulLabels.length) {
            return '';
        }

        return meaningfulLabels[0].replace(/[^a-z0-9]/g, '');
    }

    cleanText(text = '') {
        return text
            .toString()
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
                !this.stopWords.includes(token)
            )
            .join(' ');
    }

    tokenize(text = '') {
        return this.cleanText(text).split(' ').filter(token => token.length > 0);
    }

    isEntityLike(token = '') {
        return /[A-Z]/.test(token) || /[0-9]/.test(token) || /[a-z][A-Z]/.test(token);
    }

    isMeaningfulTitleToken(token = '') {
        const lowerToken = token.toLowerCase();
        return !!lowerToken &&
            lowerToken.length >= 3 &&
            !this.stopWords.includes(lowerToken) &&
            !this.titleNoiseWords.has(lowerToken);
    }

    extractTitleKeywords(title = '') {
        const normalizedTitle = this.normalizeTitle(title);
        const rawTokens = normalizedTitle.match(/[A-Za-z0-9][A-Za-z0-9'_-]*/g) || [];
        const scoredTokens = [];
        const meaningfulTokens = [];

        rawTokens.forEach((token, index) => {
            const cleanToken = token.replace(/[^A-Za-z0-9]/g, '');
            const lowerToken = cleanToken.toLowerCase();

            if (!cleanToken) return;
            if (this.stopWords.includes(lowerToken)) return;
            if (this.titleNoiseWords.has(lowerToken)) return;
            if (lowerToken.length < 3 && !/^[A-Z0-9]{2,}$/.test(cleanToken)) return;

            meaningfulTokens.push({ token: lowerToken, index });

            let score = 0;

            if (this.isEntityLike(cleanToken)) {
                score += 4;
            }

            if (cleanToken.length >= 8) {
                score += 2;
            } else if (cleanToken.length >= 5) {
                score += 1;
            }

            if (index > 0) {
                score += 0.5;
            }

            if (index === rawTokens.length - 1) {
                score += 6;
            } else if (index >= rawTokens.length - 2) {
                score += 2;
            }

            if (/(ing|ed|es|ize|ify|ate)$/.test(lowerToken) && index !== rawTokens.length - 1) {
                score -= 2;
            }

            scoredTokens.push({ token: lowerToken, score, index });
        });

        if (!scoredTokens.length) {
            return this.tokenize(normalizedTitle).slice(0, 2);
        }

        const selectedTokens = [];

        const entityTokens = scoredTokens
            .filter(entry => this.isEntityLike(entry.token))
            .sort((left, right) => left.index - right.index)
            .map(entry => entry.token);

        for (const token of entityTokens) {
            if (!selectedTokens.includes(token)) selectedTokens.push(token);
            if (selectedTokens.length >= 2) break;
        }

        for (let index = meaningfulTokens.length - 1; index >= 0; index--) {
            const token = meaningfulTokens[index].token;
            if (!selectedTokens.includes(token)) {
                selectedTokens.push(token);
                break;
            }
        }

        const remainingTokens = scoredTokens
            .sort((left, right) => right.score - left.score || left.index - right.index)
            .map(entry => entry.token);

        for (const token of remainingTokens) {
            if (selectedTokens.includes(token)) continue;
            selectedTokens.push(token);
            if (selectedTokens.length >= 3) break;
        }

        return selectedTokens.slice(0, 3);
    }

    shouldUseCommentFallback(titleTerms) {
        if (!titleTerms || !titleTerms.length) return true;

        if (titleTerms.length === 1) {
            const token = titleTerms[0];
            return token.length < 5 || this.titleNoiseWords.has(token);
        }

        return titleTerms.every(token => this.titleNoiseWords.has(token));
    }

    shouldIncludeDomainKeyword(titleTerms, domainKeyword) {
        if (!domainKeyword) return false;
        if (!titleTerms || !titleTerms.length) return true;

        const hasEntityLikeTitle = titleTerms.some(token => this.isEntityLike(token));

        if (titleTerms.length <= 2) return true;
        if (!hasEntityLikeTitle && titleTerms.length <= 3) return true;

        return titleTerms.every(token => this.titleNoiseWords.has(token));
    }

    findTopNGrams(comments, n = 2, topCount = 8, title = '') {
        const ngramFreq = {};
        const titleTerms = new Set(this.tokenize(this.normalizeTitle(title)));

        for (const comment of comments || []) {
            const commentText = comment?.textContent || comment?.text || '';
            const tokens = this.tokenize(commentText);

            for (let index = 0; index <= tokens.length - n; index++) {
                const ngramTokens = tokens.slice(index, index + n);
                if (!ngramTokens.length) continue;

                if (ngramTokens.every(token => titleTerms.has(token))) {
                    continue;
                }

                const ngram = ngramTokens.join(' ');
                ngramFreq[ngram] = (ngramFreq[ngram] || 0) + 1;
            }
        }

        return Object.entries(ngramFreq)
            .sort(([, left], [, right]) => right - left)
            .slice(0, topCount)
            .map(([representative, frequency]) => ({ representative, frequency }));
    }

    extractKeywords(title, comments, url = '') {
        const titleTerms = this.extractTitleKeywords(title);
        const titleTermSet = new Set(titleTerms);
        const usedTerms = new Set();
        const keywords = [];

        const domainKeyword = this.extractDomainKeyword(url);

        for (const titleTerm of titleTerms) {
            if (!usedTerms.has(titleTerm)) {
                keywords.push(titleTerm);
                usedTerms.add(titleTerm);
            }
        }

        if (this.shouldIncludeDomainKeyword(titleTerms, domainKeyword) && !usedTerms.has(domainKeyword)) {
            keywords.push(domainKeyword);
            usedTerms.add(domainKeyword);
        }

        if (keywords.length < 2 && this.shouldUseCommentFallback(titleTerms)) {
            const topNGrams = this.findTopNGrams(comments, 2, 5, title);

            for (const group of topNGrams) {
                if (group.frequency < 2 || keywords.length >= 6) {
                    break;
                }

                const rep = group.representative;
                const repWords = rep.split(' ').filter(Boolean);

                if (!repWords.length || usedTerms.has(rep)) continue;
                if (repWords.some(word => usedTerms.has(word))) continue;
                if (repWords.some(word => word.length < 3)) continue;
                if (repWords.every(word => titleTermSet.has(word))) continue;

                keywords.push(rep);
                usedTerms.add(rep);
                repWords.forEach(word => usedTerms.add(word));
                break;
            }
        }

        return keywords;
    }
}