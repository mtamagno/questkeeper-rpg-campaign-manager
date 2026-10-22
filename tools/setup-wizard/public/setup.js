const copy = {
  en: {
    eyebrow: 'The Welcoming Path',
    title: 'Prepare your campaign workshop',
    intro:
      'QuestKeeper prepares its private runtime, tools and launchers without asking you to use a terminal.',
    statusTitle: 'Your device',
    runtimeTitle: 'Choose the Node.js runtime',
    runtimeHint:
      'Keep QuestKeeper isolated, or reuse a compatible Node.js 24 already on this device.',
    privateRuntime: 'Private QuestKeeper runtime',
    privateRuntimeHint: 'Recommended. Verified and isolated inside this folder.',
    systemRuntime: 'Reuse an existing Node.js 24',
    systemRuntimeHint:
      'Faster and smaller. QuestKeeper validates version, architecture and npm first.',
    detectedRuntime: 'Detected compatible runtime',
    noSystemRuntime: 'No compatible system runtime detected',
    runtimeFallback:
      'If the selected runtime changes or disappears, setup safely falls back to the private runtime.',
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
    closeSetup: 'Close setup',
    closing: 'Closing QuestKeeper Setup and its local service…',
    closed: 'Setup is closed. You can close this tab; launched QuestKeeper apps keep running.',
    closedBadge: 'Closed',
    closeFailed: 'Setup could not close cleanly. Try the button again.',
    language: 'Italiano',
    runtimeReady: 'Using {source} Node.js {version} on {platform}. QuestKeeper tools are ready.',
    runtimeDetected: 'Compatible Node.js 24 detected on {platform}; choose whether to reuse it.',
    runtimeMissing: 'QuestKeeper can prepare a private Node.js 24 for {platform}.',
    sourcePrivate: 'private',
    sourceSystem: 'system',
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
    runtimeTitle: 'Scegli il runtime Node.js',
    runtimeHint:
      'Mantieni QuestKeeper isolato oppure riutilizza un Node.js 24 compatibile già presente sul dispositivo.',
    privateRuntime: 'Runtime privato di QuestKeeper',
    privateRuntimeHint: 'Consigliato. Verificato e isolato dentro questa cartella.',
    systemRuntime: 'Riutilizza un Node.js 24 esistente',
    systemRuntimeHint:
      'Più rapido e leggero. QuestKeeper verifica prima versione, architettura e npm.',
    detectedRuntime: 'Runtime compatibile rilevato',
    noSystemRuntime: 'Nessun runtime di sistema compatibile rilevato',
    runtimeFallback:
      'Se il runtime selezionato cambia o scompare, il setup passa in sicurezza a quello privato.',
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
    closeSetup: 'Chiudi setup',
    closing: 'Chiusura del setup QuestKeeper e del suo servizio locale…',
    closed:
      'Il setup è chiuso. Puoi chiudere questa scheda; le app QuestKeeper già avviate restano aperte.',
    closedBadge: 'Chiuso',
    closeFailed: 'Non è stato possibile chiudere correttamente il setup. Riprova.',
    language: 'English',
    runtimeReady: 'Node.js {version} {source} in uso su {platform}. Gli strumenti sono pronti.',
    runtimeDetected: 'Node.js 24 compatibile rilevato su {platform}; scegli se riutilizzarlo.',
    runtimeMissing: 'QuestKeeper può preparare un Node.js 24 privato per {platform}.',
    sourcePrivate: 'privato',
    sourceSystem: 'di sistema',
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
let runtimeChoiceInitialized = false;
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
  const detected = status.systemRuntimes.length > 0;
  const messageKey = ready ? 'runtimeReady' : detected ? 'runtimeDetected' : 'runtimeMissing';
  $('device-status').textContent = interpolate(copy[language][messageKey], {
    version: status.runtime.version || '24',
    platform,
    source: copy[language][status.runtime.source === 'system' ? 'sourceSystem' : 'sourcePrivate'],
  });
  $('status-badge').textContent = copy[language][ready ? 'readyBadge' : 'setupBadge'];

  const previousPath = $('system-runtime').value;
  $('system-runtime').replaceChildren(
    ...status.systemRuntimes.map((runtime) => {
      const option = document.createElement('option');
      option.value = runtime.nodePath;
      option.textContent = `${runtime.version} · ${runtime.architecture} · ${runtime.nodePath}`;
      return option;
    }),
  );
  if (!detected) {
    const option = document.createElement('option');
    option.textContent = copy[language].noSystemRuntime;
    option.value = '';
    $('system-runtime').append(option);
  } else if (status.systemRuntimes.some((runtime) => runtime.nodePath === previousPath)) {
    $('system-runtime').value = previousPath;
  }
  $('runtime-system').disabled = !detected;
  if (!runtimeChoiceInitialized) {
    const useSystem = status.runtime.ready && status.runtime.source === 'system' && detected;
    $('runtime-system').checked = useSystem;
    $('runtime-private').checked = !useSystem;
    if (useSystem) $('system-runtime').value = status.runtime.nodePath;
    runtimeChoiceInitialized = true;
  }
  $('system-runtime').disabled = !detected || !$('runtime-system').checked;
  $('log').textContent = status.state.logs.join('\n');
  const phase = status.state.phase;
  $('progress').className = phase;
  $('prepare').disabled = phase === 'running';
  $('close-setup').disabled = phase === 'running';
  if (phase === 'running') $('progress-message').textContent = status.state.message;
  else if (phase === 'complete') $('progress-message').textContent = copy[language].complete;
  else if (phase === 'failed') $('progress-message').textContent = copy[language].failed;
}

document.querySelectorAll('input[name="runtime"]').forEach((input) => {
  input.addEventListener('change', () => {
    $('system-runtime').disabled = !$('runtime-system').checked;
  });
});

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
        runtimePreference: $('runtime-system').checked ? 'system' : 'private',
        systemNodePath: $('runtime-system').checked ? $('system-runtime').value : undefined,
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

$('close-setup').addEventListener('click', async () => {
  if (polling) {
    clearInterval(polling);
    polling = null;
  }
  $('close-setup').disabled = true;
  $('prepare').disabled = true;
  $('progress-message').textContent = copy[language].closing;
  try {
    await api('shutdown', { method: 'POST', body: '{}' });
    document.querySelectorAll('input, button').forEach((element) => {
      element.disabled = true;
    });
    $('status-badge').textContent = copy[language].closedBadge;
    $('progress').className = 'complete';
    $('progress-message').textContent = copy[language].closed;
    window.setTimeout(() => window.close(), 100);
  } catch {
    $('close-setup').disabled = false;
    $('prepare').disabled = false;
    $('progress-message').textContent = copy[language].closeFailed;
  }
});

translate();
refresh();
