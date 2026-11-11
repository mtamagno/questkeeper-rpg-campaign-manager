const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const service = read('src/app/guild/services/audiencePreference.service.ts');
const component = read('src/app/guild/pages/campaign-selector/campaign-selector.component.ts');
const template = read('src/app/guild/pages/campaign-selector/campaign-selector.component.html');
const styles = read('src/app/guild/pages/campaign-selector/campaign-selector.component.scss');
const catalog = JSON.parse(read('src/app/guild/i18n/ui.json'));
const englishSelector = catalog.locales.en.texts.campaignSelector;
const italianSelector = catalog.locales.it.texts.campaignSelector;

const checks = [
  ['a versioned local preference key', service.includes("'first-visit-audience'")],
  ['the player audience value', service.includes("'player'")],
  ['the GM audience value', service.includes("'gm'")],
  ['a visible preference reset', template.includes('(click)="resetAudience()"')],
  ['the player journey marker', template.includes('data-journey="player"')],
  ['the GM journey marker', template.includes('data-journey="gm"')],
  ['a campaign-list destination', template.includes('href="#campaigns"')],
  ['a Manager destination', template.includes('[href]="managerDemoUrl"')],
  ['catalog-backed privacy copy', template.includes("uiText.text('campaignSelector.privacy')")],
  ['a local-only privacy explanation', englishSelector.privacy.includes('only in this browser')],
  [
    'a permissions disclaimer',
    englishSelector.privacy.includes('never changes campaign permissions'),
  ],
  [
    'a catalog-backed usage prompt',
    template.includes("uiText.text('campaignSelector.usageQuestion')"),
  ],
  ['a bilingual Italian prompt', italianSelector.usageQuestion === 'Come userai QuestKeeper?'],
  ['a semantic focus treatment', styles.includes('outline: 2px solid var(--qk-color-focus)')],
  ['a responsive single-column path layout', styles.includes('&__audience-grid,')],
  ['the orientation service wiring', component.includes('AudiencePreferenceService')],
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => `Missing ${label}.`);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  'First-visit paths verified: player and GM orientation, local memory, visible reset, privacy copy and responsive keyboard focus.',
);
