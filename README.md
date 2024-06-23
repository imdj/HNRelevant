<div><img src="./preview.png" style="min-width: 100%" alt="preview of the relevant submissions section on hacker news"/></div>

![Chrome Web Store](https://img.shields.io/chrome-web-store/v/iajhnkeiioebplnbfkpnlnggkgblmoln?logo=googlechrome&logoColor=000000&labelColor=F3F3F3&color=4285F4)
![Mozilla Add-on Stars](https://img.shields.io/amo/v/hnrelevant?logo=firefoxbrowser&logoColor=FFFFFF&labelColor=2E1068&color=F5541F)

# HNRelevant
A lightweight browser extension that augments your Hacker News experience by showing related submissions to the one you're viewing. It helps you immerse yourself in interesting discussions and uncover overlooked gems.

## Features
- Related submissions ready to be explored
- Ability to fine-tune the search query and fetch results in place
- Two modes:
    - Automatic: Enjoy a seamless experience with results generated upon page load
    - Manual: Search only when desired
- The result blends naturally with Hacker News's interface and match its look and feel
- Available on Firefox for Android™<span><img height="16" src="https://source.android.com/static/docs/setup/images/Android_symbol_green_RGB.svg"/></span>
- Manageable preferences via the extension's popup in the browser toolbar

## Installation
<div>
<a href="https://chromewebstore.google.com/detail/hnrelevant-related-storie/iajhnkeiioebplnbfkpnlnggkgblmoln" target="_blank" style="margin: 0 10px;">
    <img height ="56px" src="https://www.siteimprove.com/globalassets/media/shared/page-specific/integrations/browser-extensions/chrome-webstore.png" alt="HNRelevant on Chrome Web Store" />
</a>
<a href="https://addons.mozilla.org/en-US/firefox/addon/hnrelevant/" target="_blank" style="margin: 0 10px;">
    <img height ="56px" src="https://extensionworkshop.com/assets/img/documentation/publish/get-the-addon-178x60px.dad84b42.png" alt="HNRelevant on Firefox add-ons" />
</a>
</div>

Available on:
- **Chrome web store**: [HNRelevant](https://chromewebstore.google.com/detail/hnrelevant-related-storie/iajhnkeiioebplnbfkpnlnggkgblmoln)
- **Firefox (Desktop & Android) add-on**: [HNRelevant](https://addons.mozilla.org/en-US/firefox/addon/hnrelevant/)
- As a **Userscript**. This option also has the benefit of supporting further browsers:
    1. Make sure to have one of the userscripts extensions installed e.g: Tampermonkey, Violentmonkey, or Greasemonkey.
    2. The userscript file can be found here [HNRelevant.user.js](https://github.com/imdj/HNRelevant/raw/main/HNRelevant.user.js).
    3. Load the script into the extension of your choice.

## How it works
It's based on [HN algolia search API](https://hn.algolia.com/api) and uses the submission title as its initial query

## License
Released under the [MIT License](http://www.opensource.org/licenses/MIT). See [LICENSE](LICENSE) file for details.
