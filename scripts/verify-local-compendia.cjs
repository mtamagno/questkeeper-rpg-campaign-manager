const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const app = read('tools/campaign-manager/public/app.js');
const index = read('tools/campaign-manager/public/index.html');
const styles = read('tools/campaign-manager/public/styles.css');
const server = read('tools/campaign-manager/server.mjs');
const storage = read('tools/storage-paths.cjs');

const checks = [
  [index.includes('id="show-compendia"'), 'Manager navigation exposes Local compendia'],
  [app.includes('Import preview · nothing written yet'), 'imports visibly preview before writing'],
  [app.includes('data-compendium-overwrite'), 'overwrites require a dedicated confirmation'],
  [app.includes('private user-owned compendium material'), 'private exports show a warning'],
  [app.includes('Qualified references'), 'entry authoring exposes qualified references'],
  [server.includes("'/api/compendia/import-preview'"), 'preview API is registered'],
  [server.includes('saveLocalCompendiumPackage'), 'save API uses the guarded local store'],
  [storage.includes('compendiaRoot'), 'storage resolver owns a protected compendia root'],
  [
    storage.includes('includesLocalCompendia'),
    'local recovery backups include compendia explicitly',
  ],
  [styles.includes('@media (max-width: 760px)'), 'workspace has a phone layout contract'],
];

const failed = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (failed.length) {
  console.error(`Local compendium verification failed:\n- ${failed.join('\n- ')}`);
  process.exit(1);
}

console.log('Local compendia verified: authoring, preview, privacy, storage and responsive UI.');
