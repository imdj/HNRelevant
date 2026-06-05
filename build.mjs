import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(rootDir, 'output');
const packagesDir = path.join(outputDir, 'packages');
const manifestBasePath = path.join(rootDir, 'manifest.base.json');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageLockPath = path.join(rootDir, 'package-lock.json');

const FIREFOX_DATA_COLLECTION = {
  required: ['searchTerms']
};

const TARGETS = {
  mv2: {
    manifestPath: path.join(outputDir, 'manifest.v2.json'),
    zipName: (version) => `HNRelevant-manifest.v2-v${version}.zip`,
    manifestVersion: 2,
    pathPrefix: './',
    outputIconPrefix: './',
    permissions: [
      'storage',
      '*://hn.algolia.com/api/*',
      '*://news.ycombinator.com/*'
    ],
    background: {
      scripts: [
        './scripts/third-party/browser-polyfill.min.js',
        './scripts/background/get-results.js'
      ]
    },
    browserAction: true,
    applications: {
      gecko: {
        id: 'hnrelevant@extensions.imdj.dev',
        strict_min_version: '79.0',
        data_collection_permissions: FIREFOX_DATA_COLLECTION
      }
    }
  },
  mv3Chrome: {
    manifestPath: path.join(outputDir, 'manifest.v3.chrome.json'),
    zipName: (version) => `HNRelevant-manifest.v3.chrome-v${version}.zip`,
    manifestVersion: 3,
    pathPrefix: '',
    outputIconPrefix: '',
    permissions: ['storage'],
    host_permissions: [
      '*://hn.algolia.com/api/*',
      '*://news.ycombinator.com/*'
    ],
    background: {
      service_worker: 'scripts/background/get-results.js'
    },
    action: true
  },
  mv3Firefox: {
    manifestPath: path.join(outputDir, 'manifest.v3.firefox.json'),
    zipName: (version) => `HNRelevant-manifest.v3.firefox-v${version}.zip`,
    manifestVersion: 3,
    pathPrefix: './',
    outputIconPrefix: './',
    permissions: ['storage'],
    host_permissions: [
      '*://hn.algolia.com/api/*',
      '*://news.ycombinator.com/*'
    ],
    background: {
      scripts: [
        './scripts/third-party/browser-polyfill.min.js',
        './scripts/background/get-results.js'
      ]
    },
    action: true,
    browser_specific_settings: {
      gecko: {
        id: 'hnrelevant@extensions.imdj.dev',
        strict_min_version: '140.0',
        data_collection_permissions: FIREFOX_DATA_COLLECTION
      },
      gecko_android: {
        strict_min_version: '142.0'
      }
    }
  }
};

