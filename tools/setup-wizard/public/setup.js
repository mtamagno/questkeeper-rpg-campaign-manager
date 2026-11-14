const copy = {
  en: {
    eyebrow: 'The Welcoming Path',
    title: 'Prepare your campaign workshop',
    intro:
      'QuestKeeper prepares its private runtime, tools and launchers without asking you to use a terminal.',
    statusTitle: 'Your device',
    checking: 'Checking…',
    runtimeTitle: 'Choose the Node.js runtime',
    runtimeHint:
      'Keep QuestKeeper isolated, or reuse a compatible Node.js 26 already on this device.',
    privateRuntime: 'Private QuestKeeper runtime',
    privateRuntimeHint: 'Recommended. Verified and isolated inside this folder.',
    systemRuntime: 'Reuse an existing Node.js 26',
    systemRuntimeHint:
      'Faster and smaller. QuestKeeper validates version, architecture and npm first.',
    detectedRuntime: 'Detected compatible runtime',
    noSystemRuntime: 'No compatible system runtime detected',
    runtimeFallback:
      'If the selected runtime changes or disappears, setup safely falls back to the private runtime.',
    optionsTitle: 'Choose what to prepare',
    optionsHint: 'You can run this setup again at any time.',
    dependencies: 'Install the locked QuestKeeper tools',
    portableData: 'Keep campaign data beside QuestKeeper',
    portableDataHint:
      'Portable mode is useful for a USB drive. Per-user storage is safer for normal updates.',
    storageTitle: 'Protected campaign storage',
    storageBody:
      'Campaigns, media, transcripts and backups are kept separate from replaceable app files.',
    managerShortcut: 'Create a Campaign Manager shortcut',
    managerShortcutHint:
      'Opens the private authoring studio for campaigns, sessions and publishing.',
    companionShortcut: 'Create a player Companion shortcut',
    companionShortcutHint: 'Starts the reading site and opens it in the default browser.',
    launchManager: 'Open Campaign Manager when setup finishes',
    planTitle: 'What will happen',
    planRuntime: 'Runtime',
    planStorage: 'Campaign storage',
    planShortcuts: 'Desktop shortcuts',
    planFirstLaunch: 'First launch',
    planPrivateRuntime: 'Verified private Node.js 26',
    planSystemRuntime: 'Validated system Node.js 26',
    planUserStorage: 'Protected per-user folder',
    planPortableStorage: 'Portable folder beside QuestKeeper',
    planBothShortcuts: 'Manager and Companion',
    planManagerShortcut: 'Campaign Manager only',
    planCompanionShortcut: 'Companion only',
    planNoShortcuts: 'No shortcuts',
    planLaunchManager: 'Campaign Manager opens automatically',
    planNoLaunch: 'Stay in setup until you choose what to open',
    trustTitle: 'A private, verified runtime',
    trustBody:
      'Node.js 26 is downloaded only from nodejs.org, verified against its published SHA-256 checksum and kept inside this QuestKeeper folder. No administrator access is required.',
    ready: 'Ready to begin.',
    footer: 'No AI model or remote provider is enabled by this setup.',
    prepare: 'Prepare QuestKeeper',
    completionTitle: 'QuestKeeper is ready',
    completionMigrated:
      'Existing campaigns were copied and verified. A rollback copy remains available.',
    completionCreated: 'A new protected campaign archive was created.',
    completionReused: 'Protected campaign storage was reused without replacing your data.',
    completionDetails: '{runtime}. Campaigns: {path}. {migration}',
    openManager: 'Open Campaign Manager',
    openCompanion: 'Open Companion',
    finishSetup: 'Finish and close',
    launched: 'Opened',
    launchFailed: 'Could not open this QuestKeeper app. Read the log and try again.',
    closeCountdown: 'Setup closes automatically in {seconds} seconds.',
    closeSetup: 'Close setup',
    closing: 'Closing QuestKeeper Setup and its local service…',
    closed: 'Setup is closed. You can close this tab; launched QuestKeeper apps keep running.',
    closedDetails: 'Protected campaigns: {path}. Campaign Manager: {manager}.',
    managerRunning: 'launched and still running',
    managerStopped: 'not launched',
    closedBadge: 'Closed',
    closeFailed: 'Setup could not close cleanly. Try the button again.',
    language: 'Italiano',
    runtimeReady: 'Using {source} Node.js {version} on {platform}. QuestKeeper tools are ready.',
    runtimeDetected: 'Compatible Node.js 26 detected on {platform}; choose whether to reuse it.',
    runtimeMissing: 'QuestKeeper can prepare a private Node.js 26 for {platform}.',
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
    checking: 'Controllo in corso…',
    runtimeTitle: 'Scegli il runtime Node.js',
    runtimeHint:
      'Mantieni QuestKeeper isolato oppure riutilizza un Node.js 26 compatibile già presente sul dispositivo.',
    privateRuntime: 'Runtime privato di QuestKeeper',
    privateRuntimeHint: 'Consigliato. Verificato e isolato dentro questa cartella.',
    systemRuntime: 'Riutilizza un Node.js 26 esistente',
    systemRuntimeHint:
      'Più rapido e leggero. QuestKeeper verifica prima versione, architettura e npm.',
    detectedRuntime: 'Runtime compatibile rilevato',
    noSystemRuntime: 'Nessun runtime di sistema compatibile rilevato',
    runtimeFallback:
      'Se il runtime selezionato cambia o scompare, il setup passa in sicurezza a quello privato.',
    optionsTitle: 'Scegli cosa preparare',
    optionsHint: 'Potrai eseguire di nuovo questo setup in qualsiasi momento.',
    dependencies: 'Installa gli strumenti QuestKeeper bloccati',
    portableData: 'Conserva i dati della campagna accanto a QuestKeeper',
    portableDataHint:
      'La modalita portabile e utile per una chiavetta USB. Lo spazio utente e piu sicuro per gli aggiornamenti normali.',
    storageTitle: 'Archivio protetto delle campagne',
    storageBody:
      'Campagne, media, trascrizioni e backup restano separati dai file sostituibili dell applicazione.',
    managerShortcut: 'Crea un collegamento al Campaign Manager',
    managerShortcutHint: 'Apre lo studio privato per gestire campagne, sessioni e pubblicazione.',
    companionShortcut: 'Crea un collegamento al Companion dei giocatori',
    companionShortcutHint: 'Avvia il sito di lettura e lo apre nel browser predefinito.',
    launchManager: 'Apri Campaign Manager al termine del setup',
    planTitle: 'Cosa succederà',
    planRuntime: 'Runtime',
    planStorage: 'Archivio campagne',
    planShortcuts: 'Collegamenti sul desktop',
    planFirstLaunch: 'Primo avvio',
    planPrivateRuntime: 'Node.js 26 privato e verificato',
    planSystemRuntime: 'Node.js 26 di sistema convalidato',
    planUserStorage: 'Cartella utente protetta',
    planPortableStorage: 'Cartella portabile accanto a QuestKeeper',
    planBothShortcuts: 'Manager e Companion',
    planManagerShortcut: 'Solo Campaign Manager',
    planCompanionShortcut: 'Solo Companion',
    planNoShortcuts: 'Nessun collegamento',
    planLaunchManager: 'Campaign Manager si apre automaticamente',
    planNoLaunch: 'Resta nel setup finché non scegli cosa aprire',
    trustTitle: 'Una runtime privata e verificata',
    trustBody:
      'Node.js 26 viene scaricato solo da nodejs.org, verificato con il checksum SHA-256 pubblicato e conservato dentro questa cartella QuestKeeper. Non servono privilegi di amministratore.',
    ready: 'Tutto pronto per iniziare.',
    footer: 'Questo setup non abilita modelli AI o provider remoti.',
    prepare: 'Prepara QuestKeeper',
    completionTitle: 'QuestKeeper è pronto',
    completionMigrated:
      'Le campagne esistenti sono state copiate e verificate. Resta disponibile una copia di ripristino.',
    completionCreated: 'È stato creato un nuovo archivio protetto per le campagne.',
    completionReused: 'L archivio protetto è stato riutilizzato senza sostituire i tuoi dati.',
    completionDetails: '{runtime}. Campagne: {path}. {migration}',
    openManager: 'Apri Campaign Manager',
    openCompanion: 'Apri Companion',
    finishSetup: 'Termina e chiudi',
    launched: 'Aperto',
    launchFailed:
      'Non è stato possibile aprire questa app QuestKeeper. Leggi il registro e riprova.',
    closeCountdown: 'Il setup si chiuderà automaticamente tra {seconds} secondi.',
    closeSetup: 'Chiudi setup',
    closing: 'Chiusura del setup QuestKeeper e del suo servizio locale…',
    closed:
      'Il setup è chiuso. Puoi chiudere questa scheda; le app QuestKeeper già avviate restano aperte.',
    closedBadge: 'Chiuso',
    closedDetails: 'Campagne protette: {path}. Campaign Manager: {manager}.',
    managerRunning: 'avviato e ancora in esecuzione',
    managerStopped: 'non avviato',
    closeFailed: 'Non è stato possibile chiudere correttamente il setup. Riprova.',
    language: 'English',
    runtimeReady: 'Node.js {version} {source} in uso su {platform}. Gli strumenti sono pronti.',
    runtimeDetected: 'Node.js 26 compatibile rilevato su {platform}; scegli se riutilizzarlo.',
    runtimeMissing: 'QuestKeeper può preparare un Node.js 26 privato per {platform}.',
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
let completionHandled = false;
let automaticCloseTimer;
let countdownTimer;
let lastStatus;
const $ = (id) => document.getElementById(id);
const interpolate = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

function translate() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-copy]').forEach((element) => {
    element.textContent = copy[language][element.dataset.copy];
  });
  $('language').textContent = copy[language].language;
  if (lastStatus) {
    renderPlan(lastStatus);
    if (!$('completion-summary').hidden) renderCompletion(lastStatus);
  } else renderPlan();
}

