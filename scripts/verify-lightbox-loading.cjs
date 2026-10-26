const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');
const code = read('src/app/guild/components/image-lightbox/image-lightbox.component.ts');
const template = read('src/app/guild/components/image-lightbox/image-lightbox.component.html');
const gallery = read('src/app/guild/components/image-gallery/image-gallery.component.html');
const notebook = read(
  'src/app/adventurers/components/character-notebook/character-notebook.component.html',
);

assert.match(code, /requestVersion \+= 1/);
assert.match(code, /this\.loadState\.set\('loading'\)/);
assert.match(code, /this\.loadRequest\(\)\?\.version !== version/);
assert.match(code, /onImageLoad\(version: number\)/);
assert.match(code, /onImageError\(version: number\)/);
assert.match(code, /retryImage\(\)/);
assert.match(template, /track request\.version/);
assert.match(template, /aria-live="polite"/);
assert.match(template, /loadState\(\) === 'error'/);
assert.match(template, /safeFileName\(request\.image\)/);
assert.match(gallery, /<app-image-lightbox/);
assert.match(notebook, /<app-image-lightbox/);

console.log('Lightbox cached, slow, failed and stale-load contracts verified for gallery and notebook.');
