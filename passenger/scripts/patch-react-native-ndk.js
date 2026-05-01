const fs = require('fs');
const path = require('path');

const ndkVersion = '28.2.13676358';
const versionCatalog = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native',
  'gradle',
  'libs.versions.toml'
);

if (!fs.existsSync(versionCatalog)) {
  process.exit(0);
}

const contents = fs.readFileSync(versionCatalog, 'utf8');
const updated = contents.replace(
  /ndkVersion\s*=\s*"[^"]+"/,
  `ndkVersion = "${ndkVersion}"`
);

if (updated !== contents) {
  fs.writeFileSync(versionCatalog, updated);
  console.log(`Patched React Native NDK version to ${ndkVersion}`);
}