function shortcutPlanKey() {
  const manager = $('manager-shortcut').checked;
  const companion = $('companion-shortcut').checked;
  if (manager && companion) return 'planBothShortcuts';
  if (manager) return 'planManagerShortcut';
  if (companion) return 'planCompanionShortcut';
  return 'planNoShortcuts';
}

function renderPlan(status) {
  $('plan-runtime').textContent =
    copy[language][
      $('runtime-system').checked && !$('runtime-system').disabled
        ? 'planSystemRuntime'
        : 'planPrivateRuntime'
    ];
  $('plan-storage').textContent =
    copy[language][$('portable-data').checked ? 'planPortableStorage' : 'planUserStorage'];
  $('plan-shortcuts').textContent = copy[language][shortcutPlanKey()];
  $('plan-launch').textContent =
    copy[language][$('launch-manager').checked ? 'planLaunchManager' : 'planNoLaunch'];
  if (status) {
    $('storage-path').textContent =
      status.storageChoices[$('portable-data').checked ? 'portable' : 'user'].campaigns;
  }
}

function clearAutomaticClose() {
  clearTimeout(automaticCloseTimer);
  clearInterval(countdownTimer);
  automaticCloseTimer = null;
  countdownTimer = null;
}

function renderCompletion(status) {
  const outcomes = status.state.outcomes;
  if (!outcomes) return;
  const runtime = `${copy[language][outcomes.runtime.source === 'system' ? 'planSystemRuntime' : 'planPrivateRuntime']} (${outcomes.runtime.version})`;
  $('completion-details').textContent = interpolate(copy[language].completionDetails, {
    runtime,
    path: outcomes.storage.campaigns,
    migration:
      copy[language][
        outcomes.storage.migrated
          ? 'completionMigrated'
          : outcomes.storage.created
            ? 'completionCreated'
            : 'completionReused'
      ],
  });
  $('launch-manager-result').textContent =
    copy[language][outcomes.launched.manager ? 'launched' : 'openManager'];
  $('launch-manager-result').disabled = outcomes.launched.manager === true;
  $('launch-companion-result').textContent =
    copy[language][outcomes.launched.companion ? 'launched' : 'openCompanion'];
  $('launch-companion-result').disabled = outcomes.launched.companion === true;
}

