<div><img src="./preview.png" style="min-width: 100%"  width="100%" height="100%" alt="preview of the relevant submissions section on hacker news"/></div>

# HNRelevant
A browser extension that shows related submissions to the one you're viewing on Hacker News. The results are generated on page load and displayed in a sidebar that's embedded into the page.

### Features
- **Seamless and easy to use:** Generated automatically and embedded directly into the page
- **Native look and feel:** Well integrated with the page structure of Hacker News and use global CSS rules like the rest of the site.
- **Fine-tunable query:** If the initial results are not relevant enough (because the submission title is not optimized), you can easily submit a custom query for better results.

### How it works
It's based on [HN algolia search API](https://hn.algolia.com/api) and uses the submission title as its initial query

### How to install
#### Google Chrome:
Available on Chrome web store: [HNRelevant](https://chrome.google.com/webstore/detail/hnrelevant/iajhnkeiioebplnbfkpnlnggkgblmoln)

#### Firefox: 
Firefox add-on: [HNRelevant](https://addons.mozilla.org/en-US/firefox/addon/hnrelevant/)

#### Userscript:
You can run it on other browsers using a userscript extensions like: Tampermonkey, Violentmonkey, or Greasemonkey.
1. Make sure to have one of the userscripts extensions installed
2. Save the userscript file from [here](https://github.com/imdj/HNRelevant/raw/main/HNRelevant.user.js).
3. Load the script into the extension of your choice.

### License
Released under the [MIT License](http://www.opensource.org/licenses/MIT). See [LICENSE](LICENSE) file for details.