function readJson(filePath) {
  return fs.readFile(filePath, 'utf8').then((content) => JSON.parse(content));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function syncPackageLockVersion(version) {
  if (!fsSync.existsSync(packageLockPath)) return;

  const packageLock = await readJson(packageLockPath);
  packageLock.version = version;
  if (packageLock.packages?.['']) {
    packageLock.packages[''].version = version;
  }
  await writeJson(packageLockPath, packageLock);
}

function bumpVersion(currentVersion, bumpType) {
  if (!bumpType) return currentVersion;

  const parts = currentVersion.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Invalid semantic version: ${currentVersion}`);
  }

  if (bumpType === 'major') {
    return `${parts[0] + 1}.0.0`;
  }

  if (bumpType === 'minor') {
    return `${parts[0]}.${parts[1] + 1}.0`;
  }

  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

function parseArgs(argv) {
  const args = { bump: null, userscriptOnly: false, manifestsOnly: false };

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];

    if (token === '--major') args.bump = 'major';
    else if (token === '--minor') args.bump = 'minor';
    else if (token === '--patch') args.bump = 'patch';
    else if (token === '--userscript-only') args.userscriptOnly = true;
    else if (token === '--manifests-only') args.manifestsOnly = true;
    else if (token === '--version') {
      args.explicitVersion = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function prefixPath(target, value) {
  if (typeof value !== 'string') return value;
  if (!value || value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('./') || value.startsWith('/')) return value;

  return `${target.pathPrefix}${value}`;
}

function prefixPathArray(target, values = []) {
  return values.map((value) => prefixPath(target, value));
}

function transformManifest(baseManifest, target, version) {
  const manifest = JSON.parse(JSON.stringify(baseManifest));

  manifest.manifest_version = target.manifestVersion;
  manifest.version = version;
  manifest.icons = Object.fromEntries(
    Object.entries(manifest.icons || {}).map(([key, value]) => [key, prefixPath(target, value)])
  );

  manifest.content_scripts = (manifest.content_scripts || []).map((entry) => ({
    ...entry,
    js: prefixPathArray(target, entry.js),
    css: prefixPathArray(target, entry.css)
  }));

  if (target.permissions) {
    manifest.permissions = target.permissions;
  }

  if (target.host_permissions) {
    manifest.host_permissions = target.host_permissions;
  }

  if (target.background) {
    manifest.background = {
      ...target.background
    };
    if (manifest.background.scripts) {
      manifest.background.scripts = prefixPathArray(target, manifest.background.scripts);
    }
    if (manifest.background.service_worker) {
      manifest.background.service_worker = prefixPath(target, manifest.background.service_worker);
    }
  }

  if (target.browserAction) {
    manifest.browser_action = {
      default_icon: Object.fromEntries(
        Object.entries(baseManifest.icons || {}).map(([key, value]) => [key, prefixPath(target, value)])
      ),
      default_popup: prefixPath(target, 'popup.html'),
      default_title: 'HNRelevant'
    };
  }

  if (target.action) {
    manifest.action = {
      default_icon: Object.fromEntries(
        Object.entries(baseManifest.icons || {}).map(([key, value]) => [key, prefixPath(target, value)])
      ),
      default_popup: prefixPath(target, 'popup.html'),
      default_title: 'HNRelevant'
    };
  }

  if (target.applications) {
    manifest.applications = target.applications;
  }

  if (target.browser_specific_settings) {
    manifest.browser_specific_settings = target.browser_specific_settings;
  }

  return manifest;
}

async function ensureCleanDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyTree(source, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, { recursive: true });
}

function userscriptPrelude(cssText) {
  return `
const __HNRelevantStorageKey = 'hnrelevant';
const __HNRelevantStyles = ${JSON.stringify(cssText)};

function __HNRelevantInjectStyles() {
    if (document.getElementById('hnrelevant-style')) {
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'hnrelevant-style';
    styleElement.textContent = __HNRelevantStyles;
  (document.head || document.documentElement).appendChild(styleElement);
}

function __HNRelevantSearchUrl(submissionID, searchObject) {
  return 'https://hn.algolia.com/api/v1/search'
    + (searchObject.type === 'verbatim'
      ? '?query=' + encodeURIComponent(searchObject.rawQuery)
      : '?similarQuery=' + encodeURIComponent(searchObject.query))
    + '&tags=story'
    + '&hitsPerPage=' + searchObject.numOfResults
    + '&filters=NOT objectID:' + submissionID
    + '&numericFilters=created_at_i>' + searchObject.date.start + ',created_at_i<' + searchObject.date.end
    + (searchObject.hidePostswithLowComments ? ',num_comments>=' + searchObject.minComments : '');
}

function __HNRelevantFetchSearch(submissionID, searchObject) {
    return fetch(__HNRelevantSearchUrl(submissionID, searchObject)).then(response => response.json());
}

const browser = {
    storage: {
        sync: {
            async get(key) {
                const raw = localStorage.getItem(__HNRelevantStorageKey);
                const stored = raw ? JSON.parse(raw) : null;
                return { [key]: stored };
            },
            async set(value) {
                localStorage.setItem(__HNRelevantStorageKey, JSON.stringify(value.hnrelevant));
            }
        }
    },
    runtime: {
        async sendMessage(message) {
            return __HNRelevantFetchSearch(message.id, message.object);
        },
        onMessage: {
            addListener() {
                return undefined;
            }
        }
    }
};

__HNRelevantInjectStyles();
`;
}

async function buildUserscript(version, cssText) {
  const header = `// ==UserScript==
// @name         HNRelevant
// @version      ${version}
// @description  Adds a "Related Submissions" section to Hacker News
// @author       imdj
// @match        *://news.ycombinator.com/item*
// @connect      *://hn.algolia.com/*
// @icon         https://raw.githubusercontent.com/imdj/HNRelevant/main/icon.png
// @updateURL    https://raw.githubusercontent.com/imdj/HNRelevant/main/HNRelevant.user.js
// @downloadURL  https://raw.githubusercontent.com/imdj/HNRelevant/main/HNRelevant.user.js
// @license      MIT
// @run-at       document-start
// @grant        none
// @inject-into  content
// ==/UserScript==
`;

  const sourceFiles = [
    path.join(rootDir, 'scripts', 'nlp.js'),
    path.join(rootDir, 'scripts', 'utils.js'),
    path.join(rootDir, 'scripts', 'main.js')
  ];

  const sourceBody = await Promise.all(sourceFiles.map((filePath) => fs.readFile(filePath, 'utf8')));

  const userscript = [header, userscriptPrelude(cssText), ...sourceBody].join('\n\n');
  const userscriptPath = path.join(rootDir, 'HNRelevant.user.js');
  await fs.writeFile(userscriptPath, userscript, 'utf8');
}

async function zipDirectory(sourceDir, zipPath) {
  const { default: archiver } = await import('archiver');

  await new Promise((resolve, reject) => {
    const outputStream = fsSync.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    outputStream.on('close', resolve);
    outputStream.on('error', reject);
    archive.on('warning', (warning) => {
      if (warning.code === 'ENOENT') return;
      reject(warning);
    });
    archive.on('error', reject);

    archive.pipe(outputStream);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function buildPackage(targetKey, baseManifest, version) {
  const target = TARGETS[targetKey];
  const manifest = transformManifest(baseManifest, target, version);

  await writeJson(target.manifestPath, manifest);

  const stagingDir = path.join(outputDir, 'staging', targetKey);
  await ensureCleanDir(stagingDir);
  const packageVersionDir = path.join(packagesDir, `v${version}`);
  await fs.mkdir(packageVersionDir, { recursive: true });

  await copyTree(path.join(rootDir, 'LICENSE'), path.join(stagingDir, 'LICENSE'));
  await copyTree(path.join(rootDir, 'popup.html'), path.join(stagingDir, 'popup.html'));
  await copyTree(path.join(rootDir, 'scripts'), path.join(stagingDir, 'scripts'));
  await copyTree(path.join(rootDir, 'assets'), path.join(stagingDir, 'assets'));
  await copyTree(path.join(rootDir, 'css'), path.join(stagingDir, 'css'));

  await writeJson(path.join(stagingDir, 'manifest.json'), manifest);

  const zipPath = path.join(packageVersionDir, target.zipName(version));
  await zipDirectory(stagingDir, zipPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const packageJson = await readJson(packageJsonPath);
  const baseManifest = await readJson(manifestBasePath);

  const version = args.explicitVersion || bumpVersion(packageJson.version, args.bump);

  packageJson.version = version;
  await writeJson(packageJsonPath, packageJson);
  await syncPackageLockVersion(version);

  await fs.mkdir(outputDir, { recursive: true });

  const cssText = await fs.readFile(path.join(rootDir, 'css', 'style.css'), 'utf8');

  if (!args.manifestsOnly) {
    await buildUserscript(version, cssText);
  }

  if (!args.userscriptOnly) {
    for (const targetKey of Object.keys(TARGETS)) {
      await buildPackage(targetKey, baseManifest, version);
    }
  }

  console.log(`Release v${version}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});