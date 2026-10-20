const copy = {
  en: {
    eyebrow: 'The Welcoming Path',
    title: 'Prepare your campaign workshop',
    intro:
      'QuestKeeper prepares its private runtime, tools and launchers without asking you to use a terminal.',
    statusTitle: 'Your device',
    optionsTitle: 'Choose what to prepare',
    optionsHint: 'You can run this setup again at any time.',
    dependencies: 'Install the locked QuestKeeper tools',
    managerShortcut: 'Create a Campaign Manager shortcut',
    companionShortcut: 'Create a player Companion shortcut',
    launchManager: 'Open Campaign Manager when setup finishes',
    trustTitle: 'A private, verified runtime',
    trustBody:
      'Node.js 24 is downloaded only from nodejs.org, verified against its published SHA-256 checksum and kept inside this QuestKeeper folder. No administrator access is required.',
    ready: 'Ready to begin.',
    footer: 'No AI model or remote provider is enabled by this setup.',
    prepare: 'Prepare QuestKeeper',
    language: 'Italiano',
    runtimeReady: 'Node.js {version} and QuestKeeper are ready on {platform}.',
    runtimeMissing: 'QuestKeeper will prepare Node.js 24 for {platform}.',
    readyBadge: 'Ready',
    setupBadge: 'Setup needed',
    starting: 'Opening the path…',
    complete: 'QuestKeeper is ready. Your adventure can begin.',
    failed: 'Setup needs attention. Read the log below and try again.',
  },
  it: {
    eyebrow: 'Il sentiero d’accoglienza',
    title: 'Prepara il laboratorio della campagna',
    intro:
      'QuestKeeper prepara runtime privata, strumenti e collegamenti senza chiederti di usare il terminale.',
    statusTitle: 'Il tuo dispositivo',
    optionsTitle: 'Scegli cosa preparare',
    optionsHint: 'Potrai eseguire di nuovo questo setup in qualsiasi momento.',
    dependencies: 'Installa gli strumenti QuestKeeper bloccati',
    managerShortcut: 'Crea un collegamento al Campaign Manager',
    companionShortcut: 'Crea un collegamento al Companion dei giocatori',
    launchManager: 'Apri Campaign Manager al termine del setup',
    trustTitle: 'Una runtime privata e verificata',
    trustBody:
      'Node.js 24 viene scaricato solo da nodejs.org, verificato con il checksum SHA-256 pubblicato e conservato dentro questa cartella QuestKeeper. Non servono privilegi di amministratore.',
    ready: 'Tutto pronto per iniziare.',
    footer: 'Questo setup non abilita modelli AI o provider remoti.',
    prepare: 'Prepara QuestKeeper',
    language: 'English',
    runtimeReady: 'Node.js {version} e QuestKeeper sono pronti su {platform}.',
    runtimeMissing: 'QuestKeeper preparerà Node.js 24 per {platform}.',
    readyBadge: 'Pronto',
    setupBadge: 'Da preparare',
    starting: 'Apertura del sentiero…',
    complete: 'QuestKeeper è pronto. L’avventura può cominciare.',
    failed: 'Il setup richiede attenzione. Leggi il registro e riprova.',
  },
};

const query = new URLSearchParams(location.search);
const token = query.get('token');
let language =
  localStorage.getItem('questkeeper-setup-language') ||
  (navigator.language.startsWith('it') ? 'it' : 'en');
let polling;
const $ = (id) => document.getElementById(id);
const interpolate = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

function translate() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-copy]').forEach((element) => {
    element.textContent = copy[language][element.dataset.copy];
  });
  $('language').textContent = copy[language].language;
}

async function api(path, options) {
  const response = await fetch(`/api/${path}?token=${encodeURIComponent(token)}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Request failed.');
  return value;
}

function render(status) {
  const platform = `${status.platform} ${status.architecture}`;
  const ready = status.runtime.ready && status.dependenciesReady;
  $('device-status').textContent = interpolate(
    copy[language][ready ? 'runtimeReady' : 'runtimeMissing'],
    { version: status.runtime.version || '24', platform },
  );
  $('status-badge').textContent = copy[language][ready ? 'readyBadge' : 'setupBadge'];
  $('log').textContent = status.state.logs.join('\n');
  const phase = status.state.phase;
  $('progress').className = phase;
  $('prepare').disabled = phase === 'running';
  if (phase === 'running') $('progress-message').textContent = status.state.message;
  else if (phase === 'complete') $('progress-message').textContent = copy[language].complete;
  else if (phase === 'failed') $('progress-message').textContent = copy[language].failed;
}

async function refresh() {
  try {
    const status = await api('status');
    render(status);
    if (status.state.phase !== 'running' && polling) {
      clearInterval(polling);
      polling = null;
    }
  } catch (error) {
    $('progress-message').textContent = error.message;
  }
}

$('language').addEventListener('click', () => {
  language = language === 'en' ? 'it' : 'en';
  localStorage.setItem('questkeeper-setup-language', language);
  translate();
  refresh();
});

$('prepare').addEventListener('click', async () => {
  $('prepare').disabled = true;
  $('progress-message').textContent = copy[language].starting;
  try {
    await api('install', {
      method: 'POST',
      body: JSON.stringify({
        dependencies: $('dependencies').checked,
        managerShortcut: $('manager-shortcut').checked,
        companionShortcut: $('companion-shortcut').checked,
        launchManager: $('launch-manager').checked,
      }),
    });
    polling = setInterval(refresh, 700);
    await refresh();
  } catch (error) {
    $('progress-message').textContent = error.message;
    $('prepare').disabled = false;
  }
});

translate();
refresh();
