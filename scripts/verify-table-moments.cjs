const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8');
const pageRoot = ['src', 'app', 'chronicle', 'pages', 'table-moments'];

const model = read('src', 'app', 'guild', 'models', 'session.model.ts');
const routes = read('src', 'app', 'app.routes.ts');
const sidebar = read('src', 'app', 'guild', 'components', 'sidebar', 'sidebar.component.html');
const commandBar = read(
  'src',
  'app',
  'guild',
  'components',
  'site-command-bar',
  'site-command-bar.component.ts',
);
const page = {
  ts: read(...pageRoot, 'table-moments.component.ts'),
  html: read(...pageRoot, 'table-moments.component.html'),
  scss: read(...pageRoot, 'table-moments.component.scss'),
};
const guide = read('docs', 'TABLE-MOMENTS.md');

function assert(condition, message) {
  if (!condition) throw new Error(`Table moments verification failed: ${message}`);
}

for (const contract of [
  'interface TableMoment',
  'speaker: string',
  'quote: BilingualText',
  'context?: BilingualText',
  'tableMoments?: ReadonlyArray<TableMoment>',
]) {
  assert(model.includes(contract), `missing model contract: ${contract}`);
}

assert(routes.includes("path: 'campaign/table-moments'"), 'dedicated campaign route is missing');
assert(sidebar.includes("'campaign', 'table-moments'"), 'sidebar route is missing');
assert(
  sidebar.includes('Momenti al tavolo') && sidebar.includes('Around the Table'),
  'sidebar labels are missing',
);
assert(commandBar.includes('current-table-moments'), 'global command is missing');
assert(
  commandBar.includes('Battute e ricordi fuori personaggio'),
  'command must identify the OOC boundary',
);

for (const contract of [
  'selectTableMomentGroups',
  '.reverse()',
  'session.tableMoments?.length',
  'track moment.id',
]) {
  assert(
    page.ts.includes(contract) || page.html.includes(contract),
    `missing page behavior: ${contract}`,
  );
}

for (const contract of [
  '<blockquote>',
  '<figcaption>',
  '<time [attr.datetime]',
  'non fanno parte del canone',
  'not campaign canon',
  'empty-state',
]) {
  assert(page.html.includes(contract), `missing semantic or editorial UI: ${contract}`);
}

assert(/repeat\(2, minmax\(0, 1fr\)\)/.test(page.scss), 'desktop quote grid is missing');
assert(
  /respond-below\(md\)[\s\S]*?grid-template-columns:\s*1fr/.test(page.scss),
  'mobile quote stack is missing',
);
assert(guide.includes('never turn an AI paraphrase into'), 'quotation provenance rule is missing');
assert(
  guide.includes('Omitting `tableMoments` is valid'),
  'optional empty-state contract is missing',
);

const demoPath = path.join(
  root,
  'src',
  'campaigns',
  'example-campaign',
  'data',
  'sessions',
  'session-1.json',
);
if (fs.existsSync(demoPath)) {
  const demo = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
  assert(
    demo.tableMoments?.length >= 2,
    'the public demo needs at least two original table moments',
  );
}

console.log(
  'Table moments verified: separate canon boundary, accessible quotes, navigation and responsive grouping.',
);
