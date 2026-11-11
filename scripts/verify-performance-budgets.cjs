const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const config = JSON.parse(read('performance-budgets.json'));
const sourceIndex = read('src/index.html');
const typography = read('src/styles/_typography.scss');

assert.ok(!typography.includes('@import url('), 'Web fonts must not block the Sass bundle.');
assert.match(sourceIndex, /rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin/);
assert.match(sourceIndex, /fonts\.googleapis\.com[\s\S]+display=swap/);
assert.match(sourceIndex, /media="print"[\s\S]+onload="this\.media\s*=\s*'all'"/);
assert.match(sourceIndex, /<noscript>[\s\S]+fonts\.googleapis\.com[\s\S]+<\/noscript>/);

const htmlFiles = execFileSync('git', ['ls-files', 'src/app/**/*.html'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
for (const relative of htmlFiles) {
  const html = read(relative);
  for (const image of html.match(/<img\b[\s\S]*?>/g) ?? []) {
    assert.match(image, /\bloading="(?:eager|lazy)"/, `${relative} has no image loading policy.`);
    assert.match(image, /\bdecoding="async"/, `${relative} has no async image decoding policy.`);
  }
}
assert.match(
  read('src/app/guild/pages/homepage/homepage.component.html'),
  /class="homepage__hero-image"[\s\S]+fetchpriority="high"/,
);

const dist = path.join(root, config.distDirectory);
const builtIndexPath = path.join(dist, 'index.html');
assert.ok(
  fs.existsSync(builtIndexPath),
  'Build output is missing; run the production build first.',
);
const builtIndex = fs.readFileSync(builtIndexPath, 'utf8');
assert.match(builtIndex, /font-display:swap/);

const statsPath = path.join(path.dirname(dist), 'stats.json');
assert.ok(fs.existsSync(statsPath), 'Build statistics are missing; build with --stats-json.');
const buildStats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
const outputs = buildStats.outputs ?? {};
const mainOutput = Object.entries(outputs).find(
  ([, output]) => output.entryPoint === 'src/main.ts',
);
assert.ok(mainOutput, 'Build statistics do not identify the application entry point.');

const initialNames = new Set();
const visitStaticImports = (reference) => {
  if (initialNames.has(reference)) return;
  const output = outputs[reference];
  assert.ok(output, `Build statistics reference a missing output: ${reference}`);
  initialNames.add(reference);
  for (const dependency of output.imports ?? []) {
    if (dependency.kind === 'import-statement') visitStaticImports(dependency.path);
  }
};
visitStaticImports(mainOutput[0]);
for (const [reference, output] of Object.entries(outputs)) {
  if (output.entryPoint === 'angular:styles/global:styles') initialNames.add(reference);
}

const initialRefs = [...initialNames].sort();
const initialAssets = initialRefs.map((reference) => {
  const absolute = path.join(dist, reference);
  assert.ok(fs.existsSync(absolute), `Initial asset does not exist: ${reference}`);
  return { reference, bytes: fs.statSync(absolute).size };
});
const initialInputs = new Set(
  initialRefs.flatMap((reference) => Object.keys(outputs[reference].inputs ?? {})),
);
for (const marker of config.forbiddenInitialInputMarkers ?? []) {
  const leakedInput = [...initialInputs].find((input) => input.includes(marker));
  assert.equal(
    leakedInput,
    undefined,
    `Initial graph eagerly includes route-owned data: ${leakedInput}`,
  );
}
const initialBytes =
  fs.statSync(builtIndexPath).size + initialAssets.reduce((sum, asset) => sum + asset.bytes, 0);
const largestInitial = initialAssets.reduce(
  (largest, asset) => (asset.bytes > largest.bytes ? asset : largest),
  { reference: 'none', bytes: 0 },
);

assert.ok(
  initialBytes <= config.initialBytes,
  `Initial load is ${initialBytes} bytes; budget is ${config.initialBytes}.`,
);
assert.ok(
  initialAssets.length <= config.initialRequests,
  `Initial JS/CSS requests are ${initialAssets.length}; budget is ${config.initialRequests}.`,
);
assert.ok(
  largestInitial.bytes <= config.largestInitialAssetBytes,
  `${largestInitial.reference} is ${largestInitial.bytes} bytes; initial-asset budget is ${config.largestInitialAssetBytes}.`,
);

const deferredScripts = fs
  .readdirSync(dist, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.js') && !initialNames.has(entry.name))
  .map((entry) => ({ name: entry.name, bytes: fs.statSync(path.join(dist, entry.name)).size }));
const largestDeferred = deferredScripts.reduce(
  (largest, asset) => (asset.bytes > largest.bytes ? asset : largest),
  { name: 'none', bytes: 0 },
);
assert.ok(
  largestDeferred.bytes <= config.largestDeferredScriptBytes,
  `${largestDeferred.name} is ${largestDeferred.bytes} bytes; deferred-script budget is ${config.largestDeferredScriptBytes}.`,
);

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(absolute) : [absolute];
  });
}

const governedImages = filesBelow(dist).filter((absolute) => {
  const relative = path.relative(dist, absolute).replaceAll('\\', '/');
  return (
    /\.(?:avif|jpe?g|png|webp)$/i.test(relative) &&
    config.imagePathMarkers.some((marker) => relative.includes(marker))
  );
});
for (const absolute of governedImages) {
  const bytes = fs.statSync(absolute).size;
  assert.ok(
    bytes <= config.generatedImageBytes,
    `${path.relative(dist, absolute)} is ${bytes} bytes; generated-image budget is ${config.generatedImageBytes}.`,
  );
}

console.log(
  `Performance budgets passed: ${initialBytes} initial bytes across ${initialAssets.length} assets and ${initialInputs.size} source inputs; largest deferred script ${largestDeferred.bytes} bytes; ${governedImages.length} optimized images checked.`,
);