function scheduleAutomaticClose(status) {
  clearAutomaticClose();
  const deadline = Date.now() + 30_000;
  const update = () => {
    const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    $('close-countdown').textContent = interpolate(copy[language].closeCountdown, { seconds });
  };
  update();
  countdownTimer = setInterval(update, 1000);
  automaticCloseTimer = setTimeout(() => closeSetup(status), 30_000);
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
  lastStatus = status;
  const platform = `${status.platform} ${status.architecture}`;
  const ready = status.runtime.ready && status.dependenciesReady;
  const detected = status.systemRuntimes.length > 0;
  const messageKey = ready ? 'runtimeReady' : detected ? 'runtimeDetected' : 'runtimeMissing';
  $('device-status').textContent = interpolate(copy[language][messageKey], {
    version: status.runtime.version || '26',
    platform,
    source: copy[language][status.runtime.source === 'system' ? 'sourceSystem' : 'sourcePrivate'],
  });
  $('status-badge').textContent = copy[language][ready ? 'readyBadge' : 'setupBadge'];
  $('storage-path').textContent =
    status.storageChoices[$('portable-data').checked ? 'portable' : 'user'].campaigns;

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
  renderPlan(status);
  $('log').textContent = status.state.logs.join('\n');
  const phase = status.state.phase;
  $('progress').className = phase;
  $('prepare').disabled = phase === 'running' || phase === 'complete';
  $('close-setup').disabled = phase === 'running';
  if (phase === 'running') $('progress-message').textContent = status.state.message;
  else if (phase === 'complete') {
    $('progress-message').textContent = copy[language].complete;
    $('completion-summary').hidden = false;
    renderCompletion(status);
    if (!completionHandled) {
      completionHandled = true;
      scheduleAutomaticClose(status);
    }
  } else if (phase === 'failed') $('progress-message').textContent = copy[language].failed;
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
  clearAutomaticClose();
  completionHandled = false;
  $('completion-summary').hidden = true;
  $('prepare').disabled = true;
  $('progress-message').textContent = copy[language].starting;
  try {
    await api('install', {
      method: 'POST',
      body: JSON.stringify({
        runtimePreference: $('runtime-system').checked ? 'system' : 'private',
        systemNodePath: $('runtime-system').checked ? $('system-runtime').value : undefined,
        dependencies: $('dependencies').checked,
        portableData: $('portable-data').checked,
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

async function closeSetup(status = lastStatus) {
  clearAutomaticClose();
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
    $('progress-message').textContent = `${copy[language].closed} ${interpolate(
      copy[language].closedDetails,
      {
        path: status?.storage?.campaigns ?? '',
        manager:
          copy[language][status?.state?.launchedManager ? 'managerRunning' : 'managerStopped'],
      },
    )}`;
    window.setTimeout(() => window.close(), 100);
  } catch {
    $('close-setup').disabled = false;
    $('prepare').disabled = false;
    $('progress-message').textContent = copy[language].closeFailed;
  }
}

$('portable-data').addEventListener('change', () => {
  if (lastStatus) render(lastStatus);
});

for (const id of [
  'runtime-private',
  'runtime-system',
  'system-runtime',
  'manager-shortcut',
  'companion-shortcut',
  'launch-manager',
]) {
  $(id).addEventListener('change', () => renderPlan(lastStatus));
}

async function launchFromResult(kind, button) {
  clearAutomaticClose();
  button.disabled = true;
  try {
    await api('launch', { method: 'POST', body: JSON.stringify({ kind }) });
    await refresh();
    if (lastStatus?.state?.phase === 'complete') scheduleAutomaticClose(lastStatus);
  } catch (error) {
    button.disabled = false;
    $('progress-message').textContent = `${copy[language].launchFailed} ${error.message}`;
    if (lastStatus?.state?.phase === 'complete') scheduleAutomaticClose(lastStatus);
  }
}

$('launch-manager-result').addEventListener('click', () =>
  launchFromResult('manager', $('launch-manager-result')),
);
$('launch-companion-result').addEventListener('click', () =>
  launchFromResult('companion', $('launch-companion-result')),
);
$('finish-setup').addEventListener('click', () => closeSetup());

$('close-setup').addEventListener('click', async () => {
  completionHandled = true;
  await closeSetup();
});

translate();
refresh();
