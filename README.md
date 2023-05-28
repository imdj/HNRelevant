<img src="preview.png" style="width: 100%"  alt="preview of the relevant submissions section on hacker news"/>

# HNRelevant
Chrome extension that shows related submissions to the one you're viewing on Hacker News. The results are generated on page load and displayed in a sidebar that's embedded into the page.

### Features
- **Seamless and easy to use:** Generated automatically and embedded directly into the page
- **Native look and feel:** Well integrated with the page structure of Hacker News and use global CSS rules like the rest of the site.
- **Fine-tunable query:** If the initial results are not relevant enough (because the submission title is not optimized), you can easily submit a custom query for better results.

### How it works
It's based on [HN algolia search API](https://hn.algolia.com/api) and uses the submission title as its initial query

### How to install
1. Clone the repo
2. Open Chrome and go to `chrome://extensions/`
3. Enable `Developer mode`
4. Click on `Load unpacked extension...` and select the repo folder

### License
Released under the [MIT License](http://www.opensource.org/licenses/MIT). See [LICENSE](LICENSE) file for details.