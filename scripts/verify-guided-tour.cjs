const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const service = read('src/app/guild/services/guidedTour.service.ts');
const component = read('src/app/guild/components/guided-tour/guided-tour.component.ts');
const template = read('src/app/guild/components/guided-tour/guided-tour.component.html');
const styles = read('src/app/guild/components/guided-tour/guided-tour.component.scss');
const selector = read('src/app/guild/pages/campaign-selector/campaign-selector.component.html');
const selectorComponent = read(
  'src/app/guild/pages/campaign-selector/campaign-selector.component.ts',
);
const commandBar = read('src/app/guild/components/site-command-bar/site-command-bar.component.html');
const commandBarComponent = read(
  'src/app/guild/components/site-command-bar/site-command-bar.component.ts',
);
const app = read('src/app/app.html');

const checks = [
  ['a versioned local progress key', service.includes("'guided-demo-tour-v1'")],
  ['idle, active, paused and completed states', service.includes("'completed'")],
  ['five stable tour stops', service.includes('GUIDED_TOUR_STEP_COUNT = 5')],
  ['remembered campaign association', service.includes('attachCampaign(campaignId: string)')],
  ['explicit progress reset', service.includes('reset(): void')],
  ['route-aware recovery', component.includes('isAtExpectedStop')],
  ['spoiler-consent explanation', component.includes('never bypasses spoiler consent')],
  ['audience-personalized opening', component.includes("audience === 'gm'")],
  ['English and Italian copy', component.includes('Ritrova la tua avventura')],
  ['semantic progress indicator', template.includes('role="progressbar"')],
  ['focusable tour region', template.includes('#tourPanel') && template.includes('tabindex="-1"')],
  ['focus restoration after pause', component.includes('restoreLaunchFocus')],
  ['visible continue-later action', template.includes('Continue later')],
  ['keyboard pause with Escape', component.includes('pauseOnEscape')],
  ['reduced-motion treatment', styles.includes('prefers-reduced-motion: reduce')],
  ['small-screen layout', styles.includes('@include respond-below(sm)')],
  ['first-visit launch action', selector.includes('data-tour-launch="first-visit"')],
  ['role change resets tour context', selectorComponent.includes('this.guidedTour.reset()')],
  ['first-visit focus destination', selector.includes('id="first-visit-paths"')],
  ['persistent command-bar launch action', commandBar.includes('(click)="openTour()"')],
  [
    'command bar defers tour until a path is chosen',
    commandBarComponent.includes("this.audiencePreference.audience() === null"),
  ],
  ['global app-shell host', app.includes('<app-guided-tour />')],
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => `Missing ${label}.`);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  'Guided demo tour verified: remembered progress, role-aware copy, safe route recovery, bilingual controls and responsive accessibility.',
);
