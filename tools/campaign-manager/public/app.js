const token = document.querySelector('meta[name="manager-token"]').content;
const content = document.querySelector('#content');
const campaignList = document.querySelector('#campaign-list');
const dialog = document.querySelector('#editor-dialog');
const editorForm = document.querySelector('#editor-form');
const fields = document.querySelector('#dialog-fields');
const dialogError = document.querySelector('#dialog-error');
const mobileMenu = document.querySelector('#mobile-menu');
const serviceDialog = document.querySelector('#service-dialog');
const managerSettingsDialog = document.querySelector('#manager-settings-dialog');
const MY_CHARACTERS_KEY = 'questkeeper-manager-my-characters:v1';
const MANAGER_THEME_KEY = 'questkeeper-manager-theme:v1';
const MANAGER_THEMES = ['system', 'light', 'dark', 'contrast'];
const managerThemeMedia = window.matchMedia('(prefers-color-scheme: light)');
const initialCampaignId = new URL(window.location.href).searchParams.get('campaign');

function managerThemePreference() {
  const value = document.documentElement.dataset.managerThemePreference;
  return MANAGER_THEMES.includes(value) ? value : 'system';
}

function resolvedManagerTheme(preference) {
  return preference === 'system' ? (managerThemeMedia.matches ? 'light' : 'dark') : preference;
}

function syncManagerThemeUi() {
  const preference = managerThemePreference();
  const radio = document.querySelector(`[name="managerTheme"][value="${preference}"]`);
  if (radio) radio.checked = true;
  const labels = {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    contrast: 'High contrast',
  };
  const summary = document.querySelector('#manager-theme-summary');
  if (summary) {
    summary.textContent = `Appearance · ${labels[preference]}`;
    window.managerI18n?.translateTree?.(summary);
  }
}

function setManagerTheme(preference, persist = true) {
  const next = MANAGER_THEMES.includes(preference) ? preference : 'system';
  document.documentElement.dataset.managerThemePreference = next;
  document.documentElement.dataset.managerTheme = resolvedManagerTheme(next);
  if (persist) {
    try {
      if (next === 'system') localStorage.removeItem(MANAGER_THEME_KEY);
      else localStorage.setItem(MANAGER_THEME_KEY, next);
    } catch {}
  }
  syncManagerThemeUi();
}

managerThemeMedia.addEventListener('change', () => {
  if (managerThemePreference() === 'system') setManagerTheme('system', false);
});

function readMyCharacters() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MY_CHARACTERS_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([campaignId, characterId]) =>
          campaignId.trim() && typeof characterId === 'string' && characterId.trim(),
      ),
    );
  } catch {
    return {};
  }
}

const state = {
  campaigns: [],
  campaign: null,
  selectedId: null,
  tab: 'overview',
  libraryMode: true,
  projectMode: false,
  scribeMode: false,
  aiMode: false,
  compendiumMode: false,
  compendia: { packages: [], entries: [], conflicts: [] },
  compendiumImport: null,
  compendiumSearch: '',
  entityTranslations: null,
  aiConfigureExpanded: false,
  firstRunEvaluated: false,
  advancedMode: localStorage.getItem('questkeeper-manager-advanced') === 'true',
  myCharacters: readMyCharacters(),
  project: {
    dependenciesReady: false,
    companion: { action: 'prepare', label: 'Start Companion', status: 'Preparation required' },
    transcriber: { configured: false, environmentReady: false },
    jobs: {},
    ai: null,
    languageCatalog: [],
    rulesetProfiles: [],
    storage: null,
  },
  editor: null,
};

function selectedMyCharacter() {
  const characterId = state.selectedId ? state.myCharacters[state.selectedId] : undefined;
  return state.campaign?.characters.find((character) => character.id === characterId);
}

function setMyCharacter(characterId) {
  if (!state.selectedId) return;
  if (state.myCharacters[state.selectedId] === characterId) {
    delete state.myCharacters[state.selectedId];
  } else {
    state.myCharacters[state.selectedId] = characterId;
  }
  localStorage.setItem(MY_CHARACTERS_KEY, JSON.stringify(state.myCharacters));
  render();
}

function myCharacterCompanionUrl(baseUrl) {
  if (!state.selectedId) return baseUrl;
  const url = new URL(baseUrl, window.location.href);
  const character = selectedMyCharacter();
  url.pathname = character
    ? `/${encodeURIComponent(state.selectedId)}/party/${encodeURIComponent(character.id)}`
    : `/${encodeURIComponent(state.selectedId)}`;
  return url.toString();
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function localized(value, language = 'en') {
  if (typeof value === 'string') return value;
  return value?.[language] || value?.en || Object.values(value ?? {}).find(Boolean) || '';
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.method && options.method !== 'GET' ? { 'X-Manager-Token': token } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(translate(result.error || `Error ${response.status}`));
  return result;
}

function toast(message, error = false) {
  const element = document.createElement('div');
  element.className = `toast${error ? ' error' : ''}`;
  element.textContent = message;
  document.querySelector('#toast-region').append(element);
  setTimeout(() => element.remove(), 4200);
}

function clearDialogError() {
  dialogError.hidden = true;
  dialogError.textContent = '';
}

function showDialogError(message, invalidField) {
  const safeMessage = String(message || translate('The entry could not be saved.')).slice(0, 500);
  dialogError.innerHTML = `<strong>${escapeHtml(translate('Could not save your changes'))}</strong><p>${escapeHtml(safeMessage)}</p>`;
  if (invalidField) {
    invalidField.id ||= `dialog-invalid-${Date.now()}`;
    const link = document.createElement('a');
    link.href = `#${invalidField.id}`;
    link.textContent = translate('Review the first invalid field');
    link.addEventListener('click', (event) => {
      event.preventDefault();
      invalidField.focus();
    });
    dialogError.append(link);
  }
  dialogError.hidden = false;
  dialogError.focus();
}

function translate(message) {
  return window.managerI18n?.translate?.(message) ?? message;
}

async function quitManager(scope = 'all') {
  const confirmation = translate(
    scope === 'all'
      ? 'Stop all local QuestKeeper services? Manager, Companion and every service started here will close.'
      : 'Quit only the Campaign Manager? The local Companion will keep running until you stop it separately.',
  );
  if (!confirm(confirmation)) return;
  const button = document.querySelector('#quit-manager');
  button.disabled = true;
  button.textContent = translate('Stopping local services…');
  const result = await api('/api/shutdown', {
    method: 'POST',
    body: JSON.stringify({ confirmation: 'quit', scope }),
  });
  document.body.innerHTML = `<main class="shutdown-screen" role="status" aria-live="polite"><div class="shutdown-screen__sigil" aria-hidden="true">✦</div><h1>QuestKeeper is closed</h1><p>The Campaign Manager and the local services it started have stopped safely.</p><p>You can close this browser tab. Your published Companion remains online.</p></main>`;
  if (scope === 'manager') {
    document.body.innerHTML = `<main class="shutdown-screen" role="status" aria-live="polite"><div class="shutdown-screen__sigil" aria-hidden="true">&#10022;</div><h1>Campaign Manager is closed</h1><p>The Campaign Manager has stopped. Your local Companion is still available.</p><p>You can close this browser tab. Your published Companion remains online.</p></main>`;
  }
  window.managerI18n?.translateTree?.();
  document.title = result.message;
}

async function openLocalCompanion() {
  const handshake = await api('/api/companion-handshake', {
    method: 'POST',
    body: JSON.stringify({ campaignId: state.selectedId }),
  });
  window.open(myCharacterCompanionUrl(handshake.url), '_blank', 'noopener');
}

async function stopCompanion() {
  if (!confirm(translate('Stop the local Companion? The Campaign Manager will remain open.'))) {
    return;
  }
  await api('/api/actions/preview-stop', { method: 'POST', body: '{}' });
  serviceDialog.close();
  toast('The local Companion is stopping.');
  void refreshJobs();
}

function setMenuOpen(open) {
  document.body.classList.toggle('menu-open', open);
  mobileMenu.setAttribute('aria-expanded', String(open));
}

async function loadState({ selectFirst = false, allowFirstRunPrompt = false } = {}) {
  const result = await api('/api/state');
  state.campaigns = result.campaigns;
  state.project = {
    dependenciesReady: result.dependenciesReady,
    companion: result.companion,
    transcriber: result.transcriber,
    jobs: result.jobs,
    ai: result.ai,
    languageCatalog: result.languageCatalog ?? [],
    rulesetProfiles: result.rulesetProfiles ?? [],
    publishing: result.publishing,
    storage: result.storage,
  };
  const requestedCampaign = result.campaigns.find((campaign) => campaign.id === initialCampaignId);
  if ((selectFirst || requestedCampaign) && !state.selectedId && result.campaigns.length) {
    state.selectedId = requestedCampaign?.id ?? result.campaigns[0].id;
    state.campaign = await api(`/api/campaigns/${encodeURIComponent(state.selectedId)}`);
    state.libraryMode = false;
  }
  if (allowFirstRunPrompt && !state.firstRunEvaluated) {
    state.firstRunEvaluated = true;
    if ((result.ai?.config?.setupState ?? 'unseen') === 'unseen') {
      state.aiMode = true;
      state.aiConfigureExpanded = false;
    }
  }
  renderSidebar();
  render();
}

async function selectCampaign(id) {
  state.selectedId = id;
  state.projectMode = false;
  state.scribeMode = false;
  state.aiMode = false;
  state.compendiumMode = false;
  state.libraryMode = false;
  state.campaign = await api(`/api/campaigns/${encodeURIComponent(id)}`);
  state.entityTranslations = null;
  state.tab = 'overview';
  setMenuOpen(false);
  renderSidebar();
  render();
}

function renderSidebar() {
  const campaigns = filteredCampaigns();
  campaignList.innerHTML = campaigns.length
    ? campaigns
        .map(
          (item) => `
          <button class="campaign-link ${item.id === state.selectedId && !state.libraryMode && !state.projectMode && !state.scribeMode && !state.aiMode && !state.compendiumMode ? 'active' : ''}" data-campaign="${escapeHtml(item.id)}">
            <span class="campaign-link__sigil">${escapeHtml(localized(item.name).charAt(0).toUpperCase() || '✦')}</span>
            <span><strong>${escapeHtml(localized(item.name, item.defaultLanguage ?? 'en'))}</strong><small>${escapeHtml(localized(item.status, item.defaultLanguage ?? 'en') || 'Campaign')}</small></span>
            <span class="campaign-link__count">${item.counts.characters}</span>
          </button>`,
        )
        .join('')
    : '<div class="empty">No campaigns found.</div>';
  document.querySelector('#show-library').classList.toggle('active', state.libraryMode);
  document.querySelector('#show-compendia').classList.toggle('active', state.compendiumMode);
  renderAiSetupNavigation();
}

function filteredCampaigns() {
  const query = document.querySelector('#campaign-search').value.trim().toLowerCase();
  return state.campaigns.filter((item) =>
    `${localized(item.name)} ${localized(item.description)} ${localized(item.status)}`
      .toLowerCase()
      .includes(query),
  );
}

function rulesetPublicLabel(gameSystem, legacyEdition = '', language = 'en') {
  const authoredLabel = String(gameSystem?.edition ?? legacyEdition).trim();
  const legacy = String(legacyEdition).toLowerCase();
  const inferredId =
    gameSystem?.id ||
    (legacy.includes('2024') || legacy.includes('5.5')
      ? 'dnd-2024'
      : legacy.includes('d&d') || legacy.includes('dungeons & dragons') || legacy.includes('5e')
        ? 'dnd-2014'
        : legacy.includes('pathfinder')
          ? 'pf2e-remaster'
          : legacy.includes('cthulhu')
            ? 'coc7e'
            : 'generic');
  const labels = {
    'dnd-2014': {
      en: 'Dungeons & Dragons · 5th Edition (2014)',
      it: 'Dungeons & Dragons · 5a Edizione (2014)',
    },
    'dnd-2024': {
      en: 'Dungeons & Dragons · 5th Edition (2024)',
      it: 'Dungeons & Dragons · 5a Edizione (2024)',
    },
    'pf2e-remaster': {
      en: 'Pathfinder · Second Edition Remaster',
      it: 'Pathfinder · Seconda Edizione Remaster',
    },
    coc7e: { en: 'Call of Cthulhu · 7th Edition', it: 'Call of Cthulhu · 7a Edizione' },
  };
  const known = labels[inferredId];
  if (known) return known[language] ?? known.en;
  return authoredLabel || (language === 'it' ? 'GDR personalizzato' : 'Custom RPG');
}

function showLibrary() {
  state.libraryMode = true;
  state.projectMode = false;
  state.scribeMode = false;
  state.aiMode = false;
  state.compendiumMode = false;
  setMenuOpen(false);
  renderSidebar();
  render();
}

function renderAiSetupNavigation() {
  const button = document.querySelector('#show-ai-setup');
  const status = document.querySelector('#ai-setup-state');
  if (!button || !status) return;
  const setupState = state.project.ai?.config?.setupState ?? 'unseen';
  const hasError = Object.entries(state.project.jobs ?? {}).some(
    ([kind, job]) => kind.startsWith('ai-') && job?.status === 'failed',
  );
  const labels = {
    unseen: 'Choose setup',
    deferred: 'Remind me later',
    manual: 'Manual mode',
    draft: 'Draft saved',
    complete: 'Ready',
  };
  status.textContent = hasError ? 'Needs attention' : (labels[setupState] ?? labels.unseen);
  button.dataset.setupState = hasError ? 'error' : setupState;
  button.classList.toggle('is-incomplete', setupState !== 'complete');
  button.classList.toggle('is-error', hasError);
}

function renderCompanionAction() {
  const control = state.project.companion ?? {
    action: 'prepare',
    label: 'Start Companion',
    status: 'Preparation required',
  };
  const button = document.querySelector('#open-companion');
  const status = document.querySelector('#companion-state');
  const stopButton = document.querySelector('#stop-companion');
  button.textContent = control.label;
  if (control.action === 'open' && selectedMyCharacter()) {
    button.textContent = 'Open my character';
  }
  button.dataset.companionAction = control.action;
  button.disabled = control.action === 'wait';
  button.title = control.status;
  status.textContent = control.status;
  status.className = `companion-state companion-state--${control.action}`;
  stopButton.hidden = control.canStop !== true;
  document.querySelector('#service-stop-companion').disabled = control.canStop !== true;
}

function render() {
  renderCompanionAction();
  if (state.aiMode) {
    renderAiSetup();
    return;
  }
  if (state.compendiumMode) {
    renderCompendia();
    return;
  }
  if (state.scribeMode) {
    renderScribe();
    return;
  }
  if (state.projectMode) {
    renderProject();
    return;
  }
  if (state.libraryMode) {
    renderLibrary();
    return;
  }
  if (!state.campaign) {
    document.querySelector('#page-title').textContent = 'Your adventure archive';
    content.innerHTML = `
      <div class="welcome"><div class="welcome__inner">
        <div class="welcome__icon">✦</div>
        <span class="eyebrow">No JSON. No folders to copy.</span>
        <h2>Your next campaign starts here</h2>
        <p>Create a world, gather the party and chronicle each session through friendly forms. Campaign Companion prepares the files for you.</p>
        <div class="welcome__actions"><button class="primary-button" data-action="new-campaign">Create your first campaign</button><button class="secondary-button" data-action="import">Import a backup</button></div>
      </div></div>`;
    return;
  }
  renderCampaign();
}

function renderLibrary() {
  const campaigns = filteredCampaigns();
  document.querySelector('#page-title').textContent = 'Campaign Library';
  if (state.campaigns.length === 0) {
    content.innerHTML = `<div class="welcome"><div class="welcome__inner"><div class="welcome__icon" aria-hidden="true">&#10022;</div><span class="eyebrow">No JSON. No folders to copy.</span><h2>Your next campaign starts here</h2><p>Create a world, gather the party and chronicle each session through friendly forms.</p><div class="welcome__actions"><button class="primary-button" data-action="new-campaign">Create your first campaign</button><button class="secondary-button" data-action="import">Import a backup</button></div></div></div>`;
    return;
  }
  content.innerHTML = `
    <section class="library" aria-labelledby="library-title">
      <header class="library__header"><div><span class="eyebrow">Choose your table</span><h2 id="library-title">Your campaign library</h2><p>Open a chronicle or manage it without losing your place in the archive.</p></div><button class="primary-button" data-action="new-campaign">New campaign</button></header>
      ${
        campaigns.length
          ? `<div class="library-grid">${campaigns
              .map((item) => {
                const language = item.defaultLanguage ?? item.languages?.[0] ?? 'en';
                const name = localized(item.name, language) || 'Untitled campaign';
                const cover = item.thumbnail ? campaignAssetFor(item.id, item.thumbnail) : '';
                return `<article class="library-card">
            <div class="library-card__cover">${cover ? `<img src="${escapeHtml(cover)}" alt="" />` : `<span aria-hidden="true">${escapeHtml(name.charAt(0).toUpperCase() || '✦')}</span>`}</div>
            <div class="library-card__body"><div><span class="status-pill">${escapeHtml(localized(item.status, language) || 'Campaign')}</span><span class="library-card__ruleset">${escapeHtml(rulesetPublicLabel(item.gameSystem, item.details?.edition, language))}</span><h3>${escapeHtml(name)}</h3><p>${escapeHtml(localized(item.description, language) || 'A campaign ready to be chronicled.')}</p></div>
            <dl class="library-card__metrics"><div><dt>Party</dt><dd>${item.counts.characters}</dd></div><div><dt>NPCs</dt><dd>${item.counts.npcs}</dd></div><div><dt>Sessions</dt><dd>${item.counts.sessions}</dd></div><div><dt>Places</dt><dd>${item.counts.maps}</dd></div></dl>
            <footer class="library-card__actions"><button class="primary-button" data-library-action="open" data-id="${escapeHtml(item.id)}">Open campaign</button><details class="library-card__menu"><summary aria-label="More actions for ${escapeHtml(name)}">•••</summary><div><button type="button" data-library-action="edit" data-id="${escapeHtml(item.id)}">Edit details</button><button type="button" data-library-action="backup" data-id="${escapeHtml(item.id)}">Download backup</button></div></details></footer></div>
          </article>`;
              })
              .join('')}</div>`
          : '<div class="library-empty"><strong>No matching campaigns</strong><p>Try another search or create a new adventure.</p></div>'
      }
    </section>`;
}

async function showCompendia() {
  state.libraryMode = false;
  state.projectMode = false;
  state.scribeMode = false;
  state.aiMode = false;
  state.compendiumMode = true;
  setMenuOpen(false);
  await loadCompendia();
  renderSidebar();
  renderCompendia();
}

async function loadCompendia() {
  state.compendia = await api(
    `/api/compendia${state.compendiumSearch ? `?q=${encodeURIComponent(state.compendiumSearch)}` : ''}`,
  );
}

function compendiumEntryCard(entry = {}, index = 0, primaryLocale = 'en') {
  const name = localized(entry.name, primaryLocale);
  const summary = localized(entry.summary ?? entry.description, primaryLocale);
  return `<article class="compendium-entry-editor" data-compendium-entry>
    <div class="compendium-entry-editor__header"><strong>Entry ${index + 1}</strong><button class="quiet-button" type="button" data-compendium-remove-entry>Remove</button></div>
    <div class="form-grid">
      ${field('compendiumEntryId', 'Stable entry ID', entry.id ?? '', { required: true, hint: 'Lowercase letters, numbers, dots, underscores and hyphens.' })}
      ${field('compendiumEntryType', 'Type', entry.type ?? 'rule', { required: true, hint: 'Examples: spell, item, class, ability or rule.' })}
      ${field('compendiumEntryName', `Name · ${primaryLocale}`, name, { required: true })}
      ${field('compendiumEntrySummary', `Summary / table notes · ${primaryLocale}`, summary, { type: 'textarea', wide: true })}
      ${field('compendiumEntryReferences', 'Qualified references', (entry.references ?? []).join('\n'), { type: 'textarea', hint: 'Optional, one per line: namespace:type:id.' })}
      ${field('compendiumEntryOverride', 'Explicit override target', entry.overrideOf ?? '', { hint: 'Optional advanced reference: namespace:type:id. Never inferred.' })}
      <details class="field field--wide compendium-localizations"><summary>Other language values</summary><p>Optional JSON objects preserve translations when this package has several locales.</p>${field('compendiumEntryNameJson', 'Localized names', JSON.stringify(entry.name ?? {}, null, 2), { type: 'textarea', wide: true })}${field('compendiumEntrySummaryJson', 'Localized summaries', JSON.stringify(entry.summary ?? entry.description ?? {}, null, 2), { type: 'textarea', wide: true })}</details>
    </div>
  </article>`;
}

function compendiumPackageForm(pkg) {
  const manifest = pkg?.manifest ?? {};
  const source = manifest.source ?? {};
  const license = manifest.license ?? {};
  const locales = manifest.locales ?? ['en'];
  const primaryLocale = locales[0] ?? 'en';
  const suggestedNamespace = `table.${state.selectedId || 'my-table'}`.replace(/[^a-z0-9.-]/g, '-');
  return [
    `<section class="compendium-editor-intro field--wide"><strong>Private by default</strong><p>QuestKeeper stores this package in protected user data. Publication and redistribution rights are never inferred from a title, game or source.</p></section>`,
    section('Package identity'),
    field('compendiumNamespace', 'Stable namespace', manifest.namespace ?? suggestedNamespace, {
      required: true,
      hint: 'Example: table.night-owls. It cannot be renamed after the first save.',
    }),
    field('compendiumVersion', 'Version', manifest.version ?? '1.0.0', {
      required: true,
      hint: 'Semantic version, for example 1.0.0.',
    }),
    field('compendiumOwner', 'Owner / author', manifest.owner ?? '', { required: true }),
    field('compendiumLocales', 'Languages', locales.join(', '), {
      required: true,
      hint: 'BCP-47 language tags separated by commas, for example en, it.',
    }),
    section('Source and ruleset'),
    field('compendiumSourceName', 'Source name', source.name ?? 'Personal table notes', {
      required: true,
    }),
    field('compendiumSourceUrl', 'Source URL or local URI', source.url ?? '', {
      hint: 'Leave empty for a private questkeeper://local/... URI.',
    }),
    field('compendiumRuleset', 'Game system ID', manifest.ruleset?.id ?? 'generic', {
      required: true,
    }),
    field('compendiumEdition', 'System / edition', manifest.ruleset?.edition ?? 'House rules', {
      required: true,
    }),
    section('Sharing permission'),
    field('compendiumVisibility', 'Package visibility', manifest.visibility ?? 'private', {
      type: 'select',
      values: [
        ['private', 'Private · keep on this device'],
        ['public', 'Public · eligible only after license review'],
      ],
    }),
    `<label class="consent-check field--wide"><input name="compendiumRedistributable" type="checkbox" ${license.redistributable ? 'checked' : ''} /> I own or have verified permission to redistribute this material. QuestKeeper will not infer this right.</label>`,
    field('compendiumLicenseId', 'License identifier', license.id ?? 'All-Rights-Reserved', {
      required: true,
    }),
    field('compendiumLicenseUrl', 'License URL or local URI', license.url ?? ''),
    field(
      'compendiumAttribution',
      'Required attribution',
      license.attribution ?? manifest.owner ?? '',
      {
        required: true,
      },
    ),
    field(
      'compendiumTransformations',
      'Permitted transformations',
      (license.permittedTransformations ?? []).join('\n'),
      { type: 'textarea', hint: 'One per line. Leave empty when no permission was granted.' },
    ),
    section('Entries'),
    `<div class="compendium-entry-heading field--wide"><div><strong>Package entries</strong><small>Namespaced references prevent one package from silently hijacking another.</small></div><button class="secondary-button" type="button" data-compendium-add-entry>Add entry</button></div>`,
    `<div class="compendium-entry-list field--wide" data-compendium-entries>${(pkg?.entries ?? []).map((entry, index) => compendiumEntryCard(entry, index, primaryLocale)).join('')}</div>`,
  ].join('');
}

function openCompendiumEditor(pkg) {
  openDialog({
    title: pkg ? 'Edit local compendium' : 'New local compendium',
    eyebrow: 'Private rules & notes',
    html: compendiumPackageForm(pkg),
    editor: { kind: 'compendium', previousNamespace: pkg?.manifest?.namespace, original: pkg },
  });
  const namespace = fields.querySelector('[name="compendiumNamespace"]');
  if (pkg && namespace) namespace.readOnly = true;
}

function parseLocalizedJson(value, label) {
  try {
    const parsed = JSON.parse(value || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new Error(`${label} must be a JSON object keyed by language.`);
  }
}

function buildCompendiumPackage(form) {
  const namespace = form.get('compendiumNamespace').toString().trim();
  const locales = form
    .get('compendiumLocales')
    .toString()
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const primaryLocale = locales[0] || 'en';
  const sourceUrl =
    form.get('compendiumSourceUrl').toString().trim() || `questkeeper://local/${namespace}`;
  const licenseUrl = form.get('compendiumLicenseUrl').toString().trim() || sourceUrl;
  const sourceName = form.get('compendiumSourceName').toString().trim();
  const entries = [...fields.querySelectorAll('[data-compendium-entry]')].map((card) => {
    const name = parseLocalizedJson(
      card.querySelector('[name="compendiumEntryNameJson"]').value,
      'Localized names',
    );
    const summary = parseLocalizedJson(
      card.querySelector('[name="compendiumEntrySummaryJson"]').value,
      'Localized summaries',
    );
    name[primaryLocale] = card.querySelector('[name="compendiumEntryName"]').value.trim();
    summary[primaryLocale] = card.querySelector('[name="compendiumEntrySummary"]').value.trim();
    const overrideOf = card.querySelector('[name="compendiumEntryOverride"]').value.trim();
    return {
      id: card.querySelector('[name="compendiumEntryId"]').value.trim(),
      type: card.querySelector('[name="compendiumEntryType"]').value.trim(),
      name,
      summary,
      references: card
        .querySelector('[name="compendiumEntryReferences"]')
        .value.split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
      ...(overrideOf ? { overrideOf } : {}),
      citations: [{ label: sourceName, url: sourceUrl }],
    };
  });
  return {
    manifest: {
      schemaVersion: 1,
      namespace,
      version: form.get('compendiumVersion').toString().trim(),
      kind: 'local',
      visibility: form.get('compendiumVisibility').toString(),
      owner: form.get('compendiumOwner').toString().trim(),
      source: {
        name: sourceName,
        url: sourceUrl,
        upstreamVersion: form.get('compendiumVersion').toString().trim(),
        reviewedOn: new Date().toISOString().slice(0, 10),
        updatePolicy: 'Manual review through QuestKeeper Campaign Manager.',
      },
      ruleset: {
        id: form.get('compendiumRuleset').toString().trim(),
        edition: form.get('compendiumEdition').toString().trim(),
      },
      locales,
      license: {
        id: form.get('compendiumLicenseId').toString().trim(),
        url: licenseUrl,
        attribution: form.get('compendiumAttribution').toString().trim(),
        redistributable: form.get('compendiumRedistributable') === 'on',
        permittedTransformations: form
          .get('compendiumTransformations')
          .toString()
          .split('\n')
          .map((value) => value.trim())
          .filter(Boolean),
      },
    },
    entries,
  };
}

function renderCompendia() {
  document.querySelector('#page-title').textContent = 'Local compendia';
  const data = state.compendia ?? { packages: [], entries: [], conflicts: [] };
  const pending = state.compendiumImport;
  content.innerHTML = `
    <div class="compendium-workspace">
      <section class="project-panel compendium-hero"><div><span class="eyebrow">Private rules & table notes</span><h2>Your local compendia</h2><p>Create or import versioned packages without changing bundled rules. Local material stays on this device and sharing exports exclude it by default.</p></div><div class="action-row"><button class="primary-button" data-compendium-action="new">New package</button><button class="secondary-button" data-compendium-action="choose-import">Preview import</button></div></section>
      ${pending ? `<section class="project-panel compendium-import-review"><span class="eyebrow">Import preview · nothing written yet</span><h2>${escapeHtml(pending.preview.namespace || 'Invalid package')}</h2><dl class="compendium-preview-metrics"><div><dt>Entries</dt><dd>${pending.preview.entries}</dd></div><div><dt>Version</dt><dd>${escapeHtml(pending.preview.incomingVersion || '—')}</dd></div><div><dt>Conflicts</dt><dd>${pending.preview.conflicts.length}</dd></div><div><dt>Invalid links</dt><dd>${pending.preview.invalidLinks.length}</dd></div></dl>${pending.preview.errors.length ? `<div class="dialog__error"><strong>Validation errors</strong><ul>${pending.preview.errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul></div>` : ''}${pending.preview.invalidLinks.length ? `<div class="dialog__error"><strong>References to review</strong><ul>${pending.preview.invalidLinks.map((item) => `<li><code>${escapeHtml(item.entry)}</code> → <code>${escapeHtml(item.reference)}</code> (${escapeHtml(item.reason)})</li>`).join('')}</ul></div>` : ''}${pending.preview.overwriteRequired ? '<label class="consent-check"><input type="checkbox" data-compendium-overwrite /> Replace the installed namespace only after this preview.</label>' : ''}<div class="action-row"><button class="primary-button" data-compendium-action="confirm-import" ${pending.preview.valid ? '' : 'disabled'}>Import reviewed package</button><button class="secondary-button" data-compendium-action="cancel-import">Cancel</button></div></section>` : ''}
      <section class="project-panel"><div class="compendium-search-heading"><div><span class="eyebrow">Installed packages</span><h2>${data.packages.length} local package${data.packages.length === 1 ? '' : 's'}</h2></div><label class="search compendium-search"><span aria-hidden="true">⌕</span><input data-compendium-search type="search" value="${escapeHtml(state.compendiumSearch)}" placeholder="Search names, types or qualified IDs" /></label></div>${data.packages.length ? `<div class="compendium-package-grid">${data.packages.map((pkg) => `<article class="compendium-package-card"><div><span class="status-pill">${escapeHtml(pkg.visibility)}</span><span class="compendium-package-card__version">v${escapeHtml(pkg.version)}</span><h3>${escapeHtml(pkg.namespace)}</h3><p>${escapeHtml(pkg.source.name)} · ${escapeHtml(pkg.ruleset.edition)}</p></div><dl><div><dt>Entries</dt><dd>${pkg.entries}</dd></div><div><dt>Languages</dt><dd>${pkg.locales.map(escapeHtml).join(', ')}</dd></div><div><dt>License</dt><dd>${escapeHtml(pkg.license)}</dd></div></dl><footer><button class="secondary-button" data-compendium-action="edit" data-namespace="${escapeHtml(pkg.namespace)}">Edit</button><button class="secondary-button" data-compendium-action="export" data-namespace="${escapeHtml(pkg.namespace)}" data-private="${pkg.visibility === 'private'}">Export</button></footer></article>`).join('')}</div>` : '<div class="library-empty"><strong>No local packages yet</strong><p>Create personal rules or preview a package before importing it.</p></div>'}</section>
      <section class="project-panel"><span class="eyebrow">Resolved search</span><h2>${data.entries.length} matching entr${data.entries.length === 1 ? 'y' : 'ies'}</h2>${
        data.entries.length
          ? `<div class="compendium-result-list">${data.entries
              .slice(0, 100)
              .map(
                (entry) =>
                  `<article><code>${escapeHtml(entry.qualifiedId)}</code><h3>${escapeHtml(localized(entry.name))}</h3><p>${escapeHtml(localized(entry.summary) || entry.type)} · ${escapeHtml(entry.source)}</p></article>`,
              )
              .join('')}</div>`
          : '<p>No matching entries. Search includes bundled and local packages while preserving qualified identity.</p>'
      }</section>
    </div>`;
}

function downloadJson(value, fileName) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function previewCompendiumFile(file) {
  const pkg = JSON.parse(await file.text());
  const preview = await api('/api/compendia/import-preview', {
    method: 'POST',
    body: JSON.stringify(pkg),
  });
  state.compendiumImport = { package: preview.package, preview };
  renderCompendia();
}

async function saveCompendium(form) {
  const pkg = buildCompendiumPackage(form);
  const namespace = state.editor.previousNamespace || pkg.manifest.namespace;
  const path = state.editor.previousNamespace
    ? `/api/compendia/${encodeURIComponent(namespace)}`
    : '/api/compendia/import';
  await api(path, {
    method: state.editor.previousNamespace ? 'PUT' : 'POST',
    body: JSON.stringify({ package: pkg, overwriteConfirmed: false }),
  });
  await loadCompendia();
}

function campaignAssetFor(campaignId, path) {
  if (!path || !campaignId) return '';
  const prefix = `campaigns/${campaignId}/`;
  const relativePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;
  return `/campaign-assets/${encodeURIComponent(campaignId)}/${relativePath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

function campaignAsset(path) {
  return campaignAssetFor(state.selectedId, path);
}

function renderCampaign() {
  const data = state.campaign;
  const displayLanguage =
    data.manifestEntry.defaultLanguage ?? data.manifestEntry.languages?.[0] ?? 'en';
  const title = localized(data.manifestEntry.name, displayLanguage);
  document.querySelector('#page-title').textContent = title;
  const heroPath = data.manifestEntry.thumbnail || data.campaign.heroImages?.[0];
  const tabs = [
    ['overview', 'Overview'],
    ['characters', `Characters · ${data.characters.length}`],
    ['npcs', `NPCs · ${data.npcs.length}`],
    ['sessions', `Sessions · ${data.sessions.length}`],
    ['maps', `Locations · ${data.maps.length}`],
    ['translations', 'Translations'],
  ];
  content.innerHTML = `
    <section class="campaign-hero">
      ${heroPath ? `<img class="campaign-hero__art" src="${escapeHtml(campaignAsset(heroPath))}" alt="" />` : ''}
      <div class="campaign-hero__scrim"></div>
      <div class="campaign-hero__actions"><button class="secondary-button" data-action="edit-campaign">Edit</button><button class="secondary-button" data-action="export">Backup</button><button class="secondary-button danger-button" data-action="delete-campaign">Delete</button></div>
      <div class="campaign-hero__copy"><span class="status-pill">${escapeHtml(localized(data.manifestEntry.status, displayLanguage) || 'Campaign')}</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(localized(data.manifestEntry.description, displayLanguage))}</p></div>
    </section>
    <nav class="tabs" aria-label="Campaign sections">${tabs.map(([id, label]) => `<button class="tab ${state.tab === id ? 'active' : ''}" data-tab="${id}">${escapeHtml(label)}</button>`).join('')}</nav>
    <div id="tab-content">${renderTab()}</div>`;
}

function renderTab() {
  switch (state.tab) {
    case 'characters':
      return renderEntities('characters', 'Characters', 'Add character');
    case 'npcs':
      return renderEntities('npcs', 'Non-player characters', 'Add NPC');
    case 'sessions':
      return renderEntities('sessions', 'Session chronicles', 'Add session');
    case 'maps':
      return renderEntities('maps', 'Locations and maps', 'Add location');
    case 'translations':
      return renderEntityTranslations();
    default:
      return renderOverview();
  }
}

function translationEntityOptions() {
  const groups = [
    ['characters', state.campaign?.characters ?? []],
    ['npcs', state.campaign?.npcs ?? []],
    ['sessions', state.campaign?.sessions ?? []],
    ['maps', state.campaign?.maps ?? []],
  ];
  return groups.flatMap(([type, items]) =>
    items.map((item) => ({ type, id: item.id, label: `${type} · ${entityName(type, item)}` })),
  );
}

function renderEntityTranslations() {
  const languages = campaignLanguages();
  if (languages.length < 2) {
    return '<section class="project-panel"><h2>Entity translations</h2><p>Add at least two campaign languages before opening a translation batch.</p></section>';
  }
  const workspace = state.entityTranslations;
  const draft = workspace?.draft;
  const source =
    draft?.sourceLanguage ?? state.campaign.manifestEntry.defaultLanguage ?? languages[0];
  const target = draft?.targetLanguage ?? languages.find((language) => language !== source);
  const entities = translationEntityOptions();
  const counts = (draft?.items ?? []).reduce(
    (result, item) => ({ ...result, [item.status]: (result[item.status] ?? 0) + 1 }),
    {},
  );
  return `<section class="section-heading"><div><span class="eyebrow">Reviewed localization</span><h2>Entity translations</h2><p>Scan one field, one entity, one type or a selected batch. Missing and stale fields are selected by default.</p></div></section>
    <section class="project-panel translation-batch" data-entity-translations>
      <div class="form-grid">
        <label class="field"><span>Source language</span><select data-translation-source>${languages.map((language) => `<option value="${escapeHtml(language)}" ${language === source ? 'selected' : ''}>${escapeHtml(languageName(language))}</option>`).join('')}</select></label>
        <label class="field"><span>Target language</span><select data-translation-target>${languages.map((language) => `<option value="${escapeHtml(language)}" ${language === target ? 'selected' : ''}>${escapeHtml(languageName(language))}</option>`).join('')}</select></label>
        <label class="field"><span>Scope</span><select data-translation-scope><option value="all">All entity types</option><option value="characters">Characters</option><option value="npcs">NPCs</option><option value="sessions">Sessions</option><option value="maps">Locations</option><option value="party-relationships">Party relationships</option><option value="npc-relationships">NPC relationships</option><option value="entity">One entity</option></select></label>
        <label class="field"><span>Entity (optional)</span><select data-translation-entity><option value="">Choose after selecting “One entity”</option>${entities.map((item) => `<option value="${escapeHtml(`${item.type}:${item.id}`)}">${escapeHtml(item.label)}</option>`).join('')}</select></label>
      </div>
      <div class="action-row"><button class="primary-button" data-translation-action="plan">Scan translatable fields</button></div>
      ${draft ? `<div class="translation-statuses"><span class="translation-status translation-status--missing">Missing ${counts.missing ?? 0}</span><span class="translation-status translation-status--stale">Stale ${counts.stale ?? 0}</span><span class="translation-status translation-status--current">Current ${counts.current ?? 0}</span><span class="tag">Draft: ${escapeHtml(draft.status)}</span></div>` : '<p>Your recoverable draft will appear here.</p>'}
      ${
        draft?.items?.length
          ? `<div class="translation-batch__items">${draft.items.map((item, index) => `<article class="translation-field"><label class="consent-check"><input type="checkbox" data-translation-selected="${index}" ${item.selected ? 'checked' : ''} /> <strong>${escapeHtml(item.entityType)} / ${escapeHtml(item.entityId)}</strong> · ${escapeHtml(item.path)} <span class="tag">${escapeHtml(item.status)}</span></label><p><strong>${escapeHtml(source)}:</strong> ${escapeHtml(item.source)}</p><label class="field"><span>${escapeHtml(target)} draft</span><textarea data-translation-value="${index}">${escapeHtml(item.draft ?? item.target ?? '')}</textarea></label></article>`).join('')}</div>
        <div class="ai-engine-grid">${engineSelect('entityTranslationEngine', 'Translation model', 'prose', 'Local engines stay on this computer; remote engines receive only checked fields.')}</div>
        <label class="consent-check"><input type="checkbox" data-translation-consent /> I consent to sending the checked entity fields to the explicitly selected remote provider/model. Local models do not require cloud consent.</label>
        <label class="consent-check"><input type="checkbox" data-translation-overwrite /> Allow reviewed drafts to replace non-empty target text.</label>
        <div class="action-row"><button class="secondary-button" data-translation-action="ai">Create AI drafts</button><button class="secondary-button" data-translation-action="review">Save as reviewed</button><button class="primary-button" data-translation-action="apply" ${draft.status === 'reviewed' ? '' : 'disabled'}>Apply reviewed batch</button></div>`
          : ''
      }
      ${workspace?.lastReport ? `<p class="notice">Completed: ${workspace.lastReport.applied.length} fields applied; ${workspace.lastReport.skipped.length} skipped.</p>` : ''}
    </section>`;
}

function collectEntityTranslationDraft(status) {
  const draft = structuredClone(state.entityTranslations?.draft);
  if (!draft) return null;
  for (const [index, item] of draft.items.entries()) {
    item.selected =
      content.querySelector(`[data-translation-selected="${index}"]`)?.checked === true;
    item.draft =
      content.querySelector(`[data-translation-value="${index}"]`)?.value ?? item.draft ?? '';
  }
  draft.status = status ?? draft.status;
  return draft;
}

async function runEntityTranslationAction(action) {
  const base = `/api/campaigns/${encodeURIComponent(state.selectedId)}`;
  if (action === 'plan') {
    const scope = content.querySelector('[data-translation-scope]').value;
    const entityValue = content.querySelector('[data-translation-entity]').value;
    if (scope === 'entity' && !entityValue) throw new Error('Choose the entity to scan.');
    const [entityType, entityId] = entityValue.split(':');
    const entityTypes = scope === 'all' || scope === 'entity' ? undefined : [scope];
    state.entityTranslations = await api(`${base}/translations/plan`, {
      method: 'POST',
      body: JSON.stringify({
        sourceLanguage: content.querySelector('[data-translation-source]').value,
        targetLanguage: content.querySelector('[data-translation-target]').value,
        entityTypes: scope === 'entity' && entityType ? [entityType] : entityTypes,
        entityIds: scope === 'entity' && entityId ? [entityId] : [],
      }),
    });
    renderCampaign();
    return;
  }
  const reviewed = action === 'review' || action === 'apply';
  const draft = collectEntityTranslationDraft(reviewed ? 'reviewed' : 'draft');
  state.entityTranslations = await api(`${base}/translations/draft`, {
    method: 'PUT',
    body: JSON.stringify({ draft }),
  });
  if (action === 'ai') {
    const engineValue = content.querySelector('[name="entityTranslationEngine"]')?.value;
    state.entityTranslations = await api(`${base}/ai/translate-entities`, {
      method: 'POST',
      body: JSON.stringify({
        draft,
        engine: parseEngineValue(engineValue),
        remoteConsent: content.querySelector('[data-translation-consent]')?.checked === true,
      }),
    });
  } else if (action === 'apply') {
    const result = await api(`${base}/translations/apply`, {
      method: 'POST',
      body: JSON.stringify({
        overwrite: content.querySelector('[data-translation-overwrite]')?.checked === true,
      }),
    });
    state.entityTranslations = result.workspace;
    state.campaign = result.campaign;
  }
  renderCampaign();
  toast(
    action === 'apply' ? 'Translation batch completed.' : 'Recoverable translation draft saved.',
  );
}

function renderOverview() {
  const { campaign, characters, npcs, sessions, maps } = state.campaign;
  const myCharacter = selectedMyCharacter();
  return `
    <div class="metrics">
      ${[
        ['Characters', characters.length],
        ['NPCs', npcs.length],
        ['Sessions', sessions.length],
        ['Locations', maps.length],
      ]
        .map(
          ([label, value]) =>
            `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`,
        )
        .join('')}
    </div>
    <div class="overview-grid">
      <section class="project-panel my-character-panel"><span class="eyebrow">Quick return</span><h3>${myCharacter ? escapeHtml(entityName('characters', myCharacter)) : 'Choose my character'}</h3><p>${myCharacter ? 'The Manager will open this profile directly whenever the Companion is ready.' : 'Choose your character once from the Characters tab to make every return immediate.'}</p>${myCharacter ? `<button class="primary-button" data-action="open-my-character">Open my character</button>` : `<button class="secondary-button" data-action="show-characters">Choose from the party</button>`}</section>
      <section class="project-panel"><span class="eyebrow">The story so far</span><h2>${escapeHtml(localized(campaign.name))}</h2><p>${escapeHtml(localized(campaign.storySoFar) || 'Your running campaign recap will appear here.')}</p></section>
      <section class="project-panel"><h3>Table details</h3><dl class="detail-list"><div><dt>Game Master</dt><dd>${escapeHtml(campaign.dungeonMaster)}</dd></div><div><dt>Party</dt><dd>${escapeHtml(campaign.partyName)}</dd></div><div><dt>System</dt><dd>${escapeHtml(rulesetPublicLabel(campaign.gameSystem, campaign.edition, state.campaign.manifestEntry.defaultLanguage ?? 'en'))}</dd></div><div><dt>Started</dt><dd>${escapeHtml(campaign.startDate)}</dd></div></dl></section>
    </div>`;
}

function entityName(type, item) {
  if (type === 'sessions') return localized(item.title);
  return localized(item.name);
}

function entityDescription(type, item) {
  if (type === 'characters') return localized(item.publicProfile?.backstory);
  if (type === 'npcs') return localized(item.profile?.description);
  if (type === 'sessions') return localized(item.summary);
  return localized(item.description);
}

function entityTags(type, item) {
  if (type === 'characters') return [item.sheet?.classType, `Level ${item.sheet?.level ?? 1}`];
  if (type === 'npcs') return [localized(item.profile?.role), item.allegiance];
  if (type === 'sessions') return [`Session ${item.sessionNumber}`, item.date];
  return [localized(item.region), item.explorationStatus];
}

function renderEntities(type, title, addLabel) {
  const items = state.campaign[type];
  return `
    <div class="section-heading"><div><span class="eyebrow">Archive</span><h2>${title}</h2><p>Add, revise or remove every entry without opening a single data file.</p></div><button class="primary-button" data-action="add-entity" data-type="${type}">${addLabel}</button></div>
    ${
      items.length
        ? `<div class="card-grid">${items
            .map(
              (item) => `
      <article class="card ${type === 'characters' && selectedMyCharacter()?.id === item.id ? 'card--my-character' : ''}"><div class="card__top"><span class="card__avatar">${escapeHtml(entityName(type, item).charAt(0).toUpperCase() || '✦')}</span><div class="card__menu"><button data-action="edit-entity" data-type="${type}" data-id="${escapeHtml(item.id)}">Edit</button><button data-action="delete-entity" data-type="${type}" data-id="${escapeHtml(item.id)}">Remove</button></div></div><h3>${escapeHtml(entityName(type, item))}</h3><p>${escapeHtml(entityDescription(type, item)).slice(0, 180)}</p><div class="card__meta">${entityTags(
        type,
        item,
      )
        .filter(Boolean)
        .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join(
          '',
        )}</div>${type === 'characters' ? `<button class="card__my-character" data-action="set-my-character" data-id="${escapeHtml(item.id)}" aria-pressed="${selectedMyCharacter()?.id === item.id}">${selectedMyCharacter()?.id === item.id ? 'My character · change' : 'This is my character'}</button>` : ''}</article>`,
            )
            .join('')}</div>`
        : `<div class="empty">Nothing here yet. Choose “${addLabel}” to begin.</div>`
    }`;
}

function field(name, label, value = '', options = {}) {
  const wide = options.wide ? ' field--wide' : '';
  const required = options.required ? ' required' : '';
  const hint = options.hint ? `<small>${escapeHtml(options.hint)}</small>` : '';
  if (options.type === 'textarea') {
    return `<label class="field${wide}"><span>${escapeHtml(label)}</span><textarea name="${name}"${required}>${escapeHtml(value)}</textarea>${hint}</label>`;
  }
  if (options.type === 'select') {
    return `<label class="field${wide}"><span>${escapeHtml(label)}</span><select name="${name}">${options.values.map(([id, text]) => `<option value="${escapeHtml(id)}" ${id === value ? 'selected' : ''}>${escapeHtml(text)}</option>`).join('')}</select>${hint}</label>`;
  }
  if (options.type === 'file') {
    return `<label class="field${wide}"><span>${escapeHtml(label)}</span><input name="${name}" type="file" accept="image/png,image/jpeg,image/webp" />${hint}</label>`;
  }
  return `<label class="field${wide}"><span>${escapeHtml(label)}</span><input name="${name}" type="${options.type || 'text'}" value="${escapeHtml(value)}"${required}${options.min !== undefined ? ` min="${options.min}"` : ''} />${hint}</label>`;
}

function section(label) {
  return `<div class="form-section">${escapeHtml(label)}</div>`;
}

const MOOD_OPTIONS = [
  ['default', 'Default · inherit'],
  ['light', 'Light · open and warm'],
  ['dark', 'Dark · tense and intimate'],
];

function moodField(name, label, value = 'default', hint = '') {
  return `<div class="mood-field">${field(name, label, value, { type: 'select', values: MOOD_OPTIONS, hint })}<div class="mood-field__preview" aria-hidden="true"><i data-mood="default"></i><i data-mood="light"></i><i data-mood="dark"></i></div></div>`;
}

function moodPhaseCard(phase = {}, index = 0) {
  return `<article class="mood-phase" data-mood-phase><header><strong>Published phase</strong><button type="button" class="icon-button" data-mood-phase-remove aria-label="Remove phase">×</button></header><div class="form-grid">${field(`moodPhaseId__${index}`, 'Stable phase ID', phase.id || `phase-${index + 1}`)}${field(`moodPhaseLabel__${index}`, 'Editor label', phase.label || '')}${field(`moodPhaseStart__${index}`, 'Starts at published session ID', phase.startsAtSessionId || '', { hint: 'The phase activates only when this public session exists.' })}${moodField(`moodPhaseMood__${index}`, 'Phase mood', phase.mood || 'default')}</div></article>`;
}

function campaignMoodEditor(narrativeMood = {}) {
  const phases = narrativeMood.phases ?? [];
  return `<section class="mood-editor field--wide" data-mood-editor><div><strong>Narrative mood</strong><p>Presentation only. It never changes canon or reads hidden notes.</p></div>${moodField('campaignMoodDefault', 'Campaign default', narrativeMood.default || 'default')}<div class="mood-phase-list" data-mood-phase-list>${phases.map(moodPhaseCard).join('')}</div><button type="button" class="secondary-button" data-mood-phase-add>Add published phase</button></section>`;
}

function narrativeMoodFromFields() {
  const phases = [...fields.querySelectorAll('[data-mood-phase]')]
    .map((card) => ({
      id: card.querySelector('[name^="moodPhaseId__"]')?.value.trim(),
      label: card.querySelector('[name^="moodPhaseLabel__"]')?.value.trim() || undefined,
      startsAtSessionId: card.querySelector('[name^="moodPhaseStart__"]')?.value.trim(),
      mood: card.querySelector('[name^="moodPhaseMood__"]')?.value || 'default',
    }))
    .filter((phase) => phase.id && phase.startsAtSessionId);
  return {
    default: fields.querySelector('[name="campaignMoodDefault"]')?.value || 'default',
    ...(phases.length ? { phases } : {}),
  };
}

const PALETTE_ROLE_LABELS = {
  background: 'Background',
  surface: 'Surface',
  text: 'Text',
  accent: 'Accent and focus',
  border: 'Borders',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
};

const PALETTE_PRESETS = {
  heroic: {
    background: '#0A0A0F',
    surface: '#222233',
    text: '#F0EADB',
    accent: '#F4D96D',
    border: '#6E6E8B',
    success: '#73D69E',
    warning: '#F2C96D',
    danger: '#F08A8A',
  },
  gothic: {
    background: '#0D0B0E',
    surface: '#211A22',
    text: '#F0E7E1',
    accent: '#E7A0AD',
    border: '#8D5A68',
    success: '#79D29C',
    warning: '#EFC36A',
    danger: '#F08C99',
  },
  neutral: {
    background: '#101318',
    surface: '#1D242D',
    text: '#F0EDE6',
    accent: '#C6D9E7',
    border: '#78899A',
    success: '#75D4A0',
    warning: '#EBC66F',
    danger: '#EC9191',
  },
};

const PALETTE_CONTRAST_PAIRS = [
  ['text', 'background', 4.5],
  ['text', 'surface', 4.5],
  ['accent', 'background', 4.5],
  ['accent', 'surface', 4.5],
  ['border', 'background', 3],
  ['border', 'surface', 3],
  ['success', 'background', 4.5],
  ['warning', 'background', 4.5],
  ['danger', 'background', 4.5],
];

function paletteLuminance(color) {
  const channels = [1, 3, 5].map((index) => {
    const value = Number.parseInt(color.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function paletteContrast(first, second) {
  const light = Math.max(paletteLuminance(first), paletteLuminance(second));
  const dark = Math.min(paletteLuminance(first), paletteLuminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function paletteDraftFromFields() {
  const studio = fields.querySelector('[data-palette-studio]');
  if (!studio) return null;
  return {
    version: 1,
    name: studio.querySelector('[name="customPaletteName"]')?.value.trim() || 'Custom palette',
    base: studio.querySelector('[name="customPaletteBase"]')?.value || 'heroic',
    roles: Object.fromEntries(
      Object.keys(PALETTE_ROLE_LABELS).map((role) => [
        role,
        studio.querySelector(`[name="paletteRole__${role}"]`)?.value.toUpperCase(),
      ]),
    ),
  };
}

function paletteContrastReport(roles) {
  return PALETTE_CONTRAST_PAIRS.map(([foreground, background, minimum]) => {
    const ratio = paletteContrast(roles[foreground], roles[background]);
    return { foreground, background, minimum, ratio, passes: ratio >= minimum };
  });
}

function customPaletteStudio(customPalette, selectedPalette) {
  const base = ['heroic', 'gothic', 'neutral'].includes(customPalette?.base)
    ? customPalette.base
    : ['heroic', 'gothic', 'neutral'].includes(selectedPalette)
      ? selectedPalette
      : 'heroic';
  const roles = { ...PALETTE_PRESETS[base], ...(customPalette?.roles ?? {}) };
  return `<section class="palette-studio" data-palette-studio ${selectedPalette === 'custom' ? '' : 'hidden'}>
    <header><div><strong>Custom Companion palette</strong><small>Semantic roles keep every screen consistent.</small></div><div class="palette-studio__preset-actions">${Object.keys(
      PALETTE_PRESETS,
    )
      .map(
        (id) =>
          `<button type="button" class="secondary-button" data-palette-duplicate="${id}">Duplicate ${id}</button>`,
      )
      .join('')}</div></header>
    <input type="hidden" name="customPaletteBase" value="${escapeHtml(base)}" />
    ${field('customPaletteName', 'Palette name', customPalette?.name || 'Custom palette', { wide: true })}
    <div class="palette-studio__roles">${Object.entries(PALETTE_ROLE_LABELS)
      .map(
        ([role, label]) =>
          `<label class="palette-role"><span>${escapeHtml(label)}</span><span class="palette-role__controls"><input type="color" name="paletteRole__${role}" value="${escapeHtml(roles[role])}" /><output data-palette-value="${role}">${escapeHtml(roles[role])}</output><button type="button" class="icon-button" data-palette-reset="${role}" aria-label="Reset ${escapeHtml(label)}">↺</button></span></label>`,
      )
      .join('')}</div>
    <div class="palette-preview" data-palette-preview>
      <nav><strong>QuestKeeper</strong><a href="#" onclick="return false">Chronicle</a><a href="#" onclick="return false">Characters</a></nav>
      <article><span class="eyebrow">Representative Companion preview</span><h3>A card, a choice and a secret</h3><p>Body text and supporting information remain readable on campaign surfaces.</p><div><button type="button">Primary action</button><button type="button" class="preview-secondary">Secondary</button></div><aside tabindex="0"><strong>Protected content</strong><span>Focus and dialog boundaries stay visible.</span></aside><div class="palette-preview__states"><span data-state="success">Success</span><span data-state="warning">Warning</span><span data-state="danger">Danger</span></div></article>
    </div>
    <div class="palette-contrast" data-palette-contrast role="status" aria-live="polite"></div>
    <div class="action-row"><button type="button" class="secondary-button" data-palette-export>Export palette</button><button type="button" class="secondary-button" data-palette-import>Import palette</button><input type="file" accept="application/json,.json" data-palette-import-file hidden /></div>
  </section>`;
}

function palettePicker(value = 'heroic', customPalette) {
  const choices = [
    ['heroic', 'Heroic', 'Gold and midnight'],
    ['gothic', 'Gothic', 'Burgundy and fog'],
    ['neutral', 'Neutral', 'Slate and silver'],
    ['custom', 'Custom', 'Your accessible semantic roles'],
  ];
  return `<fieldset class="field field--wide palette-picker"><legend>Companion appearance</legend><p>Styles the published player Companion, not this Manager.</p><div class="palette-picker__grid">${choices
    .map(
      ([id, name, description]) =>
        `<label class="palette-choice palette-choice--${id}"><input type="radio" name="palette" value="${id}" ${id === value ? 'checked' : ''} /><span class="palette-choice__swatch" aria-hidden="true"><i></i><i></i><i></i></span><span><strong>${name}</strong><small>${description}</small></span></label>`,
    )
    .join(
      '',
    )}</div><small>Previewed here and applied when the Companion tab reloads or regains focus.</small>${customPaletteStudio(customPalette, value)}</fieldset>`;
}

function refreshPaletteStudio() {
  const studio = fields.querySelector('[data-palette-studio]');
  if (!studio) return;
  const selected = fields.querySelector('[name="palette"]:checked')?.value ?? 'heroic';
  studio.hidden = selected !== 'custom';
  const save = document.querySelector('#dialog-save');
  if (selected !== 'custom') {
    save.disabled = false;
    return;
  }
  const draft = paletteDraftFromFields();
  const preview = studio.querySelector('[data-palette-preview]');
  for (const [role, color] of Object.entries(draft.roles)) {
    preview.style.setProperty(`--preview-${role}`, color);
    studio.querySelector(`[data-palette-value="${role}"]`).textContent = color;
  }
  const report = paletteContrastReport(draft.roles);
  const failures = report.filter((entry) => !entry.passes);
  studio.querySelector('[data-palette-contrast]').innerHTML = report
    .map(
      (entry) =>
        `<span class="palette-contrast__item ${entry.passes ? 'pass' : 'fail'}"><strong>${entry.passes ? 'Pass' : 'Fix'}</strong> ${escapeHtml(PALETTE_ROLE_LABELS[entry.foreground])} / ${escapeHtml(PALETTE_ROLE_LABELS[entry.background])}: ${entry.ratio.toFixed(2)}:1 (min ${entry.minimum.toFixed(1)}:1)</span>`,
    )
    .join('');
  save.disabled = failures.length > 0;
}

function normalizeLanguageCodes(value) {
  const normalized = String(value ?? '')
    .split(/[\s,]+/)
    .map((code) => code.trim())
    .filter(Boolean)
    .map((code) => {
      try {
        return Intl.getCanonicalLocales(code)[0];
      } catch {
        return code;
      }
    });
  return [...new Set(normalized)];
}

function campaignLanguages() {
  const entry = state.campaign?.manifestEntry;
  const inferred = Object.keys(entry?.name ?? {});
  return entry?.languages?.length ? entry.languages : inferred.length ? inferred : ['en'];
}

function languageName(code) {
  try {
    const locale = window.managerI18n?.language === 'it' ? 'it' : 'en';
    return new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function campaignLanguagePicker(languages, defaultLanguage) {
  const catalog = state.project.languageCatalog ?? [];
  const locale = window.managerI18n?.language === 'it' ? 'it' : 'en';
  const datalistId = `campaign-language-catalog-${state.editor?.editing ? 'edit' : 'create'}`;
  const selected = languages
    .map(
      (code) =>
        `<li><span><strong>${escapeHtml(languageName(code))}</strong><small>${escapeHtml(code)}</small></span><button type="button" class="icon-button" data-language-remove="${escapeHtml(code)}" aria-label="Remove ${escapeHtml(languageName(code))}">×</button></li>`,
    )
    .join('');
  return `<fieldset class="field field--wide language-picker" data-language-picker><legend>Campaign content languages</legend><p>Search common languages by name or code. Regional variants remain separate.</p><div class="language-picker__add"><label class="field"><span>Find a language</span><input data-language-search list="${datalistId}" autocomplete="off" placeholder="English, Italiano, pt-BR…" /></label><button type="button" class="secondary-button" data-language-add>Add language</button></div><datalist id="${datalistId}">${catalog.map((item) => `<option value="${escapeHtml(item.code)}">${escapeHtml(item.names?.[locale] || item.names?.en || item.code)}</option>`).join('')}</datalist><ul class="language-picker__selected" data-language-selected>${selected}</ul><input type="hidden" name="languages" value="${escapeHtml(languages.join(','))}" /><label class="field"><span>Default language</span><select name="defaultLanguage">${languages.map((code) => `<option value="${escapeHtml(code)}" ${code === defaultLanguage ? 'selected' : ''}>${escapeHtml(languageName(code))} (${escapeHtml(code)})</option>`).join('')}</select></label><details><summary>Add a custom BCP-47 tag</summary><div class="language-picker__add"><label class="field"><span>Custom language tag</span><input data-language-custom autocomplete="off" placeholder="sr-Latn or en-GB" /></label><button type="button" class="secondary-button" data-language-add-custom>Add custom language</button></div><small>Use this for a valid language or regional variant not listed above.</small></details><p class="language-picker__message" data-language-message role="status" aria-live="polite"></p></fieldset>`;
}

function campaignLocalizedBlock(values, languages, defaultLanguage, includeStory = true) {
  return `<div class="campaign-localized-fields field--wide" data-campaign-localized-fields>${section('Name and introduction')}${localizedFields('name', 'Campaign name', values.name, languages, { required: true, requiredLanguage: defaultLanguage, hint: 'Required only in the default language; other translations may remain drafts.' }).join('')}${localizedFields('description', 'Description', values.description, languages, { type: 'textarea' }).join('')}${localizedFields('status', 'Status', values.status, languages).join('')}${includeStory ? `${section('Running recap')}${localizedFields('story', 'Story so far', values.story, languages, { type: 'textarea' }).join('')}` : ''}</div>`;
}

function translationWorkspace(languages) {
  if (languages.length < 2) return '';
  const source = state.campaign?.manifestEntry?.defaultLanguage ?? languages[0];
  const target = languages.find((language) => language !== source) ?? languages[1];
  const translationState = state.campaign?.campaign?.translationState ?? {};
  const badges = languages
    .filter((language) => language !== source)
    .map((language) => {
      const values = storedCampaignValuesForLanguage(language);
      const record = translationState[language];
      const status = Object.values(values).some((value) => String(value || '').trim())
        ? record?.sourceSnapshot &&
          record.sourceSnapshot !== JSON.stringify(storedCampaignValuesForLanguage(source))
          ? 'stale'
          : record?.status || 'manual'
        : 'missing';
      return `<span class="translation-status translation-status--${status}">${escapeHtml(languageName(language))}: ${escapeHtml(status)}</span>`;
    })
    .join('');
  return `<section class="translation-workspace field--wide"><div><strong>Translation workspace</strong><p>Write manually in the fields above, or create an editable AI draft. Existing text is never overwritten without confirmation.</p><div class="translation-statuses">${badges}</div></div><div class="ai-engine-grid"><label class="field"><span>Source language</span><select name="translationSource">${languages.map((language) => `<option value="${escapeHtml(language)}" ${language === source ? 'selected' : ''}>${escapeHtml(languageName(language))}</option>`).join('')}</select></label><label class="field"><span>Target language</span><select name="translationTarget">${languages.map((language) => `<option value="${escapeHtml(language)}" ${language === target ? 'selected' : ''}>${escapeHtml(languageName(language))}</option>`).join('')}</select></label>${engineSelect('translationEngine', 'Translation model', 'prose', 'Choose a configured local or remote structured-text model.')}</div><label class="consent-check"><input name="translationRemoteConsent" type="checkbox" /> I consent to sending only the four visible campaign fields to the selected engine when it is Remote.</label><div class="action-row"><button type="button" class="primary-button" data-translate-campaign>Create translation draft</button></div><div class="ai-review" data-translation-review hidden></div></section>`;
}

function storedCampaignValuesForLanguage(language) {
  const entry = state.campaign?.manifestEntry ?? {};
  const campaign = state.campaign?.campaign ?? {};
  return {
    name: entry.name?.[language] ?? '',
    description: entry.description?.[language] ?? '',
    status: entry.status?.[language] ?? '',
    story: campaign.storySoFar?.[language] ?? '',
  };
}

function currentCampaignValuesForLanguage(language) {
  const values = currentCampaignLocalizedValues();
  return Object.fromEntries(
    ['name', 'description', 'status', 'story'].map((key) => [key, values[key]?.[language] ?? '']),
  );
}

function rulesetProfile(id) {
  const profiles = state.project.rulesetProfiles ?? [];
  return (
    profiles.find((profile) => profile.id === id) ??
    profiles.at(-1) ?? { fields: [], presentationFields: [] }
  );
}

function campaignRuleset(campaign = state.campaign) {
  return campaign?.campaign?.gameSystem ?? campaign?.manifestEntry?.gameSystem ?? { id: 'generic' };
}

function rulesetPicker(value = { id: 'generic', customLabels: {} }) {
  const profiles = state.project.rulesetProfiles ?? [];
  const labels = value.customLabels ?? {};
  return `${field('gameSystemId', 'Game system', value.id || 'generic', { type: 'select', values: profiles.map((profile) => [profile.id, profile.names?.en || profile.id]), hint: 'Controls terminology and authoring fields without changing stored character values.' })}<details class="field field--wide"><summary>Custom terminology</summary><p>Used by the Generic / custom profile. Leave a label blank to hide that identity or presentation field.</p><div class="form-grid">${[
    ['ancestry', 'Origin / ancestry'],
    ['class', 'Role / archetype'],
    ['specialization', 'Specialization'],
    ['background', 'Background'],
    ['sex', 'Sex / gender'],
    ['pronouns', 'Pronouns'],
  ]
    .map(([key, fallback]) => field(`rulesetLabel__${key}`, fallback, labels[key] ?? fallback))
    .join('')}</div></details>`;
}

function customEditionField(value = '', rulesetId = 'generic') {
  return `<div class="field field--wide" data-custom-edition ${rulesetId === 'generic' ? '' : 'hidden'}>${field('edition', 'Custom system / edition', value, { hint: 'Only needed for a generic or homebrew ruleset.' })}</div>`;
}

function activeIdentityFields() {
  const system = campaignRuleset();
  const profile = rulesetProfile(system.id);
  return (profile.fields ?? [])
    .map((definition) => ({
      ...definition,
      label:
        profile.id === 'generic' && system.customLabels?.[definition.key] !== undefined
          ? system.customLabels[definition.key]
          : definition.labels?.en || definition.key,
    }))
    .filter((definition) => definition.label);
}

function activePresentationFields() {
  const system = campaignRuleset();
  const profile = rulesetProfile(system.id);
  return (profile.presentationFields ?? [])
    .map((definition) => ({
      ...definition,
      label:
        profile.id === 'generic' && system.customLabels?.[definition.key] !== undefined
          ? system.customLabels[definition.key]
          : definition.labels?.en || definition.key,
    }))
    .filter((definition) => definition.label);
}

function rulesetIdentityField(definition, sheet = {}) {
  const value = sheet?.[definition.storageKey] ?? '';
  const options = definition.options ?? [];
  const known = options.find((option) => option.value === value);
  const listId = `ruleset-${definition.key}-options`;
  const stateLabel = known
    ? `${known.provenance?.source || 'Profile catalog'} · ${known.provenance?.license || 'licensed'}`
    : value
      ? 'Custom or imported value · preserved exactly'
      : 'Choose a suggestion or type a custom value';
  return `<label class="field ruleset-combobox"><span>${escapeHtml(definition.label)}</span><input name="${escapeHtml(definition.storageKey)}" value="${escapeHtml(value)}" list="${listId}" autocomplete="off" aria-describedby="${listId}-hint" /><datalist id="${listId}">${options.map((option) => `<option value="${escapeHtml(option.value)}"></option>`).join('')}</datalist><small id="${listId}-hint" class="ruleset-combobox__state ${value && !known ? 'is-custom' : ''}">${escapeHtml(stateLabel)}</small></label>`;
}

function localizedFields(prefix, label, value, languages, options = {}) {
  const requiredLanguage = options.requiredLanguage ?? campaignLanguages()[0];
  return languages.map((language) => {
    const fieldOptions = {
      ...options,
      required: Boolean(options.required && language === requiredLanguage),
    };
    delete fieldOptions.requiredLanguage;
    return field(
      `loc__${prefix}__${language}`,
      `${label} · ${languageName(language)} (${language})`,
      value?.[language] ?? '',
      fieldOptions,
    );
  });
}

function engineValue(provider, model) {
  return `${provider}::${model}`;
}

function parseEngineValue(value) {
  const separator = String(value || '').indexOf('::');
  if (separator < 1) return null;
  return { provider: value.slice(0, separator), model: value.slice(separator + 2) };
}

const AI_ROLE_CAPABILITIES = {
  prose: ['text', 'structured-output'],
  extraction: ['text', 'structured-output', 'vision'],
  imagePrompt: ['text', 'structured-output', 'image-prompt'],
  image: ['image-generation'],
};

function engineChoices(role) {
  const config = state.project.ai?.config;
  if (!config) return [];
  const local =
    role === 'image'
      ? (config.image.comfyCheckpoints ?? []).map((model) => ({
          value: engineValue('comfyui', model),
          label: `Local · ComfyUI · ${model}`,
        }))
      : (config.text.ollamaModels ?? []).map((model) => ({
          value: engineValue('ollama', model),
          label: `Local · Ollama · ${model}`,
        }));
  const required = AI_ROLE_CAPABILITIES[role] ?? [];
  const remote = (state.project.ai.registry ?? []).flatMap((provider) => {
    const saved = config.providers?.[provider.id];
    if (!saved?.keyConfigured) return [];
    return (saved.models ?? [])
      .filter((model) => required.every((capability) => model.capabilities?.includes(capability)))
      .map((model) => ({
        value: engineValue(provider.id, model.id),
        label: `Remote · ${provider.label} · ${model.id}`,
      }));
  });
  return [...local, ...remote];
}

function defaultEngineValue(role) {
  const config = state.project.ai?.config;
  if (!config) return '';
  const configured = config.roles?.[role];
  if (configured?.provider && configured.provider !== 'off' && configured.model) {
    return engineValue(configured.provider, configured.model);
  }
  return engineChoices(role)[0]?.value ?? '';
}

function engineSelect(name, label, role, hint) {
  const choices = engineChoices(role);
  const selected = defaultEngineValue(role);
  return `<label class="field"><span>${escapeHtml(label)}</span><select name="${name}">${choices.length ? choices.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === selected ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('') : '<option value="">Configure a model first</option>'}</select><small>${escapeHtml(hint)}</small></label>`;
}

const NOTEBOOK_MOODS = [
  'joyful',
  'tender',
  'calm',
  'hopeful',
  'mysterious',
  'wary',
  'uneasy',
  'fractured',
  'grief',
  'guilt',
  'memory',
  'time',
  'music',
  'renewal',
];

function notebookLocalizedFields(prefix, label, value, languages, options = {}) {
  return languages
    .map((language) =>
      field(
        `notebook__${prefix}__${language}`,
        `${label} · ${languageName(language)} (${language})`,
        localized(value, language),
        options,
      ),
    )
    .join('');
}

function notebookPageEditor(page = {}, languages = campaignLanguages(), index = 0) {
  const pageId = page.id || `page-${index + 1}`;
  return `<article class="notebook-page-card" data-notebook-page>
    <div class="notebook-page-card__header"><strong>Spread ${index + 1}</strong><button class="quiet-button" type="button" data-notebook-remove-page>Remove page</button></div>
    <div class="form-grid">
      ${field('notebookPageId', 'Page ID', pageId, { hint: 'Stable identifier. It must be unique inside this notebook.' })}
      ${field('notebookPageMood', 'Mood', page.mood || 'memory', { type: 'select', values: NOTEBOOK_MOODS.map((mood) => [mood, mood.charAt(0).toUpperCase() + mood.slice(1)]) })}
      ${notebookLocalizedFields('pageTitle', 'Page title', page.title, languages)}
      ${notebookLocalizedFields('pageEra', 'Era / chapter', page.era, languages)}
      ${notebookLocalizedFields('pageReflection', 'Owner reflection', page.reflection, languages, { type: 'textarea', wide: true })}
      ${field('notebookPageImage', 'Illustrated spread', '', { type: 'file', hint: 'Landscape 3:2 image containing the complete two-page spread.' })}
      ${field('notebookPageAlt', 'Accessibility text', page.image?.alt || '', { wide: true })}
      <input type="hidden" name="notebookPagePath" value="${escapeHtml(page.image?.url || '')}" />
      ${page.image?.url ? `<figure class="notebook-asset-preview field--wide"><img src="${escapeHtml(campaignAsset(page.image.url))}" alt="${escapeHtml(page.image.alt || '')}" /><figcaption>Current spread · upload a file only to replace it.</figcaption></figure>` : ''}
    </div>
  </article>`;
}

function notebookEditor(item = {}, languages = campaignLanguages()) {
  const notebook = item.notebook ?? {};
  const enabled = Boolean(item.notebook);
  const covers = [
    ['front', 'Front cover', notebook.frontCover],
    ['back', 'Back cover', notebook.backCover],
  ];
  return `<section class="notebook-editor field--wide" data-notebook-editor>
    <div class="notebook-editor__header"><div><strong>Personal notebook</strong><small>Optional illustrated journal owned by this character.</small></div><label class="notebook-toggle"><input name="notebookEnabled" type="checkbox" ${enabled ? 'checked' : ''} data-notebook-toggle /> Give this character a notebook</label></div>
    <div class="notebook-editor__body" data-notebook-body ${enabled ? '' : 'hidden'}>
      <div class="form-grid">
        ${notebookLocalizedFields('title', 'Notebook title', notebook.title, languages)}
        ${notebookLocalizedFields('description', 'Short description', notebook.description, languages, { type: 'textarea', wide: true })}
        ${field('notebookPassword', 'Notebook password', notebook.password || 'cambiami', { hint: 'Discourages casual spoilers; this is not encryption.' })}
        ${field('notebookStyleDirectives', 'Character-specific art direction', notebook.styleDirectives || '', { type: 'textarea', wide: true, hint: 'Describe this owner’s medium, palette, handwriting, recurring symbols and how mood should alter the pages.' })}
      </div>
      <div class="notebook-cover-grid">${covers
        .map(
          ([key, label, cover]) =>
            `<section class="notebook-cover-card"><strong>${label}</strong>${field(`notebook${key}Cover`, 'Cover image', '', { type: 'file', hint: 'Portrait 2:3. Front spine on the left; back spine on the right.' })}${field(`notebook${key}CoverAlt`, 'Accessibility text', cover?.alt || '')}<input type="hidden" name="notebook${key}CoverPath" value="${escapeHtml(cover?.url || '')}" />${cover?.url ? `<img src="${escapeHtml(campaignAsset(cover.url))}" alt="${escapeHtml(cover.alt || '')}" />` : ''}</section>`,
        )
        .join('')}</div>
      <div class="notebook-pages-heading"><div><strong>Interior spreads</strong><small>Each image is one complete landscape opening.</small></div><button class="secondary-button" type="button" data-notebook-add-page>Add page</button></div>
      <div class="notebook-page-list" data-notebook-pages>${(notebook.pages ?? []).map((page, index) => notebookPageEditor(page, languages, index)).join('')}</div>
      <div class="ai-compose notebook-ai"><div><strong>Create an editable notebook with AI</strong><small>The result remains a draft. Nothing replaces this form until you review and save it.</small></div><div class="form-grid">${field('notebookBrief', 'Notebook subject', '', { type: 'textarea', wide: true, hint: 'Describe the memories, events or themes the pages may contain. Include private facts only if you intend to send them to the selected provider.' })}${field('notebookPageCount', 'Number of spreads', Math.max(1, notebook.pages?.length || 2), { type: 'number', min: 1 })}<label class="field"><span>Draft language</span><select name="notebookLanguage">${languages.map((language) => `<option value="${escapeHtml(language)}">${escapeHtml(languageName(language))} (${escapeHtml(language)})</option>`).join('')}</select></label></div><div class="ai-engine-grid">${engineSelect('notebookImagePromptEngine', 'Prompt writer', 'imagePrompt', 'Plans covers, page content and placement.')}${engineSelect('notebookImageEngine', 'Image renderer', 'image', 'Renders the cover and complete spreads.')}</div><label class="consent-check"><input name="notebookRemoteConsent" type="checkbox" /> I consent to sending this character context and notebook brief to any selected engine labelled <strong>Remote</strong>.</label><div class="action-row"><button class="primary-button" type="button" data-ai-notebook>Generate notebook draft with images</button></div><div class="ai-review" data-notebook-review hidden></div></div>
    </div>
  </section>`;
}

const STORY_SOURCE_KINDS = [
  ['none', 'No linked source'],
  ['chapter', 'Personal chapter'],
  ['notebook', 'Notebook'],
  ['diary', 'Session diary'],
  ['quote', 'Character quote'],
  ['chronicle', 'Campaign chronicle'],
];

function storyLocalizedFields(prefix, label, value, languages, options = {}) {
  return languages
    .map((language) =>
      field(
        `story__${prefix}__${language}`,
        `${label} Â· ${languageName(language)} (${language})`,
        localized(value, language),
        options,
      ),
    )
    .join('');
}

function storyHighlightCard(kind, item = {}, languages = campaignLanguages(), index = 0) {
  const source = item.source ?? {};
  const definitions = {
    quickFacts: {
      title: `Quick fact ${index + 1}`,
      fields: `${storyLocalizedFields('label', 'Label', item.label, languages)}${storyLocalizedFields('value', 'Value', item.value, languages)}`,
    },
    signatureItems: {
      title: `Signature item ${index + 1}`,
      fields: `${storyLocalizedFields('name', 'Item name', item.name, languages)}${storyLocalizedFields('description', 'Why it matters', item.description, languages, { type: 'textarea', wide: true })}${field('storySourceKind', 'Public story source', source.kind ?? 'none', { type: 'select', values: STORY_SOURCE_KINDS })}${field('storySourceId', 'Source ID', source.id ?? '', { hint: 'Optional chapter, notebook page, session or chronicle ID.' })}${storyLocalizedFields('sourceLabel', 'Source link label', source.label, languages)}`,
    },
    favouriteMoments: {
      title: `Favourite moment ${index + 1}`,
      fields: `${storyLocalizedFields('title', 'Moment title', item.title, languages)}${storyLocalizedFields('summary', 'Why it matters', item.summary, languages, { type: 'textarea', wide: true })}${field('storySourceKind', 'Public story source', source.kind ?? 'diary', { type: 'select', values: STORY_SOURCE_KINDS.filter(([value]) => value !== 'none') })}${field('storySourceId', 'Source ID', source.id ?? '', { hint: 'Optional chapter, notebook page, session or chronicle ID.' })}${storyLocalizedFields('sourceLabel', 'Source link label', source.label, languages)}`,
    },
  };
  const definition = definitions[kind];
  return `<article class="story-highlight-card" data-story-card data-story-kind="${kind}">
    <div class="story-highlight-card__header"><strong>${definition.title}</strong><button class="quiet-button" type="button" data-story-remove>Remove</button></div>
    <input type="hidden" name="storyId" value="${escapeHtml(item.id || '')}" />
    <div class="form-grid">${definition.fields}</div>
  </article>`;
}

function storyHighlightsEditor(item = {}, languages = campaignLanguages()) {
  const profile = item.publicProfile ?? {};
  const groups = [
    ['quickFacts', 'Quick facts', 'Short non-mechanical details for the profile opening.'],
    [
      'signatureItems',
      'Signature items',
      'Meaningful possessions, separate from mechanical inventory.',
    ],
    [
      'favouriteMoments',
      'Favourite moments',
      'Subjective memories that always point to a public source.',
    ],
  ];
  return `<section class="story-highlights-editor field--wide" data-story-highlights-editor>
    <div class="story-highlights-editor__intro"><strong>Story highlights</strong><small>Optional details that make the public profile personal without turning it into a statistics dashboard.</small></div>
    ${groups
      .map(
        ([kind, title, hint]) => `<section class="story-highlight-group">
          <div class="story-highlight-group__header"><div><strong>${title}</strong><small>${hint}</small></div><button class="secondary-button" type="button" data-story-add="${kind}">Add</button></div>
          <div class="story-highlight-list" data-story-list="${kind}">${(profile[kind] ?? []).map((entry, index) => storyHighlightCard(kind, entry, languages, index)).join('')}</div>
        </section>`,
      )
      .join('')}
  </section>`;
}

function entityAiImportPanel(type, languages) {
  const label = type === 'characters' ? 'player character' : 'NPC';
  return `<div class="ai-compose entity-ai-import field--wide"><div><strong>Import this ${label} with AI</strong><small>Use photos or screenshots of a sheet, or a public/shared Roll20 print-view URL. Every extracted field stays editable.</small></div><div class="ai-source-grid">${engineSelect('entityEngine', 'Extraction model', 'extraction', 'Only configured models with structured output and vision appear here. Public URL access also requires web capability.')}<label class="field"><span>Draft language</span><select name="entityLanguage">${languages.map((language) => `<option value="${escapeHtml(language)}">${escapeHtml(languageName(language))} (${escapeHtml(language)})</option>`).join('')}</select></label><label class="field field--wide"><span>Sheet photos or screenshots</span><input name="aiSourceImages" type="file" accept="image/png,image/jpeg,image/webp" multiple /><small>Up to four images. Private/authenticated Roll20 sheets should be imported this way.</small></label><label class="field field--wide"><span>Public Roll20 print view or source URL</span><input name="aiSourceUrl" type="url" placeholder="https://app.roll20.net/…" /><small>Optional. Signed-in pages cannot be read remotely; use screenshots instead.</small></label></div><label class="consent-check"><input name="entityRemoteConsent" type="checkbox" /> I consent to sending these sources to the selected engine when it is labelled <strong>Remote</strong>.</label><div class="action-row"><button class="primary-button" type="button" data-ai-entity="${type}">Extract editable draft</button></div><div class="ai-review" data-ai-entity-review hidden></div></div>`;
}

function openDialog({ title, eyebrow, html, editor }) {
  clearDialogError();
  document.querySelector('#dialog-title').textContent = title;
  document.querySelector('#dialog-eyebrow').textContent = eyebrow;
  fields.innerHTML = `<div class="form-grid">${html}</div>`;
  state.editor = editor;
  dialog.showModal();
  fields.querySelector('input, textarea, select')?.focus();
}

function campaignForm(campaign) {
  const entry = campaign?.manifestEntry ?? {};
  const details = campaign?.campaign ?? {};
  const editing = Boolean(campaign);
  const languages = editing ? campaignLanguages() : ['en'];
  if (!editing) {
    return [
      state.advancedMode
        ? field('id', 'Campaign ID override', '', {
            hint: 'Optional before first save. Leave blank to generate it from the campaign name.',
          })
        : '',
      field('startDate', 'Start date', new Date().toISOString().slice(0, 10), { type: 'date' }),
      section('Languages'),
      campaignLanguagePicker(languages, 'en'),
      campaignLocalizedBlock(
        { name: {}, description: {}, status: { en: 'In progress' }, story: {} },
        languages,
        'en',
        false,
      ),
      section('Game system'),
      rulesetPicker({ id: 'generic', customLabels: {} }),
      customEditionField('', 'generic'),
      palettePicker('heroic'),
      section('Narrative presentation'),
      campaignMoodEditor({}),
      section('Your table'),
      field('dungeonMaster', 'Game Master', ''),
      field('partyName', 'Party name', ''),
      field('cover', 'Cover image', '', { type: 'file', hint: 'PNG, JPEG or WebP · up to 8 MB' }),
    ].join('');
  }
  const gameSystem = campaignRuleset(campaign);
  return [
    state.advancedMode
      ? field('id', 'Campaign ID', entry.id ?? '', {
          hint: 'Stable after creation. Shown for integrations and troubleshooting.',
        })
      : '',
    field('startDate', 'Start date', details.startDate ?? new Date().toISOString().slice(0, 10), {
      type: 'date',
    }),
    section('Languages'),
    campaignLanguagePicker(languages, entry.defaultLanguage ?? languages[0]),
    campaignLocalizedBlock(
      {
        name: entry.name,
        description: entry.description,
        status: entry.status,
        story: details.storySoFar,
      },
      languages,
      entry.defaultLanguage ?? languages[0],
    ),
    translationWorkspace(languages),
    section('Game system'),
    rulesetPicker(gameSystem),
    customEditionField(details.edition ?? gameSystem.edition ?? '', gameSystem.id),
    palettePicker(entry.palette ?? 'heroic', entry.customPalette),
    section('Narrative presentation'),
    campaignMoodEditor(details.narrativeMood ?? {}),
    section('Your table'),
    field('dungeonMaster', 'Game Master', details.dungeonMaster ?? ''),
    field('partyName', 'Party name', details.partyName ?? ''),
    field('cover', 'Cover image', '', { type: 'file', hint: 'PNG, JPEG or WebP · up to 8 MB' }),
  ].join('');
}

function openCampaignEditor(editing = false) {
  openDialog({
    title: editing ? 'Edit campaign' : 'New campaign',
    eyebrow: editing ? 'Overview' : 'A new adventure',
    html: campaignForm(editing ? state.campaign : null),
    editor: { kind: 'campaign', editing },
  });
  if (editing && fields.querySelector('[name="id"]')) {
    fields.querySelector('[name="id"]').disabled = true;
  }
  refreshPaletteStudio();
}

function currentCampaignLocalizedValues() {
  const original = state.editor?.editing
    ? {
        name: state.campaign?.manifestEntry?.name ?? {},
        description: state.campaign?.manifestEntry?.description ?? {},
        status: state.campaign?.manifestEntry?.status ?? {},
        story: state.campaign?.campaign?.storySoFar ?? {},
      }
    : { name: {}, description: {}, status: {}, story: {} };
  const values = structuredClone(state.editor?.campaignDraftValues ?? original);
  for (const input of fields.querySelectorAll('[name^="loc__"]')) {
    const [, prefix, language] = input.name.split('__');
    values[prefix] ??= {};
    values[prefix][language] = input.value;
  }
  return values;
}

function canonicalLanguage(value) {
  try {
    return Intl.getCanonicalLocales(String(value || '').trim())[0] || '';
  } catch {
    return '';
  }
}

function languagePickerMessage(message, error = false) {
  const element = fields.querySelector('[data-language-message]');
  if (!element) return;
  element.textContent = translate(message);
  element.classList.toggle('is-error', error);
}

function refreshCampaignLanguages(languages, defaultLanguage) {
  const values = currentCampaignLocalizedValues();
  state.editor.campaignDraftValues = values;
  const picker = fields.querySelector('[data-language-picker]');
  const localizedBlock = fields.querySelector('[data-campaign-localized-fields]');
  picker.outerHTML = campaignLanguagePicker(languages, defaultLanguage);
  localizedBlock.outerHTML = campaignLocalizedBlock(
    values,
    languages,
    defaultLanguage,
    Boolean(state.editor?.editing),
  );
  window.managerI18n?.translateTree?.(fields);
}

function resolveCatalogLanguage(value) {
  const requested = String(value || '')
    .trim()
    .toLocaleLowerCase();
  const locale = window.managerI18n?.language === 'it' ? 'it' : 'en';
  const match = (state.project.languageCatalog ?? []).find(
    (item) =>
      item.code.toLocaleLowerCase() === requested ||
      item.names?.[locale]?.toLocaleLowerCase() === requested ||
      item.names?.en?.toLocaleLowerCase() === requested,
  );
  return match?.code ?? '';
}

function addCampaignLanguage(custom = false) {
  const picker = fields.querySelector('[data-language-picker]');
  const input = picker?.querySelector(custom ? '[data-language-custom]' : '[data-language-search]');
  const code = canonicalLanguage(custom ? input?.value : resolveCatalogLanguage(input?.value));
  if (!code) {
    languagePickerMessage(
      custom
        ? 'Enter a valid BCP-47 language tag, such as sr-Latn or en-GB.'
        : 'Choose a language from the list, or use the custom language path.',
      true,
    );
    input?.focus();
    return;
  }
  const languages = normalizeLanguageCodes(picker.querySelector('[name="languages"]').value);
  if (languages.includes(code)) {
    languagePickerMessage('That language is already selected.', true);
    input?.focus();
    return;
  }
  refreshCampaignLanguages(
    [...languages, code],
    picker.querySelector('[name="defaultLanguage"]').value,
  );
  languagePickerMessage('Language added. Its translation fields are ready below.');
}

function removeCampaignLanguage(code) {
  const picker = fields.querySelector('[data-language-picker]');
  const languages = normalizeLanguageCodes(picker.querySelector('[name="languages"]').value);
  if (languages.length === 1) {
    languagePickerMessage('A campaign needs at least one language.', true);
    return;
  }
  const values = currentCampaignLocalizedValues();
  const hasContent =
    Object.values(values).some((localized) => String(localized?.[code] || '').trim()) ||
    campaignContainsLocalizedContent(state.campaign, code);
  if (
    hasContent &&
    !confirm(
      translate(
        'This language already contains campaign text. It will be hidden from the campaign but preserved in the data. Continue?',
      ),
    )
  ) {
    return;
  }
  const next = languages.filter((language) => language !== code);
  const currentDefault = picker.querySelector('[name="defaultLanguage"]').value;
  refreshCampaignLanguages(next, currentDefault === code ? next[0] : currentDefault);
  languagePickerMessage(
    hasContent
      ? 'Language removed from the campaign list; its existing text is preserved.'
      : 'Language removed.',
  );
}

function campaignContainsLocalizedContent(value, language, visited = new Set()) {
  if (!value || typeof value !== 'object' || visited.has(value)) return false;
  visited.add(value);
  if (Object.prototype.hasOwnProperty.call(value, language)) {
    const localized = value[language];
    if (typeof localized === 'string' && localized.trim()) return true;
    if (Array.isArray(localized) && localized.length > 0) return true;
    if (localized && typeof localized === 'object' && Object.keys(localized).length > 0) {
      return true;
    }
  }
  return Object.values(value).some((entry) =>
    campaignContainsLocalizedContent(entry, language, visited),
  );
}

function entityForm(type, item = {}) {
  const languages = campaignLanguages();
  const common = state.advancedMode
    ? [
        `<details class="field field--wide advanced-identity" open><summary>Advanced identity</summary>${field('id', 'Entry ID', item.id ?? '', { hint: item.id ? 'Stable after creation. Renaming this entry will not change it.' : 'Optional. Leave blank to generate a unique stable ID automatically.' })}</details>`,
      ]
    : [];
  if (type === 'characters') {
    const identityFields = activeIdentityFields();
    const presentationFields = activePresentationFields();
    return [
      ...common,
      entityAiImportPanel(type, languages),
      field('name', 'Name', item.name, { required: true }),
      field('playerName', 'Player', item.playerName),
      ...presentationFields.flatMap((definition) =>
        localizedFields(
          definition.storageKey,
          definition.label,
          item[definition.storageKey],
          languages,
        ),
      ),
      field('heightCm', 'Height (cm)', item.heightCm ?? '', {
        type: 'number',
        min: 1,
        hint: 'Optional. Used on the profile and as an artwork proportion reference.',
      }),
      field('level', 'Level', item.sheet?.level ?? 1, { type: 'number', min: 1 }),
      ...identityFields.map((definition) => rulesetIdentityField(definition, item.sheet)),
      field('alignment', 'Alignment / outlook', item.sheet?.alignment),
      field('hitPoints', 'Current hit points', item.sheet?.hitPoints ?? 10, {
        type: 'number',
        min: 0,
      }),
      field('maxHitPoints', 'Maximum hit points', item.sheet?.maxHitPoints ?? 10, {
        type: 'number',
        min: 1,
      }),
      field('armorClass', 'Armor class', item.sheet?.armorClass ?? 10, {
        type: 'number',
        min: 0,
      }),
      field('speed', 'Speed', item.sheet?.speed ?? 30, { type: 'number', min: 0 }),
      field('proficiencyBonus', 'Proficiency bonus', item.sheet?.proficiencyBonus ?? 2, {
        type: 'number',
        min: 0,
      }),
      ...['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(
        (ability) =>
          field(
            `ability__${ability}`,
            ability.charAt(0).toUpperCase() + ability.slice(1),
            item.sheet?.abilityScores?.[ability] ?? 10,
            { type: 'number', min: 1 },
          ),
      ),
      field(
        'savingThrows',
        'Saving throw proficiencies',
        (item.sheet?.savingThrows ?? []).join('\n'),
        {
          type: 'textarea',
          hint: 'One per line.',
        },
      ),
      field('skills', 'Skill proficiencies', (item.sheet?.skills ?? []).join('\n'), {
        type: 'textarea',
        hint: 'One per line.',
      }),
      field('languages', 'Languages', (item.sheet?.languages ?? []).join('\n'), {
        type: 'textarea',
        hint: 'One per line.',
      }),
      field('equipment', 'Equipment', (item.sheet?.equipment ?? []).join('\n'), {
        type: 'textarea',
        hint: 'One item per line.',
      }),
      field('features', 'Features and traits', (item.sheet?.features ?? []).join('\n'), {
        type: 'textarea',
        hint: 'One per line.',
      }),
      field('password', 'Spoiler password', item.password ?? 'cambiami', {
        hint: 'Discourages casual spoilers; this is not encryption.',
      }),
      field('profileImage', 'Square profile image', '', {
        type: 'file',
        hint: 'Face or bust crop; square images work best.',
      }),
      field('portraitImage', 'Full portrait image', '', {
        type: 'file',
        hint: 'Optional full-body art; a 2:3 portrait works best.',
      }),
      section('Public profile'),
      ...localizedFields('backstory', 'Backstory', item.publicProfile?.backstory, languages, {
        type: 'textarea',
      }),
      ...localizedFields('traits', 'Personality traits', item.publicProfile?.traits, languages, {
        type: 'textarea',
      }),
      ...localizedFields('ideals', 'Ideals', item.publicProfile?.ideals, languages, {
        type: 'textarea',
      }),
      ...localizedFields('bonds', 'Bonds', item.publicProfile?.bonds, languages, {
        type: 'textarea',
      }),
      ...localizedFields('flaws', 'Flaws', item.publicProfile?.flaws, languages, {
        type: 'textarea',
      }),
      ...localizedFields('known', 'Known history', item.publicProfile?.knownHistory, languages, {
        type: 'textarea',
      }),
      ...localizedFields(
        'hobbies',
        'Interests and habits',
        item.publicProfile?.hobbies,
        languages,
        {
          type: 'textarea',
        },
      ),
      section('Story highlights'),
      storyHighlightsEditor(item, languages),
      section('Personal notebook'),
      notebookEditor(item, languages),
      section('Private notes'),
      ...localizedFields(
        'secret',
        'Secrets and notes',
        item.privateProfile?.secretBackstory,
        languages,
        { type: 'textarea', wide: true },
      ),
    ].join('');
  }
  if (type === 'npcs') {
    return [
      ...common,
      entityAiImportPanel(type, languages),
      field('name', 'Name', item.name, { required: true }),
      field('title', 'Title', item.title),
      field('category', 'Group / location', item.category),
      field('allegiance', 'Allegiance', item.allegiance ?? 'neutral', {
        type: 'select',
        values: [
          ['ally', 'Ally'],
          ['neutral', 'Neutral'],
          ['enemy', 'Enemy'],
        ],
      }),
      field('image', 'Profile image', '', { type: 'file', wide: true }),
      section('Profile'),
      ...localizedFields('description', 'Description', item.profile?.description, languages, {
        type: 'textarea',
      }),
      ...localizedFields('role', 'Role', item.profile?.role, languages),
      ...localizedFields('personality', 'Personality', item.profile?.personality, languages, {
        type: 'textarea',
      }),
      ...localizedFields('location', 'Location', item.profile?.location, languages),
      ...localizedFields('history', 'Known history', item.profile?.knownHistory, languages, {
        type: 'textarea',
        wide: true,
      }),
    ].join('');
  }
  if (type === 'sessions') {
    return [
      ...common,
      field(
        'sessionNumber',
        'Session number',
        item.sessionNumber ?? state.campaign.sessions.length + 1,
        { type: 'number', min: 1 },
      ),
      field('date', 'Date', item.date ?? new Date().toISOString().slice(0, 10), { type: 'date' }),
      section('Raw notes · private working material'),
      field('rawNotes', 'Paste or write the session notes', '', {
        type: 'textarea',
        wide: true,
        hint: 'These notes are sent only when you choose a processing button and are not saved in the public campaign file.',
      }),
      field(
        'aiLanguage',
        'Draft language',
        state.campaign.manifestEntry.defaultLanguage ?? languages[0],
        {
          type: 'select',
          values: languages.map((language) => [
            language,
            `${languageName(language)} (${language})`,
          ]),
          hint: 'The chosen translation is populated; the others remain available for review or later translation.',
        },
      ),
      `<div class="ai-compose field--wide"><div><strong>Turn notes into a reviewable draft</strong><small>Choose the engine for each job. Nothing is saved until you review and choose Save.</small></div><div class="ai-engine-grid">${engineSelect('proseEngine', 'Prose writer', 'prose', 'Turns raw notes into the editable chronicle.')}${engineSelect('imagePromptEngine', 'Visual prompt writer', 'imagePrompt', 'Plans what to illustrate and where it belongs.')}${engineSelect('imageEngine', 'Image renderer', 'image', 'Renders the approved visual prompts.')}</div><div class="action-row"><button class="secondary-button" type="button" data-ai-notes="text">Process notes</button><button class="primary-button" type="button" data-ai-notes="images">Process notes with images</button></div><label class="consent-check"><input name="remoteConsent" type="checkbox" /> I consent to sending these notes to any selected engine labelled <strong>Remote</strong>. Local-only tasks do not require this.</label><div class="ai-review" data-ai-review hidden></div></div>`,
      section('Review and edit the draft'),
      section('Narrative presentation'),
      moodField(
        'sessionMood',
        'Chapter mood',
        item.mood ?? 'default',
        'Inherits the campaign or published phase when left on Default.',
      ),
      moodField(
        'summaryMood',
        'Summary block mood',
        item.blockMoods?.summary ?? 'default',
        'Optional override for the session summary only.',
      ),
      moodField(
        'storyMood',
        'Story-so-far mood',
        item.blockMoods?.storySoFar ?? 'default',
        'Optional override for this recap entry only.',
      ),
      moodField(
        'proseMood',
        'Chronicle prose mood',
        item.blockMoods?.prose ?? 'default',
        'Optional override for the long-form chronicle only.',
      ),
      `<p class="field field--wide form-hint">AI may suggest a mood while drafting, but it never applies one silently. Only these reviewed controls change presentation.</p>`,
      ...localizedFields('title', 'Title', item.title, languages, { required: true }),
      ...localizedFields('location', 'Location', item.location, languages),
      ...localizedFields('summary', 'Summary', item.summary, languages, { type: 'textarea' }),
      ...localizedFields('prose', 'Chronicle', item.prose, languages, { type: 'textarea' }),
      ...localizedFields('story', 'Story so far', item.storySoFar, languages, {
        type: 'textarea',
      }),
      ...languages.map((language) =>
        field(
          `events__${language}`,
          `Key events · ${languageName(language)} (${language})`,
          (item.keyEvents ?? [])
            .map((event) => event.description?.[language])
            .filter(Boolean)
            .join('\n'),
          { type: 'textarea', hint: 'One event per line.' },
        ),
      ),
    ].join('');
  }
  return [
    ...common,
    ...localizedFields('name', 'Name', item.name, languages, { required: true }),
    ...localizedFields('region', 'Region', item.region, languages),
    field('status', 'Exploration', item.explorationStatus ?? 'unexplored', {
      type: 'select',
      values: [
        ['unexplored', 'Unexplored'],
        ['in-progress', 'In progress'],
        ['completed', 'Completed'],
      ],
    }),
    field('image', 'Image', '', { type: 'file' }),
    ...localizedFields('description', 'Description', item.description, languages, {
      type: 'textarea',
    }),
  ].join('');
}

function openEntityEditor(type, item) {
  const labels = { characters: 'Character', npcs: 'NPC', sessions: 'Session', maps: 'Location' };
  openDialog({
    title: `${item ? 'Edit' : 'New'} ${labels[type].toLowerCase()}`,
    eyebrow: labels[type],
    html: entityForm(type, item),
    editor: { kind: 'entity', type, previousId: item?.id, original: item, aiImages: [] },
  });
  const nameInput = fields.querySelector(
    '[name="name"], [name^="loc__title__"], [name^="loc__name__"]',
  );
  const idInput = fields.querySelector('[name="id"]');
  if (!item && nameInput && idInput) {
    nameInput.addEventListener('input', () => {
      if (!idInput.dataset.touched) idInput.value = slugify(nameInput.value);
    });
    idInput.addEventListener('input', () => (idInput.dataset.touched = 'true'));
  }
  if (item && idInput) idInput.readOnly = true;
}

function localizedFormValue(form, prefix, fallback = '', languages = campaignLanguages()) {
  return Object.fromEntries(
    languages.map((language) => [
      language,
      form.get(`loc__${prefix}__${language}`)?.toString().trim() || fallback,
    ]),
  );
}

async function uploadImageFile(file, category) {
  if (!file) return undefined;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return api(`/api/campaigns/${encodeURIComponent(state.selectedId)}/images`, {
    method: 'POST',
    body: JSON.stringify({ category, fileName: file.name, dataUrl }),
  });
}

async function uploadSelectedImage(inputName, category) {
  return uploadImageFile(fields.querySelector(`[name="${inputName}"]`)?.files?.[0], category);
}

function fileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function saveCampaign(form) {
  const creating = !state.editor.editing;
  const languages = normalizeLanguageCodes(form.get('languages'));
  const defaultLanguage = form.get('defaultLanguage')?.toString().trim() || languages[0];
  const localizedValues = currentCampaignLocalizedValues();
  const narrativeMood = narrativeMoodFromFields();
  const data = {
    id: creating ? form.get('id')?.toString().trim() || undefined : state.selectedId,
    languages,
    defaultLanguage,
    palette: form.get('palette')?.toString() || 'heroic',
    name: localizedValues.name,
    description: localizedValues.description,
    status: localizedValues.status,
    edition: form.get('edition')?.toString().trim() || '',
    startDate: form.get('startDate')?.toString(),
    dungeonMaster: form.get('dungeonMaster')?.toString(),
    partyName: form.get('partyName')?.toString(),
    gameSystem: {
      id: form.get('gameSystemId')?.toString() || 'generic',
      edition: form.get('edition')?.toString() || '',
      customLabels: Object.fromEntries(
        ['ancestry', 'class', 'specialization', 'background', 'sex', 'pronouns'].map((key) => [
          key,
          form.get(`rulesetLabel__${key}`)?.toString().trim() ?? '',
        ]),
      ),
    },
    campaign: { narrativeMood },
  };
  if (data.palette === 'custom') data.customPalette = paletteDraftFromFields();
  if (creating) {
    const created = await api('/api/campaigns', { method: 'POST', body: JSON.stringify(data) });
    state.selectedId = created.manifestEntry.id;
    state.campaign = created;
    const image = await uploadSelectedImage('cover', 'group');
    if (image) {
      data.thumbnail = `campaigns/${state.selectedId}/${image.path}`;
      data.campaign = {
        ...created.campaign,
        languages,
        defaultLanguage,
        narrativeMood,
        heroImages: [image.path],
      };
      state.campaign = await api(`/api/campaigns/${encodeURIComponent(state.selectedId)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  } else {
    const image = await uploadSelectedImage('cover', 'group');
    data.thumbnail = image
      ? `campaigns/${state.selectedId}/${image.path}`
      : state.campaign.manifestEntry.thumbnail;
    data.campaign = {
      ...state.campaign.campaign,
      edition: data.edition,
      startDate: data.startDate,
      dungeonMaster: data.dungeonMaster,
      partyName: data.partyName,
      languages,
      defaultLanguage,
      storySoFar: localizedValues.story,
      narrativeMood,
      translationState: state.editor.translationApplied
        ? {
            ...(state.campaign.campaign.translationState ?? {}),
            [state.editor.translationApplied.language]: {
              status: 'reviewed',
              sourceLanguage: state.editor.translationApplied.sourceLanguage,
              sourceSnapshot: state.editor.translationApplied.sourceSnapshot,
              reviewedAt: new Date().toISOString(),
            },
          }
        : state.campaign.campaign.translationState,
      heroImages: image
        ? [
            image.path,
            ...(state.campaign.campaign.heroImages ?? []).filter((path) => path !== image.path),
          ]
        : state.campaign.campaign.heroImages,
    };
    state.campaign = await api(`/api/campaigns/${encodeURIComponent(state.selectedId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  return data.palette;
}

function baseCharacter(original = {}) {
  return JSON.parse(
    JSON.stringify(
      original.id
        ? original
        : {
            id: '',
            name: '',
            sex: { en: '', it: '' },
            heightCm: undefined,
            avatar: { url: '', alt: '' },
            gallery: [],
            profileImageUrl: '',
            portraitImageUrl: '',
            publicProfile: {
              backstory: { en: '', it: '' },
              traits: { en: '', it: '' },
              ideals: { en: '', it: '' },
              bonds: { en: '', it: '' },
              flaws: { en: '', it: '' },
              knownHistory: { en: '', it: '' },
              hobbies: { en: '', it: '' },
            },
            privateProfile: {
              secretBackstory: { en: '', it: '' },
              hiddenMotivations: { en: '', it: '' },
              secrets: [],
              dmNotes: { en: '', it: '' },
            },
            sheet: {
              level: 1,
              classType: '',
              race: '',
              background: '',
              alignment: '',
              experiencePoints: 0,
              hitPoints: 10,
              maxHitPoints: 10,
              armorClass: 10,
              speed: 30,
              proficiencyBonus: 2,
              abilityScores: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
              },
              savingThrows: [],
              skills: [],
              languages: [],
              equipment: [],
              features: [],
              currency: {},
            },
            diary: [],
            sessionKnowledge: [],
            quotes: [],
            password: 'cambiami',
          },
    ),
  );
}

function localizedNotebookValue(container, prefix, languages) {
  return Object.fromEntries(
    languages.map((language) => [
      language,
      container
        .querySelector(`[name="notebook__${prefix}__${CSS.escape(language)}"]`)
        ?.value.trim() || '',
    ]),
  );
}

async function buildNotebook(original = {}) {
  const editor = fields.querySelector('[data-notebook-editor]');
  if (!editor?.querySelector('[name="notebookEnabled"]')?.checked) return undefined;
  const languages = campaignLanguages();
  const notebook = {
    ...original,
    title: localizedNotebookValue(editor, 'title', languages),
    description: localizedNotebookValue(editor, 'description', languages),
    password: editor.querySelector('[name="notebookPassword"]')?.value.trim() || 'cambiami',
    styleDirectives: editor.querySelector('[name="notebookStyleDirectives"]')?.value.trim() || '',
  };
  for (const key of ['front', 'back']) {
    const uploaded = await uploadImageFile(
      editor.querySelector(`[name="notebook${key}Cover"]`)?.files?.[0],
      'characters',
    );
    const url =
      uploaded?.path || editor.querySelector(`[name="notebook${key}CoverPath"]`)?.value.trim();
    const property = `${key}Cover`;
    if (url) {
      notebook[property] = {
        url,
        alt: editor.querySelector(`[name="notebook${key}CoverAlt"]`)?.value.trim() || '',
      };
    } else delete notebook[property];
  }
  const pages = [];
  const ids = new Set();
  for (const [index, card] of [...editor.querySelectorAll('[data-notebook-page]')].entries()) {
    const id = card.querySelector('[name="notebookPageId"]')?.value.trim() || `page-${index + 1}`;
    if (ids.has(id)) throw new Error(`Notebook page ID “${id}” is used more than once.`);
    ids.add(id);
    const uploaded = await uploadImageFile(
      card.querySelector('[name="notebookPageImage"]')?.files?.[0],
      'characters',
    );
    const url = uploaded?.path || card.querySelector('[name="notebookPagePath"]')?.value.trim();
    if (!url) throw new Error(`Add an image to notebook spread ${index + 1}.`);
    pages.push({
      id,
      title: localizedNotebookValue(card, 'pageTitle', languages),
      era: localizedNotebookValue(card, 'pageEra', languages),
      reflection: localizedNotebookValue(card, 'pageReflection', languages),
      mood: card.querySelector('[name="notebookPageMood"]')?.value || 'memory',
      image: {
        url,
        alt: card.querySelector('[name="notebookPageAlt"]')?.value.trim() || '',
      },
    });
  }
  notebook.pages = pages;
  return notebook;
}

function storyLocalizedValue(card, prefix, languages) {
  return Object.fromEntries(
    languages.map((language) => [
      language,
      card.querySelector(`[name="story__${prefix}__${CSS.escape(language)}"]`)?.value.trim() || '',
    ]),
  );
}

function buildStoryHighlights() {
  const editor = fields.querySelector('[data-story-highlights-editor]');
  const languages = campaignLanguages();
  const result = { quickFacts: [], signatureItems: [], favouriteMoments: [] };
  const usedIds = new Set();
  for (const [index, card] of [
    ...(editor?.querySelectorAll('[data-story-card]') ?? []),
  ].entries()) {
    const kind = card.dataset.storyKind;
    const identityPrefix =
      kind === 'quickFacts' ? 'label' : kind === 'signatureItems' ? 'name' : 'title';
    const identity = storyLocalizedValue(card, identityPrefix, languages);
    const hasIdentity = Object.values(identity).some(Boolean);
    if (!hasIdentity) continue;
    const requestedId = card.querySelector('[name="storyId"]')?.value.trim();
    const baseId =
      requestedId || slugify(Object.values(identity).find(Boolean)) || `highlight-${index + 1}`;
    let id = baseId;
    for (let suffix = 2; usedIds.has(id); suffix += 1) id = `${baseId}-${suffix}`;
    usedIds.add(id);
    if (kind === 'quickFacts') {
      result.quickFacts.push({
        id,
        label: identity,
        value: storyLocalizedValue(card, 'value', languages),
      });
      continue;
    }
    const sourceKind = card.querySelector('[name="storySourceKind"]')?.value || 'none';
    const sourceId = card.querySelector('[name="storySourceId"]')?.value.trim();
    const sourceLabel = storyLocalizedValue(card, 'sourceLabel', languages);
    const source =
      sourceKind === 'none'
        ? undefined
        : {
            kind: sourceKind,
            ...(sourceId ? { id: sourceId } : {}),
            label: sourceLabel,
          };
    if (kind === 'signatureItems') {
      result.signatureItems.push({
        id,
        name: identity,
        description: storyLocalizedValue(card, 'description', languages),
        ...(source ? { source } : {}),
      });
      continue;
    }
    if (!source || !Object.values(source.label).some(Boolean)) {
      throw new Error('Every favourite moment needs a public source and link label.');
    }
    result.favouriteMoments.push({
      id,
      title: identity,
      summary: storyLocalizedValue(card, 'summary', languages),
      source,
    });
  }
  return result;
}

async function buildEntity(type, form, original = {}) {
  const id = form.get('id')?.toString() || original.id || '';
  const languages = campaignLanguages();
  if (type === 'characters') {
    const item = baseCharacter(original);
    const profileImage = await uploadSelectedImage('profileImage', 'characters');
    const portraitImage = await uploadSelectedImage('portraitImage', 'characters');
    item.id = id;
    item.name = form.get('name').toString();
    item.playerName = form.get('playerName').toString();
    for (const definition of activePresentationFields()) {
      const value = localizedFormValue(form, definition.storageKey, '', languages);
      if (definition.storageKey === 'pronouns' && !Object.values(value).some(Boolean)) {
        delete item.pronouns;
      } else {
        item[definition.storageKey] = value;
      }
    }
    const heightCm = Number(form.get('heightCm'));
    if (heightCm > 0) item.heightCm = heightCm;
    else delete item.heightCm;
    item.password = form.get('password').toString() || 'cambiami';
    if (profileImage) {
      item.avatar = { url: profileImage.path, alt: item.name };
      item.profileImageUrl = profileImage.path;
    }
    if (portraitImage) {
      item.portraitImageUrl = portraitImage.path;
    }
    if (!item.profileImageUrl && item.portraitImageUrl) {
      item.profileImageUrl = item.portraitImageUrl;
      item.avatar = { url: item.portraitImageUrl, alt: item.name };
    }
    if (!item.portraitImageUrl && item.profileImageUrl) {
      item.portraitImageUrl = item.profileImageUrl;
    }
    item.publicProfile = {
      ...item.publicProfile,
      backstory: localizedFormValue(form, 'backstory', '', languages),
      traits: localizedFormValue(form, 'traits', '', languages),
      ideals: localizedFormValue(form, 'ideals', '', languages),
      bonds: localizedFormValue(form, 'bonds', '', languages),
      flaws: localizedFormValue(form, 'flaws', '', languages),
      knownHistory: localizedFormValue(form, 'known', '', languages),
      hobbies: localizedFormValue(form, 'hobbies', '', languages),
    };
    const storyHighlights = buildStoryHighlights();
    for (const key of ['quickFacts', 'signatureItems', 'favouriteMoments']) {
      if (storyHighlights[key].length) item.publicProfile[key] = storyHighlights[key];
      else delete item.publicProfile[key];
    }
    item.privateProfile = {
      ...item.privateProfile,
      secretBackstory: localizedFormValue(form, 'secret', '', languages),
    };
    const notebook = await buildNotebook(item.notebook);
    if (notebook) item.notebook = notebook;
    else delete item.notebook;
    item.sheet = {
      ...item.sheet,
      level: Number(form.get('level')) || 1,
      ...Object.fromEntries(
        activeIdentityFields().map((definition) => [
          definition.storageKey,
          form.get(definition.storageKey)?.toString() ?? item.sheet[definition.storageKey] ?? '',
        ]),
      ),
      alignment: form.get('alignment').toString(),
      hitPoints: Number(form.get('hitPoints')) || 0,
      maxHitPoints: Number(form.get('maxHitPoints')) || 1,
      armorClass: Number(form.get('armorClass')) || 0,
      speed: Number(form.get('speed')) || 0,
      proficiencyBonus: Number(form.get('proficiencyBonus')) || 0,
      abilityScores: Object.fromEntries(
        ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(
          (ability) => [ability, Number(form.get(`ability__${ability}`)) || 10],
        ),
      ),
      ...Object.fromEntries(
        ['savingThrows', 'skills', 'languages', 'equipment', 'features'].map((key) => [
          key,
          form
            .get(key)
            .toString()
            .split('\n')
            .map((value) => value.trim())
            .filter(Boolean),
        ]),
      ),
    };
    return item;
  }
  if (type === 'npcs') {
    const item = JSON.parse(
      JSON.stringify(
        original.id
          ? original
          : {
              id: '',
              name: '',
              sex: { en: '', it: '' },
              avatar: { url: '', alt: '' },
              gallery: [],
              profile: {
                description: { en: '', it: '' },
                role: { en: '', it: '' },
                personality: { en: '', it: '' },
                location: { en: '', it: '' },
                knownHistory: { en: '', it: '' },
              },
              allegiance: 'neutral',
              isAlive: true,
            },
      ),
    );
    const image = await uploadSelectedImage('image', 'npcs');
    item.id = id;
    item.name = form.get('name').toString();
    item.title = form.get('title').toString();
    item.category = form.get('category').toString();
    item.allegiance = form.get('allegiance').toString();
    if (image) {
      item.avatar = { url: image.path, alt: item.name };
      item.profileImageUrl = image.path;
      item.portraitImageUrl = image.path;
    }
    item.profile = {
      ...item.profile,
      description: localizedFormValue(form, 'description', '', languages),
      role: localizedFormValue(form, 'role', '', languages),
      personality: localizedFormValue(form, 'personality', '', languages),
      location: localizedFormValue(form, 'location', '', languages),
      knownHistory: localizedFormValue(form, 'history', '', languages),
    };
    return item;
  }
  if (type === 'sessions') {
    const events = Object.fromEntries(
      languages.map((language) => [
        language,
        form
          .get(`events__${language}`)
          ?.toString()
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean) ?? [],
      ]),
    );
    const eventCount = Math.max(0, ...Object.values(events).map((entries) => entries.length));
    const placementLanguage = form.get('aiLanguage')?.toString() || languages[0];
    const sceneCount = Math.max(
      1,
      splitProseScenes(form.get(`loc__prose__${placementLanguage}`)?.toString()).length,
    );
    const sessionMood = form.get('sessionMood')?.toString() || 'default';
    const blockMoods = {
      summary: form.get('summaryMood')?.toString() || 'default',
      storySoFar: form.get('storyMood')?.toString() || 'default',
      prose: form.get('proseMood')?.toString() || 'default',
    };
    const hasBlockMood = Object.values(blockMoods).some((mood) => mood !== 'default');
    return {
      ...original,
      id,
      sessionNumber: Number(form.get('sessionNumber')) || 1,
      date: form.get('date').toString(),
      title: localizedFormValue(form, 'title', '', languages),
      summary: localizedFormValue(form, 'summary', '', languages),
      location: localizedFormValue(form, 'location', '', languages),
      prose: localizedFormValue(form, 'prose', '', languages),
      storySoFar: localizedFormValue(form, 'story', '', languages),
      mood: sessionMood === 'default' ? undefined : sessionMood,
      blockMoods: hasBlockMood ? blockMoods : undefined,
      keyEvents: Array.from({ length: eventCount }, (_, index) => ({
        description: Object.fromEntries(
          languages.map((language) => [language, events[language][index] ?? '']),
        ),
      })),
      images: [
        ...(original.images ?? []),
        ...(state.editor.aiImages ?? []).map((image) => ({
          url: image.path,
          alt: Object.fromEntries(languages.map((language) => [language, image.alt])),
          caption: Object.fromEntries(languages.map((language) => [language, image.caption])),
          afterSection: Math.min(sceneCount - 1, Math.max(0, Number(image.afterSection) || 0)),
        })),
      ],
    };
  }
  const image = await uploadSelectedImage('image', 'maps');
  return {
    ...original,
    id,
    name: localizedFormValue(form, 'name', '', languages),
    description: localizedFormValue(form, 'description', '', languages),
    region: localizedFormValue(form, 'region', '', languages),
    explorationStatus: form.get('status').toString(),
    images: image
      ? [
          {
            url: image.path,
            alt: localized(localizedFormValue(form, 'name', '', languages), languages[0]),
          },
        ]
      : (original.images ?? []),
    discoveries: original.discoveries ?? [],
  };
}

function optionList(items, selected) {
  return items
    .map(
      (item) =>
        `<option value="${escapeHtml(item.id)}" ${item.id === selected ? 'selected' : ''}>${escapeHtml(item.label)} · ${item.sizeGb} GB</option>`,
    )
    .join('');
}

function modelNameOptions(items, selected) {
  return [...new Set(items ?? [])]
    .map(
      (item) =>
        `<option value="${escapeHtml(item)}" ${item === selected ? 'selected' : ''}>${escapeHtml(item)}</option>`,
    )
    .join('');
}

function providerModelLines(models) {
  return (models ?? [])
    .map((model) => `${model.id} | ${(model.capabilities ?? []).join(',')}`)
    .join('\n');
}

function remoteProviderCard(provider, saved) {
  const prefix = `provider__${provider.id}__`;
  return `<section class="project-panel ai-provider-card"><span class="eyebrow">Remote provider · ${escapeHtml(provider.transport)}</span><h3>${escapeHtml(provider.label)}</h3><p>Register only models and capabilities verified for your account. Unknown capabilities remain unavailable to task selectors.</p><label class="field"><span>API base URL</span><input name="${prefix}baseUrl" type="url" value="${escapeHtml(saved.baseUrl)}" /></label><label class="field"><span>API key</span><input name="${prefix}apiKey" type="password" autocomplete="off" placeholder="${saved.keyConfigured ? 'Saved locally · leave blank to keep it' : 'Paste a provider key'}" /></label><label class="consent-check"><input name="${prefix}removeApiKey" type="checkbox" /> Remove the saved key</label><label class="field"><span>Model catalog and capabilities</span><textarea name="${prefix}models">${escapeHtml(providerModelLines(saved.models))}</textarea><small>One per line: <code>model-id | text,structured-output,vision,image-prompt,image-generation,web</code>.</small></label><div class="provider-help"><a href="${escapeHtml(provider.docsUrl)}" target="_blank" rel="noreferrer">API docs ↗</a><a href="${escapeHtml(provider.privacyUrl)}" target="_blank" rel="noreferrer">Privacy ↗</a><a href="${escapeHtml(provider.pricingUrl)}" target="_blank" rel="noreferrer">Pricing ↗</a></div><div class="action-row"><button class="secondary-button" type="button" data-ai-action="discover-provider" data-provider="${escapeHtml(provider.id)}">Discover models</button><button class="secondary-button" type="button" data-ai-action="test-provider" data-provider="${escapeHtml(provider.id)}">Test provider</button></div></section>`;
}

function renderAiFirstRunChoice() {
  document.querySelector('#page-title').textContent = 'Choose how you create';
  content.innerHTML = `
    <div class="ai-onboarding">
      <section class="ai-hero"><div class="ai-hero__sigil" aria-hidden="true">✧</div><div><span class="eyebrow">Optional tools, never a gate</span><h2>How should QuestKeeper help?</h2><p>Campaigns, characters and sessions always work by hand. Choose AI now, keep everything manual, or decide another day.</p></div></section>
      <div class="choice-grid ai-onboarding__choices">
        <section class="project-panel"><span class="eyebrow">Guided setup</span><h3>Configure now</h3><p>Choose local or remote providers and a model for each task. Nothing runs or leaves this computer without your action.</p><button class="primary-button" type="button" data-ai-onboarding="configure">Configure now</button></section>
        <section class="project-panel"><span class="eyebrow">No AI required</span><h3>Use manual mode</h3><p>Write and edit everything yourself. AI setup stays available here if you change your mind later.</p><button class="secondary-button" type="button" data-ai-onboarding="manual">Use manual mode</button></section>
        <section class="project-panel"><span class="eyebrow">Decide later</span><h3>Remind me later</h3><p>Continue with the Campaign Manager now. QuestKeeper remembers this choice and will not redirect you after saves.</p><button class="secondary-button" type="button" data-ai-onboarding="deferred">Remind me later</button></section>
      </div>
    </div>`;
}

function renderAiSetup() {
  document.querySelector('#page-title').textContent = 'AI setup';
  const ai = state.project.ai;
  if (!ai) {
    content.innerHTML = '<div class="empty">Loading the local AI profile…</div>';
    return;
  }
  const { config, hardware, recommendations, models } = ai;
  if (config.setupState === 'unseen' && !state.aiConfigureExpanded) {
    renderAiFirstRunChoice();
    return;
  }
  const selectedImageModel =
    models.image.find((model) => model.id === recommendations.imageModelId) ?? models.image[0];
  const textJob = state.project.jobs['ai-text-model'];
  const imageJob = state.project.jobs['ai-image-model'];
  const activeLog =
    [textJob, imageJob].find((job) => job?.status === 'running') || imageJob || textJob;
  const gpuText = hardware.gpus?.length
    ? hardware.gpus.map((gpu) => `${gpu.name}${gpu.vramGb ? ` · ${gpu.vramGb} GB` : ''}`).join(', ')
    : 'No dedicated GPU memory detected';
  content.innerHTML = `
    <form id="ai-setup-form" class="ai-setup">
      <section class="project-panel guided-setup"><span class="eyebrow">Guided setup · about five minutes</span><h2>Three choices, always editable</h2><ol><li>Choose manual, local or remote creation.</li><li>Register or discover the models available to each provider.</li><li>Save the defaults; every session can still choose different models.</li></ol><small>Nothing is downloaded, uploaded or billed until you explicitly start that action.</small></section>
      <section class="ai-hero"><div class="ai-hero__sigil" aria-hidden="true">✧</div><div><span class="eyebrow">${config.setupComplete ? 'Permanent provider & model library' : 'Interactive first-run guide'}</span><h2>Your table, your choice of intelligence</h2><p>Keep everything local, connect a remote API, or leave AI off. Return here whenever you want to add a key, discover a newly installed model or change the defaults.</p></div></section>
      <section class="hardware-strip"><div><span>Processor</span><strong>${escapeHtml(hardware.cpu)}</strong><small>${hardware.logicalCores} logical cores</small></div><div><span>Memory</span><strong>${hardware.ramGb} GB RAM</strong><small>${hardware.freeRamGb} GB currently free</small></div><div><span>Graphics</span><strong>${escapeHtml(gpuText)}</strong><small>${escapeHtml(recommendations.imageReason)}</small></div></section>
      <section class="project-panel"><span class="eyebrow">Independent task roles</span><h3>Choose the right engine for each job</h3><p>Only models whose saved capabilities match a role are offered. QuestKeeper never changes provider silently.</p><div class="ai-engine-grid">${engineSelect('roleProse', 'Prose & structured drafts', 'prose', 'Session prose and structured campaign drafts.')}${engineSelect('roleExtraction', 'Sheet extraction & vision', 'extraction', 'Character and NPC sheet images.')}${engineSelect('roleImagePrompt', 'Image-prompt planning', 'imagePrompt', 'Plans illustrations without rendering them.')}${engineSelect('roleImage', 'Image generation', 'image', 'Renders approved prompts.')}</div></section>
      <div class="choice-grid ai-provider-grid">
        <section class="project-panel"><span class="eyebrow">Local chronicler</span><h3>Ollama</h3><label class="field"><span>Default Ollama model</span><select name="ollamaModel">${modelNameOptions(config.text.ollamaModels, config.setupComplete ? config.text.ollamaModel : recommendations.textModelId)}</select><small>Suggested for this machine: ${escapeHtml(recommendations.textModelId)}.</small></label><label class="field"><span>Ollama model catalog</span><textarea name="ollamaModels">${escapeHtml(config.text.ollamaModels.join('\n'))}</textarea></label><label class="field"><span>Ollama address</span><input name="ollamaUrl" value="${escapeHtml(config.text.ollamaUrl)}" /></label><div class="provider-help"><a href="https://ollama.com/download" target="_blank" rel="noreferrer">Install Ollama first ↗</a></div><div class="action-row"><button class="secondary-button" type="button" data-ai-action="discover-text">Discover installed</button><button class="secondary-button" type="button" data-ai-action="download-text">Download default</button><button class="secondary-button" type="button" data-ai-action="test-text">Test provider</button></div></section>
        <section class="project-panel"><span class="eyebrow">Local illustrator</span><h3>ComfyUI</h3><div class="recommendation ${recommendations.localImageRecommended ? 'is-good' : 'is-caution'}"><strong>${recommendations.localImageRecommended ? 'Local generation looks viable' : 'Remote or manual art recommended'}</strong><span>${escapeHtml(recommendations.imageReason)}</span></div><label class="field"><span>ComfyUI address</span><input name="comfyUrl" value="${escapeHtml(config.image.comfyUrl)}" /></label><label class="field"><span>ComfyUI installation folder</span><input name="comfyRoot" value="${escapeHtml(config.image.comfyRoot)}" placeholder="C:\\ComfyUI" /></label><label class="field"><span>Default ComfyUI checkpoint</span><select name="comfyCheckpoint">${modelNameOptions(config.image.comfyCheckpoints, config.image.comfyCheckpoint)}</select></label><label class="field"><span>ComfyUI checkpoint catalog</span><textarea name="comfyCheckpoints">${escapeHtml(config.image.comfyCheckpoints.join('\n'))}</textarea></label><div class="action-row"><button class="secondary-button" type="button" data-ai-action="discover-image">Discover installed</button><button class="secondary-button" type="button" data-ai-action="test-image">Test provider</button></div><hr /><label class="field"><span>Recommended checkpoint download</span><select name="imageModel">${optionList(models.image, recommendations.imageModelId)}</select></label><label class="consent-check"><input name="licenseAccepted" type="checkbox" /> I reviewed and accept the <a href="${escapeHtml(selectedImageModel.licenseUrl)}" target="_blank" rel="noreferrer">${escapeHtml(selectedImageModel.license)}</a>.</label><button class="secondary-button" type="button" data-ai-action="download-image">Download recommended checkpoint</button></section>
      </div>
      <section><span class="eyebrow">Remote provider library</span><h2>Bring the accounts you already use</h2><p>Keys stay in the ignored local configuration and are never returned to this page. Capability tags determine which task selectors can offer each model.</p><div class="choice-grid ai-provider-grid">${(ai.registry ?? []).map((provider) => remoteProviderCard(provider, config.providers[provider.id])).join('')}</div></section>
      <section class="privacy-panel"><strong>No silent cloud fallback.</strong><p>Local endpoints are restricted to this computer. API keys stay in the ignored <code>.campaign-manager/</code> folder and are never returned to the browser. Before a remote task, the Manager asks for consent again.</p></section>
      <div class="setup-footer"><div class="action-row"><button class="primary-button" type="submit">${config.setupComplete ? 'Save provider & model library' : 'Save choices and continue'}</button><button class="secondary-button" type="button" data-ai-save="draft">Save draft</button><button class="secondary-button" type="button" data-ai-onboarding="reset">Reset setup choice</button></div><span>All generated content opens as an editable draft.</span></div>
      ${activeLog ? `<pre class="job-log">${escapeHtml(activeLog.logs)}</pre>` : ''}
    </form>`;
}

function aiSetupPayload(form, setupState = 'complete') {
  const lines = (name) =>
    String(form.get(name) || '')
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  const providerModels = (name) =>
    String(form.get(name) || '')
      .split(/\r?\n/)
      .map((line) => {
        const [id, capabilities = ''] = line.split('|', 2);
        return {
          id: id.trim(),
          capabilities: capabilities
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        };
      })
      .filter((model) => model.id);
  const roles = {
    prose: parseEngineValue(form.get('roleProse')) ?? { provider: 'off', model: '' },
    extraction: parseEngineValue(form.get('roleExtraction')) ?? { provider: 'off', model: '' },
    imagePrompt: parseEngineValue(form.get('roleImagePrompt')) ?? { provider: 'off', model: '' },
    image: parseEngineValue(form.get('roleImage')) ?? { provider: 'off', model: '' },
  };
  const providers = Object.fromEntries(
    (state.project.ai.registry ?? []).map((provider) => {
      const prefix = `provider__${provider.id}__`;
      return [
        provider.id,
        {
          baseUrl: form.get(`${prefix}baseUrl`),
          apiKey: form.get(`${prefix}apiKey`),
          removeApiKey: form.get(`${prefix}removeApiKey`) === 'on',
          models: providerModels(`${prefix}models`),
        },
      ];
    }),
  );
  return {
    setupState,
    setupComplete: setupState === 'complete',
    roles,
    providers,
    text: {
      provider: roles.prose.provider === 'ollama' ? 'ollama' : 'off',
      ollamaUrl: form.get('ollamaUrl'),
      ollamaModel: form.get('ollamaModel'),
      ollamaModels: lines('ollamaModels'),
    },
    image: {
      provider: roles.image.provider === 'comfyui' ? 'comfyui' : 'off',
      comfyUrl: form.get('comfyUrl'),
      comfyRoot: form.get('comfyRoot'),
      comfyCheckpoint: form.get('comfyCheckpoint'),
      comfyCheckpoints: lines('comfyCheckpoints'),
    },
  };
}

async function saveAiSetup(setupState = 'complete') {
  const formElement = document.querySelector('#ai-setup-form');
  const form = new FormData(formElement);
  await api('/api/ai/setup', {
    method: 'PUT',
    body: JSON.stringify(aiSetupPayload(form, setupState)),
  });
  if (setupState === 'complete') state.aiMode = false;
  await loadState();
  render();
  toast(setupState === 'complete' ? 'AI choices saved locally.' : 'AI setup draft saved locally.');
}

async function chooseAiSetupPath(setupState) {
  if (setupState === 'configure') {
    state.aiConfigureExpanded = true;
    renderAiSetup();
    return;
  }
  const nextState = setupState === 'reset' ? 'unseen' : setupState;
  await api('/api/ai/setup-state', {
    method: 'PUT',
    body: JSON.stringify({ setupState: nextState }),
  });
  state.aiConfigureExpanded = setupState !== 'reset';
  state.aiMode = setupState === 'reset';
  await loadState();
  toast(
    setupState === 'manual'
      ? 'Manual authoring selected. AI remains optional.'
      : setupState === 'deferred'
        ? 'AI setup postponed. QuestKeeper will not interrupt your work.'
        : 'AI setup choice reset.',
  );
}

async function runAiSetupAction(action, providerId = '') {
  const form = new FormData(document.querySelector('#ai-setup-form'));
  await api('/api/ai/setup', {
    method: 'PUT',
    body: JSON.stringify(
      aiSetupPayload(
        form,
        state.project.ai.config.setupState === 'complete' ? 'complete' : 'draft',
      ),
    ),
  });
  if (action === 'discover-provider') {
    const result = await api('/api/ai/models/discover', {
      method: 'POST',
      body: JSON.stringify({ provider: providerId }),
    });
    await loadState();
    state.aiMode = true;
    renderAiSetup();
    toast(
      result.discovered.length
        ? `Discovered ${result.discovered.length} remote model${result.discovered.length === 1 ? '' : 's'}. Assign capabilities before using new IDs.`
        : 'No additional remote models found.',
    );
    return;
  }
  if (action === 'discover-text' || action === 'discover-image') {
    const kind = action === 'discover-text' ? 'text' : 'image';
    const result = await api('/api/ai/models/discover', {
      method: 'POST',
      body: JSON.stringify({ kind }),
    });
    await loadState();
    state.aiMode = true;
    renderAiSetup();
    toast(
      result.discovered.length
        ? `Added ${result.discovered.length} installed ${kind} model${result.discovered.length === 1 ? '' : 's'}.`
        : `No additional ${kind} models found.`,
    );
    return;
  }
  if (action === 'download-text') {
    await api('/api/ai/models/text', {
      method: 'POST',
      body: JSON.stringify({ modelId: form.get('ollamaModel') }),
    });
    toast('Text model download started.');
    void refreshJobs();
    return;
  }
  if (action === 'download-image') {
    await api('/api/ai/models/image', {
      method: 'POST',
      body: JSON.stringify({
        modelId: form.get('imageModel'),
        comfyRoot: form.get('comfyRoot'),
        licenseAccepted: form.get('licenseAccepted') === 'on',
      }),
    });
    toast('Image checkpoint download started.');
    void refreshJobs();
    return;
  }
  const kind = action === 'test-image' ? 'image' : 'text';
  const result = await api('/api/ai/test', {
    method: 'POST',
    body: JSON.stringify({ kind, provider: action === 'test-provider' ? providerId : undefined }),
  });
  toast(result.message);
  await loadState();
}

function setLocalizedDraftField(prefix, language, value) {
  const target = fields.querySelector(`[name="loc__${prefix}__${language}"]`);
  if (target) target.value = value ?? '';
}

function splitProseScenes(value) {
  return String(value || '')
    .split(/<hr\s*\/?>/i)
    .map((scene) => scene.trim())
    .filter(Boolean);
}

function imagePlacementOptions(language, selected) {
  const prose = fields.querySelector(`[name="loc__prose__${CSS.escape(language)}"]`)?.value ?? '';
  const scenes = splitProseScenes(prose);
  return (scenes.length ? scenes : ['Current chronicle'])
    .map((scene, index) => {
      const excerpt = scene
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 72);
      return `<option value="${index}" ${index === Number(selected) ? 'selected' : ''}>After scene ${index + 1} · ${escapeHtml(excerpt || 'Untitled scene')}</option>`;
    })
    .join('');
}

function renderAiReview(draft, language) {
  const review = fields.querySelector('[data-ai-review]');
  if (!review) return;
  review.hidden = false;
  const images = state.editor.aiImages ?? [];
  review.innerHTML = `<strong>Draft ready for the Game Master</strong><p>${escapeHtml(draft.summary)}</p>${images.length ? `<div class="ai-image-review"><div class="ai-image-review__intro"><strong>Place the illustrations in the chronicle</strong><small>Each image is attached immediately after the scene you select. Captions and accessibility text remain editable.</small></div>${images.map((image, index) => `<article class="ai-image-card"><img src="${escapeHtml(campaignAsset(image.path))}" alt="" /><div><label class="field"><span>Insert position</span><select data-ai-image-field="afterSection" data-ai-image-index="${index}">${imagePlacementOptions(language, image.afterSection)}</select></label><label class="field"><span>Caption</span><input value="${escapeHtml(image.caption)}" data-ai-image-field="caption" data-ai-image-index="${index}" /></label><label class="field"><span>Accessibility text</span><textarea data-ai-image-field="alt" data-ai-image-index="${index}">${escapeHtml(image.alt)}</textarea></label></div></article>`).join('')}</div>` : ''}${draft.suggestions.length ? `<details><summary>${draft.suggestions.length} optional archive suggestion${draft.suggestions.length === 1 ? '' : 's'}</summary><ul>${draft.suggestions.map((item) => `<li><strong>${escapeHtml(item.kind)} · ${escapeHtml(item.subject)}</strong><br />${escapeHtml(item.proposal)}<small>Evidence: ${escapeHtml(item.evidence)}</small></li>`).join('')}</ul></details>` : ''}<small>Review the fields below. Suggestions are never applied automatically.</small>`;
}

function setFormValue(name, value) {
  const target = fields.querySelector(`[name="${CSS.escape(name)}"]`);
  if (target && value !== undefined && value !== null) target.value = value;
}

async function processEntityImport(type) {
  if (!['characters', 'npcs'].includes(type)) return;
  const form = new FormData(editorForm);
  const language = form.get('entityLanguage') || campaignLanguages()[0];
  const files = [...(fields.querySelector('[name="aiSourceImages"]')?.files ?? [])].slice(0, 4);
  const oversized = files.find((file) => file.size > 3 * 1024 * 1024);
  if (oversized) throw new Error(`${oversized.name} is larger than 3 MB. Resize it and try again.`);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > 10 * 1024 * 1024)
    throw new Error('The selected images exceed 10 MB in total. Resize them and try again.');
  const button = fields.querySelector(`[data-ai-entity="${type}"]`);
  button.disabled = true;
  button.textContent = 'Reading sources…';
  try {
    const result = await api(
      `/api/campaigns/${encodeURIComponent(state.selectedId)}/ai/import-entity`,
      {
        method: 'POST',
        body: JSON.stringify({
          entityType: type,
          language,
          engine: parseEngineValue(form.get('entityEngine')),
          images: await Promise.all(files.map(fileDataUrl)),
          sourceUrl: form.get('aiSourceUrl'),
          remoteConsent: form.get('entityRemoteConsent') === 'on',
        }),
      },
    );
    const draft = result.draft;
    for (const [name, value] of Object.entries({
      name: draft.name,
      title: draft.title,
      heightCm: draft.heightCm || '',
      level: draft.level || 1,
      classType: draft.classType,
      race: draft.race,
      background: draft.background,
      alignment: draft.alignment,
      hitPoints: draft.hitPoints,
      maxHitPoints: draft.maxHitPoints,
      armorClass: draft.armorClass,
      speed: draft.speed,
      proficiencyBonus: draft.proficiencyBonus,
      category: draft.category,
      allegiance: draft.allegiance,
    }))
      setFormValue(name, value);
    const id = fields.querySelector('[name="id"]');
    if (id && !id.value) id.value = slugify(draft.name);
    const localizedValues =
      type === 'characters'
        ? {
            sex: draft.gender,
            pronouns: draft.pronouns,
            backstory: draft.backstory,
            traits: draft.traits,
            ideals: draft.ideals,
            bonds: draft.bonds,
            flaws: draft.flaws,
            known: draft.knownHistory,
            hobbies: draft.hobbies,
            secret: draft.secretBackstory,
          }
        : {
            description: draft.description,
            role: draft.role,
            personality: draft.personality,
            location: draft.location,
            history: draft.knownHistory,
          };
    for (const [prefix, value] of Object.entries(localizedValues))
      setFormValue(`loc__${prefix}__${language}`, value);
    if (type === 'characters') {
      const localizedDraft = (value) => ({ [language]: value || '' });
      const storyEditor = fields.querySelector('[data-story-highlights-editor]');
      if (storyEditor) {
        storyEditor.outerHTML = storyHighlightsEditor(
          {
            publicProfile: {
              quickFacts: (draft.quickFacts ?? []).map((entry) => ({
                id: '',
                label: localizedDraft(entry.label),
                value: localizedDraft(entry.value),
              })),
              signatureItems: (draft.signatureItems ?? []).map((entry) => ({
                id: '',
                name: localizedDraft(entry.name),
                description: localizedDraft(entry.description),
                ...(entry.sourceKind && entry.sourceKind !== 'none'
                  ? {
                      source: {
                        kind: entry.sourceKind,
                        ...(entry.sourceId ? { id: entry.sourceId } : {}),
                        label: localizedDraft(entry.sourceLabel),
                      },
                    }
                  : {}),
              })),
              favouriteMoments: (draft.favouriteMoments ?? []).map((entry) => ({
                id: '',
                title: localizedDraft(entry.title),
                summary: localizedDraft(entry.summary),
                source: {
                  kind: entry.sourceKind || 'diary',
                  ...(entry.sourceId ? { id: entry.sourceId } : {}),
                  label: localizedDraft(entry.sourceLabel),
                },
              })),
            },
          },
          campaignLanguages(),
        );
        window.managerI18n?.translateTree?.(fields.querySelector('[data-story-highlights-editor]'));
      }
      for (const [ability, value] of Object.entries(draft.abilityScores ?? {}))
        setFormValue(`ability__${ability}`, value || 10);
      for (const key of ['savingThrows', 'skills', 'languages', 'equipment', 'features'])
        setFormValue(key, (draft[key] ?? []).join('\n'));
    }
    const review = fields.querySelector('[data-ai-entity-review]');
    review.hidden = false;
    review.innerHTML = `<strong>Editable import ready</strong><p>QuestKeeper filled the form from ${files.length ? `${files.length} image${files.length === 1 ? '' : 's'}` : 'the shared page'}. Check every value before saving.</p>${draft.reviewNotes?.length ? `<ul>${draft.reviewNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>` : '<small>No extraction warnings were returned; manual review is still required.</small>'}`;
    toast('Character draft extracted. Review the form before saving.');
  } finally {
    button.disabled = false;
    button.textContent = 'Extract editable draft';
  }
}

async function processNotebookDraft() {
  if (state.editor?.type !== 'characters') return;
  const form = new FormData(editorForm);
  const button = fields.querySelector('[data-ai-notebook]');
  const pageCount = Math.min(4, Math.max(1, Number(form.get('notebookPageCount')) || 2));
  const language = form.get('notebookLanguage') || campaignLanguages()[0];
  const brief = String(form.get('notebookBrief') || '').trim();
  const styleDirectives = String(form.get('notebookStyleDirectives') || '').trim();
  if (brief.length < 10) throw new Error('Describe what this notebook should remember first.');
  if (styleDirectives.length < 10)
    throw new Error('Add character-specific art direction before generating the notebook.');
  button.disabled = true;
  button.textContent = 'Planning and illustrating…';
  try {
    const result = await api(
      `/api/campaigns/${encodeURIComponent(state.selectedId)}/ai/generate-notebook`,
      {
        method: 'POST',
        body: JSON.stringify({
          language,
          pageCount,
          brief,
          styleDirectives,
          password: form.get('notebookPassword') || 'cambiami',
          character: {
            id: state.editor.original?.id || form.get('id') || slugify(form.get('name')),
            name: form.get('name'),
            sex: localizedFormValue(form, 'sex', '', campaignLanguages()),
            pronouns: localizedFormValue(form, 'pronouns', '', campaignLanguages()),
            heightCm: Number(form.get('heightCm')) || undefined,
            publicProfile: {
              backstory: localizedFormValue(form, 'backstory', '', campaignLanguages()),
              traits: localizedFormValue(form, 'traits', '', campaignLanguages()),
              ideals: localizedFormValue(form, 'ideals', '', campaignLanguages()),
              bonds: localizedFormValue(form, 'bonds', '', campaignLanguages()),
              flaws: localizedFormValue(form, 'flaws', '', campaignLanguages()),
              knownHistory: localizedFormValue(form, 'known', '', campaignLanguages()),
              hobbies: localizedFormValue(form, 'hobbies', '', campaignLanguages()),
            },
          },
          engines: {
            imagePrompt: parseEngineValue(form.get('notebookImagePromptEngine')),
            image: parseEngineValue(form.get('notebookImageEngine')),
          },
          remoteConsent: form.get('notebookRemoteConsent') === 'on',
        }),
      },
    );
    const currentEditor = fields.querySelector('[data-notebook-editor]');
    currentEditor.outerHTML = notebookEditor({ notebook: result.notebook }, campaignLanguages());
    const review = fields.querySelector('[data-notebook-review]');
    if (review) {
      review.hidden = false;
      review.innerHTML = `<strong>Draft ready for review</strong><p>${escapeHtml(result.notice)}</p>`;
    }
    window.managerI18n?.translateTree?.(fields);
    toast('Notebook draft created. Review every page before saving.');
  } finally {
    const currentButton = fields.querySelector('[data-ai-notebook]');
    if (currentButton) {
      currentButton.disabled = false;
      currentButton.textContent = 'Generate notebook draft with images';
    }
  }
}

async function processSessionNotes(includeImages) {
  if (state.editor?.type !== 'sessions') return;
  const form = new FormData(editorForm);
  const language = form.get('aiLanguage') ?? state.campaign.manifestEntry.defaultLanguage ?? 'en';
  const button = fields.querySelector(`[data-ai-notes="${includeImages ? 'images' : 'text'}"]`);
  button.disabled = true;
  button.textContent = includeImages ? 'Writing and illustrating…' : 'Writing draft…';
  try {
    const result = await api(
      `/api/campaigns/${encodeURIComponent(state.selectedId)}/ai/process-notes`,
      {
        method: 'POST',
        body: JSON.stringify({
          notes: form.get('rawNotes'),
          language,
          sessionNumber: form.get('sessionNumber'),
          includeImages,
          remoteConsent: form.get('remoteConsent') === 'on',
          engines: {
            prose: parseEngineValue(form.get('proseEngine')),
            imagePrompt: parseEngineValue(form.get('imagePromptEngine')),
            image: parseEngineValue(form.get('imageEngine')),
          },
        }),
      },
    );
    const draft = result.draft;
    for (const key of ['title', 'location', 'summary', 'prose', 'storySoFar']) {
      setLocalizedDraftField(key === 'storySoFar' ? 'story' : key, language, draft[key]);
    }
    const events = fields.querySelector(`[name="events__${language}"]`);
    if (events) events.value = draft.keyEvents.join('\n');
    state.editor.aiImages = draft.generatedImages ?? [];
    state.editor.aiDraft = draft;
    state.editor.aiLanguage = language;
    renderAiReview(draft, language);
    toast('Editable draft created. Review it before saving.');
  } finally {
    button.disabled = false;
    button.textContent = includeImages ? 'Process notes with images' : 'Process notes';
  }
}

async function processCampaignTranslation() {
  if (state.editor?.kind !== 'campaign' || !state.editor.editing) return;
  const form = new FormData(editorForm);
  const sourceLanguage = form.get('translationSource')?.toString();
  const targetLanguage = form.get('translationTarget')?.toString();
  if (sourceLanguage === targetLanguage) {
    languagePickerMessage('Choose two different campaign languages for translation.', true);
    return;
  }
  const button = fields.querySelector('[data-translate-campaign]');
  button.disabled = true;
  button.textContent = 'Translating…';
  try {
    const result = await api(
      `/api/campaigns/${encodeURIComponent(state.selectedId)}/ai/translate`,
      {
        method: 'POST',
        body: JSON.stringify({
          sourceLanguage,
          targetLanguage,
          content: currentCampaignValuesForLanguage(sourceLanguage),
          engine: parseEngineValue(form.get('translationEngine')),
          remoteConsent: form.get('translationRemoteConsent') === 'on',
        }),
      },
    );
    state.editor.translationDraft = {
      ...result.draft,
      sourceLanguage,
      targetLanguage,
      sourceSnapshot: JSON.stringify(currentCampaignValuesForLanguage(sourceLanguage)),
    };
    const review = fields.querySelector('[data-translation-review]');
    review.hidden = false;
    review.innerHTML = `<strong>Editable translation draft</strong><p>Review every field. Applying fills the form; nothing is written until you press Save.</p>${['name', 'description', 'status', 'story'].map((key) => `<label class="field"><span>${escapeHtml(key)}</span><textarea data-translation-draft-field="${key}">${escapeHtml(result.draft[key])}</textarea></label>`).join('')}<button type="button" class="secondary-button" data-apply-translation>Apply reviewed draft</button>`;
  } finally {
    button.disabled = false;
    button.textContent = 'Create translation draft';
  }
}

function applyCampaignTranslation() {
  const draft = state.editor?.translationDraft;
  if (!draft) return;
  const existing = currentCampaignValuesForLanguage(draft.targetLanguage);
  if (
    Object.values(existing).some((value) => String(value || '').trim()) &&
    !confirm(
      'The target language already contains text. Replace those four fields with this draft?',
    )
  ) {
    return;
  }
  for (const key of ['name', 'description', 'status', 'story']) {
    const reviewed = fields.querySelector(`[data-translation-draft-field="${key}"]`)?.value ?? '';
    const input = fields.querySelector(`[name="loc__${key}__${draft.targetLanguage}"]`);
    if (input) input.value = reviewed;
  }
  state.editor.translationApplied = {
    language: draft.targetLanguage,
    sourceLanguage: draft.sourceLanguage,
    sourceSnapshot: draft.sourceSnapshot,
  };
  toast('Translation applied to the editable form. Press Save when ready.');
}

async function saveEditor() {
  const form = new FormData(editorForm);
  let message = 'Saved. Your Companion is up to date.';
  if (state.editor.kind === 'campaign') {
    const palette = await saveCampaign(form);
    message = `Saved. The ${palette} palette will appear when the Companion reloads or regains focus.`;
  } else if (state.editor.kind === 'compendium') {
    await saveCompendium(form);
    message = 'Local compendium saved in protected user data.';
  } else {
    const entity = await buildEntity(state.editor.type, form, state.editor.original);
    const base = `/api/campaigns/${encodeURIComponent(state.selectedId)}/${state.editor.type}`;
    const path = state.editor.previousId
      ? `${base}/${encodeURIComponent(state.editor.previousId)}`
      : base;
    await api(path, {
      method: state.editor.previousId ? 'PUT' : 'POST',
      body: JSON.stringify(entity),
    });
    state.campaign = await api(`/api/campaigns/${encodeURIComponent(state.selectedId)}`);
  }
  await loadState();
  dialog.close();
  toast(message);
}

function renderProject() {
  document.querySelector('#page-title').textContent = 'Setup and publishing';
  const install = state.project.jobs.install;
  const build = state.project.jobs.build;
  const preview = state.project.jobs.preview;
  const companion = state.project.companion ?? {
    action: 'prepare',
    label: 'Start Companion',
    status: 'Preparation required',
    url: 'http://127.0.0.1:4200',
  };
  const ftpJob = state.project.jobs['ftp-publish'];
  const publishing = state.project.publishing ?? {};
  const storage = state.project.storage ?? {};
  const storageLocations = [
    ['application', 'Application', 'Replaceable app files'],
    ['runtime', 'Node runtime', 'Replaceable private runtime'],
    ['campaigns', 'Campaigns & media', 'Protected user data'],
    ['configuration', 'Configuration', 'Protected settings & secrets'],
    ['transcripts', 'Transcripts', 'Protected session notes'],
    ['backups', 'Backups', 'Protected recovery copies'],
    ['logs', 'Logs', 'Diagnostic state'],
    ['cache', 'Cache', 'Replaceable generated files'],
  ];
  const activeLog =
    [ftpJob, preview, build, install].find((job) => job?.status === 'running') ||
    ftpJob ||
    preview ||
    build ||
    install;
  content.innerHTML = `
    <div class="project-stack">
      <section class="project-panel"><span class="eyebrow">1 · Preparation</span><h2>Prepare the project</h2><p>${state.project.dependenciesReady ? 'Dependencies are installed. You can preview or validate your Companion.' : 'On first use, install everything the project needs. An internet connection is required.'}</p><div class="action-row"><button class="primary-button" data-project-action="install" ${install?.status === 'running' ? 'disabled' : ''}>${state.project.dependenciesReady ? 'Reinstall dependencies' : 'Prepare automatically'}</button><span class="job-status ${install?.status || ''}">${install ? escapeHtml(install.status) : state.project.dependenciesReady ? 'Ready' : 'Not prepared'}</span></div></section>
      <section class="project-panel"><span class="eyebrow">2 · Preview</span><h2>Open your Companion</h2><p>Launch the local site with the campaign data you just entered.</p><div class="action-row">${companion.action === 'open' ? `<button class="primary-button" data-action="open-local-companion">Open now</button>${companion.canStop ? '<button class="secondary-button" data-action="stop-companion">Stop</button>' : ''}` : `<button class="primary-button" data-project-action="preview" ${['prepare', 'wait'].includes(companion.action) ? 'disabled' : ''}>${escapeHtml(companion.label)}</button>`}<span class="job-status ${escapeHtml(companion.action)}">${escapeHtml(companion.status)}</span></div></section>
      <section class="project-panel"><span class="eyebrow">3 · Validation</span><h2>Check before publishing</h2><p>The production build catches invalid data or components before you push to GitHub.</p><div class="action-row"><button class="secondary-button" data-project-action="build" ${!state.project.dependenciesReady || build?.status === 'running' ? 'disabled' : ''}>Check and build site</button><span class="job-status ${build?.status || ''}">${build ? escapeHtml(build.status) : 'Not run'}</span></div></section>
      <section class="project-panel"><span class="eyebrow">4 · Publishing</span><h2>Choose how the archive reaches the realm</h2><p>GitHub Pages remains available through the included workflow. If your hosting provides FTP, configure it once and publish directly from this computer without GitHub Actions.</p><a class="secondary-button" href="https://github.com/mtamagno/questkeeper-rpg-campaign-manager#publish" target="_blank" rel="noreferrer">Open the publishing guide</a></section>
      <section class="project-panel"><span class="eyebrow">Authoring preferences</span><h2>Advanced controls</h2><p>Keep technical identifiers hidden during normal authoring, or reveal them when you need to integrate or troubleshoot campaign data.</p><label class="consent-check"><input type="checkbox" data-advanced-mode ${state.advancedMode ? 'checked' : ''} /> Show advanced identity controls in entity forms</label></section>
      <section class="project-panel storage-panel">
        <div class="storage-panel__heading"><div><span class="eyebrow">Your data · ${escapeHtml(storage.mode ?? 'legacy')}</span><h2>Storage & recovery</h2><p>Protected table memories stay separate from replaceable app and runtime files.</p></div><div class="action-row"><button class="primary-button" type="button" data-storage-action="backup">Back up now</button><button class="secondary-button" type="button" data-storage-action="export">Export all campaigns</button></div></div>
        <div class="storage-runtime"><strong>Active Node.js</strong><code>${escapeHtml(storage.node?.version ?? '')} · ${escapeHtml(storage.node?.source ?? '')} · ${escapeHtml(storage.node?.executable ?? '')}</code></div>
        <dl class="storage-list">${storageLocations.map(([key, label, meaning]) => `<div><dt><strong>${label}</strong><span>${meaning}</span></dt><dd><code title="${escapeHtml(storage[key] ?? '')}">${escapeHtml(storage[key] ?? 'Not available')}</code><span class="storage-row__actions"><button class="secondary-button storage-button" type="button" data-storage-action="copy" data-storage-key="${key}">Copy path</button><button class="secondary-button storage-button" type="button" data-storage-action="open" data-storage-key="${key}">Open folder</button></span></dd></div>`).join('')}</dl>
        <small>Paths never contain or reveal saved API keys, Discord tokens or publishing passwords.</small>
      </section>
      <form id="publishing-form" class="project-panel publishing-panel"><span class="eyebrow">Direct hosting · FTP / FTPS</span><h2>Publish from Campaign Manager</h2><div class="publishing-grid"><label class="field"><span>Protocol</span><select name="protocol"><option value="ftps" ${publishing.protocol !== 'ftp' ? 'selected' : ''}>FTPS · encrypted (recommended)</option><option value="ftp" ${publishing.protocol === 'ftp' ? 'selected' : ''}>FTP · unencrypted</option></select></label><label class="field"><span>Host</span><input name="host" value="${escapeHtml(publishing.host)}" placeholder="ftp.example.com" /></label><label class="field"><span>Port</span><input name="port" type="number" min="1" value="${publishing.port || 21}" /></label><label class="field"><span>Remote folder</span><input name="remotePath" value="${escapeHtml(publishing.remotePath || '/')}" placeholder="/public_html/questkeeper" /></label><label class="field"><span>Username</span><input name="username" autocomplete="username" value="${escapeHtml(publishing.username)}" /></label><label class="field"><span>Password</span><input name="password" type="password" autocomplete="new-password" placeholder="${publishing.passwordConfigured ? 'Saved locally · leave blank to keep it' : 'Hosting password'}" /></label></div><label class="consent-check"><input name="insecureConsent" type="checkbox" /> I understand that plain FTP sends credentials and files without encryption. This is required only when FTP is selected instead of FTPS.</label><div class="action-row"><button class="secondary-button" type="button" data-publish-action="save">Save destination</button><button class="secondary-button" type="button" data-publish-action="test">Test connection</button><button class="primary-button" type="button" data-publish-action="publish" ${!state.project.dependenciesReady || ftpJob?.status === 'running' ? 'disabled' : ''}>Build & publish now</button><span class="job-status ${ftpJob?.status || ''}">${ftpJob ? escapeHtml(ftpJob.status) : publishing.host ? 'Configured' : 'Not configured'}</span></div><small>Credentials stay in the Git-ignored <code>.campaign-manager/</code> folder and are never returned to the browser.</small></form>
      ${activeLog ? `<pre class="job-log">${escapeHtml(activeLog.logs)}</pre>` : ''}
    </div>`;
  const credentialNote = content.querySelector('.publishing-panel > small');
  if (credentialNote)
    credentialNote.textContent =
      'Credentials stay in the protected local configuration folder and are never returned to the browser.';
}

function publishingPayload(form) {
  return {
    protocol: form.get('protocol'),
    host: form.get('host'),
    port: Number(form.get('port')),
    remotePath: form.get('remotePath'),
    username: form.get('username'),
    password: form.get('password'),
  };
}

async function runPublishingAction(action) {
  const formElement = document.querySelector('#publishing-form');
  const form = new FormData(formElement);
  await api('/api/publishing/setup', {
    method: 'PUT',
    body: JSON.stringify(publishingPayload(form)),
  });
  if (action === 'save') {
    await loadState();
    state.projectMode = true;
    renderProject();
    toast('Publishing destination saved locally.');
    return;
  }
  const body = JSON.stringify({ insecureConsent: form.get('insecureConsent') === 'on' });
  if (action === 'test') {
    const result = await api('/api/publishing/test', { method: 'POST', body });
    toast(result.message);
    return;
  }
  await api('/api/publishing/publish', { method: 'POST', body });
  toast('Production build and upload started.');
  void refreshJobs();
}

function renderScribe() {
  document.querySelector('#page-title').textContent = 'Discord Session Scribe';
  const transcriber = state.project.transcriber ?? {};
  const job = state.project.jobs.transcriber;
  const isRunning = job?.status === 'running' || job?.status === 'stopping';
  const status = isRunning
    ? job.status === 'stopping'
      ? 'Stopping'
      : 'Listening for Discord commands'
    : job?.status === 'failed'
      ? 'Needs attention'
      : transcriber.configured
        ? 'Ready to launch'
        : 'Configuration needed';
  content.innerHTML = `
    <div class="scribe-stack">
      <section class="scribe-hero">
        <div class="scribe-hero__sigil" aria-hidden="true">✎</div>
        <div><span class="eyebrow">Optional session helper</span><h2>Let the table play. Let the scribe remember.</h2><p>If your group plays on Discord, the local bot can turn each speaker's voice into timestamped notes. Prefer pen and paper? That works just as well—type the recap into the session editor afterward.</p></div>
      </section>
      <div class="choice-grid">
        <section class="project-panel"><span class="eyebrow">Discord table</span><h3>Use the local Scribe</h3><p>The bot joins only after someone runs <code>/trascrivi</code>. It labels speakers, keeps temporary audio in memory and writes Markdown notes on this computer.</p><div class="action-row"><button class="primary-button" data-scribe-action="${isRunning ? 'stop' : 'start'}" ${!isRunning && !transcriber.configured ? 'disabled' : ''}>${isRunning ? 'Stop Discord Scribe' : transcriber.environmentReady ? 'Start Discord Scribe' : 'Prepare & start Scribe'}</button><span class="job-status ${escapeHtml(job?.status ?? '')}">${escapeHtml(status)}</span></div></section>
        <section class="project-panel"><span class="eyebrow">Around a physical table</span><h3>Bring your own notes</h3><p>Write by hand, use your favorite notes app or appoint a heroic volunteer. After the session, add the summary and key events from the <strong>Sessions</strong> tab.</p><button class="secondary-button" data-action="show-sessions" ${state.campaign ? '' : 'disabled'}>Open session archive</button></section>
      </div>
      <section class="project-panel scribe-steps"><span class="eyebrow">First-time ritual</span><h3>Four steps, zero cloud transcription</h3><ol><li>Copy <code>discord-transcriber/.env.example</code> to <code>.env</code> and add your Discord bot token.</li><li>Return here and choose <strong>Prepare & start Scribe</strong>.</li><li>In Discord, join voice and run <code>/trascrivi</code>.</li><li>Run <code>/ferma</code> when the session ends. Notes appear in <code>${escapeHtml(transcriber.transcriptDirectory ?? 'discord-transcriber/transcripts/')}</code>.</li></ol><a class="secondary-button" href="https://github.com/mtamagno/questkeeper-rpg-campaign-manager/blob/main/discord-transcriber/README.md" target="_blank" rel="noreferrer">Open the complete setup guide</a></section>
      ${job?.logs ? `<pre class="job-log">${escapeHtml(job.logs)}</pre>` : ''}
    </div>`;
}

async function refreshJobs() {
  const result = await api('/api/jobs');
  state.project = result;
  renderCompanionAction();
  if (state.projectMode) renderProject();
  if (state.scribeMode) renderScribe();
  if (state.aiMode) renderAiSetup();
  if (Object.values(result.jobs).some((job) => ['running', 'stopping'].includes(job.status))) {
    setTimeout(() => refreshJobs().catch((error) => toast(error.message, true)), 1200);
  } else await loadState();
}

async function runProjectAction(kind, view = 'project') {
  await api(`/api/actions/${kind}`, { method: 'POST', body: '{}' });
  if (kind === 'preview') {
    state.project.companion = {
      action: 'wait',
      label: 'Starting…',
      status: 'Waiting for the Companion to become ready…',
      url: 'http://127.0.0.1:4200',
    };
  }
  state.libraryMode = false;
  state.projectMode = view === 'project';
  state.scribeMode = view === 'scribe';
  state.aiMode = false;
  state.compendiumMode = false;
  renderSidebar();
  void refreshJobs();
}

async function exportCampaign(campaignId) {
  const bundle = await api(`/api/campaigns/${encodeURIComponent(campaignId)}/export`);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(
    new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
  );
  link.download = `${campaignId}-backup.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function exportCurrent() {
  await exportCampaign(state.selectedId);
}

async function runStorageAction(action, key) {
  const storage = state.project.storage ?? {};
  if (action === 'copy') {
    const value = storage[key];
    if (!value) throw new Error('Storage path is not available.');
    await navigator.clipboard.writeText(value);
    toast('Path copied.');
    return;
  }
  if (action === 'open') {
    await api('/api/storage/open', {
      method: 'POST',
      body: JSON.stringify({ target: key }),
    });
    toast('Folder opened.');
    return;
  }
  if (action === 'backup') {
    const result = await api('/api/storage/backup', { method: 'POST', body: '{}' });
    toast(`Full backup created in ${result.destination}`);
    return;
  }
  if (action === 'export') {
    const bundle = await api('/api/storage/export');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
    );
    link.download = `questkeeper-all-campaigns-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast('All campaign bundles exported. Use Back up now to include original media.');
  }
}

async function importFile(file) {
  const bundle = JSON.parse(await file.text());
  const campaign = await api('/api/import', { method: 'POST', body: JSON.stringify(bundle) });
  await loadState();
  await selectCampaign(campaign.manifestEntry.id);
  toast('Backup imported successfully.');
}

campaignList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-campaign]');
  if (button) selectCampaign(button.dataset.campaign).catch((error) => toast(error.message, true));
});
document.querySelector('#campaign-search').addEventListener('input', () => {
  renderSidebar();
  if (state.libraryMode) renderLibrary();
});
document.querySelector('#new-campaign').addEventListener('click', () => openCampaignEditor(false));
document.querySelector('#show-library').addEventListener('click', showLibrary);
mobileMenu.addEventListener('click', () =>
  setMenuOpen(!document.body.classList.contains('menu-open')),
);
document.querySelector('#menu-backdrop').addEventListener('click', () => setMenuOpen(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) setMenuOpen(false);
});
document.querySelector('#show-project').addEventListener('click', () => {
  state.libraryMode = false;
  state.projectMode = true;
  state.scribeMode = false;
  state.aiMode = false;
  state.compendiumMode = false;
  setMenuOpen(false);
  renderSidebar();
  render();
});
document.querySelector('#show-scribe').addEventListener('click', () => {
  state.libraryMode = false;
  state.scribeMode = true;
  state.projectMode = false;
  state.aiMode = false;
  state.compendiumMode = false;
  setMenuOpen(false);
  renderSidebar();
  render();
});
document.querySelector('#show-ai-setup').addEventListener('click', () => {
  state.libraryMode = false;
  state.aiMode = true;
  state.aiConfigureExpanded = state.project.ai?.config?.setupState !== 'unseen';
  state.scribeMode = false;
  state.projectMode = false;
  state.compendiumMode = false;
  setMenuOpen(false);
  renderSidebar();
  render();
});
document
  .querySelector('#import-campaign')
  .addEventListener('click', () => document.querySelector('#import-file').click());
document.querySelector('#import-file').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) importFile(file).catch((error) => toast(error.message, true));
  event.target.value = '';
});
document.querySelector('#show-compendia').addEventListener('click', () => {
  showCompendia().catch((error) => toast(error.message, true));
});
document.querySelector('#compendium-import-file').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) previewCompendiumFile(file).catch((error) => toast(error.message, true));
  event.target.value = '';
});
document.querySelector('#open-companion').addEventListener('click', (event) => {
  const action = event.currentTarget.dataset.companionAction;
  if (action === 'prepare') {
    state.projectMode = true;
    state.compendiumMode = false;
    render();
    toast('Prepare the project first.');
    return;
  }
  if (action === 'open') {
    openLocalCompanion().catch((error) => toast(error.message, true));
    return;
  }
  if (action === 'wait') {
    state.projectMode = true;
    state.compendiumMode = false;
    render();
    return;
  }
  runProjectAction('preview').catch((error) => toast(error.message, true));
});
document.querySelector('#quit-manager').addEventListener('click', () => serviceDialog.showModal());
document
  .querySelector('#stop-companion')
  .addEventListener('click', () => stopCompanion().catch((error) => toast(error.message, true)));
document
  .querySelector('#service-dialog-close')
  .addEventListener('click', () => serviceDialog.close());
document
  .querySelector('#service-stop-companion')
  .addEventListener('click', () => stopCompanion().catch((error) => toast(error.message, true)));
document
  .querySelector('#service-quit-manager')
  .addEventListener('click', () =>
    quitManager('manager').catch((error) => toast(error.message, true)),
  );
document
  .querySelector('#service-stop-all')
  .addEventListener('click', () => quitManager('all').catch((error) => toast(error.message, true)));

content.addEventListener('click', async (event) => {
  const compendiumAction = event.target.closest('[data-compendium-action]');
  if (compendiumAction) {
    try {
      const action = compendiumAction.dataset.compendiumAction;
      if (action === 'new') openCompendiumEditor();
      if (action === 'choose-import') document.querySelector('#compendium-import-file').click();
      if (action === 'cancel-import') {
        state.compendiumImport = null;
        renderCompendia();
      }
      if (action === 'confirm-import') {
        const overwriteConfirmed =
          content.querySelector('[data-compendium-overwrite]')?.checked === true;
        if (state.compendiumImport.preview.overwriteRequired && !overwriteConfirmed) {
          toast('Confirm the reviewed namespace replacement first.', true);
          return;
        }
        await api('/api/compendia/import', {
          method: 'POST',
          body: JSON.stringify({
            package: state.compendiumImport.package,
            overwriteConfirmed,
          }),
        });
        state.compendiumImport = null;
        await loadCompendia();
        renderCompendia();
        toast('Reviewed compendium package imported.');
      }
      if (action === 'edit') {
        const result = await api(
          `/api/compendia/${encodeURIComponent(compendiumAction.dataset.namespace)}`,
        );
        openCompendiumEditor(result.package);
      }
      if (action === 'export') {
        const isPrivate = compendiumAction.dataset.private === 'true';
        if (
          isPrivate &&
          !confirm(
            'This export contains private user-owned compendium material. Share it only when you have permission. Continue?',
          )
        ) {
          return;
        }
        const namespace = compendiumAction.dataset.namespace;
        const bundle = await api(
          `/api/compendia/${encodeURIComponent(namespace)}?export=true&includePrivate=${isPrivate}`,
        );
        downloadJson(
          bundle,
          `questkeeper-compendium-${namespace}-${bundle.package.manifest.version}.json`,
        );
        toast('Compendium package exported with its provenance and permission metadata.');
      }
    } catch (error) {
      toast(error.message, true);
    }
    return;
  }
  const libraryAction = event.target.closest('[data-library-action]');
  if (libraryAction) {
    try {
      const { id } = libraryAction.dataset;
      if (libraryAction.dataset.libraryAction === 'open') await selectCampaign(id);
      if (libraryAction.dataset.libraryAction === 'edit') {
        await selectCampaign(id);
        openCampaignEditor(true);
      }
      if (libraryAction.dataset.libraryAction === 'backup') {
        await exportCampaign(id);
        toast('Campaign backup downloaded.');
      }
    } catch (error) {
      toast(error.message, true);
    }
    return;
  }
  const onboarding = event.target.closest('[data-ai-onboarding]');
  if (onboarding) {
    chooseAiSetupPath(onboarding.dataset.aiOnboarding).catch((error) => toast(error.message, true));
    return;
  }
  const aiSave = event.target.closest('[data-ai-save]');
  if (aiSave) {
    saveAiSetup(aiSave.dataset.aiSave).catch((error) => toast(error.message, true));
    return;
  }
  const aiAction = event.target.closest('[data-ai-action]');
  if (aiAction) {
    runAiSetupAction(aiAction.dataset.aiAction, aiAction.dataset.provider).catch((error) =>
      toast(error.message, true),
    );
    return;
  }
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    if (state.tab === 'translations' && !state.entityTranslations) {
      state.entityTranslations = await api(
        `/api/campaigns/${encodeURIComponent(state.selectedId)}/translations/draft`,
      );
    }
    renderCampaign();
    return;
  }
  const translationAction = event.target.closest('[data-translation-action]');
  if (translationAction) {
    try {
      await runEntityTranslationAction(translationAction.dataset.translationAction);
    } catch (error) {
      toast(error.message, true);
    }
    return;
  }
  const action = event.target.closest('[data-action]');
  if (action) {
    try {
      if (action.dataset.action === 'new-campaign') openCampaignEditor(false);
      if (action.dataset.action === 'import') document.querySelector('#import-file').click();
      if (action.dataset.action === 'edit-campaign') openCampaignEditor(true);
      if (action.dataset.action === 'export') await exportCurrent();
      if (action.dataset.action === 'delete-campaign') {
        const confirmation = prompt(`To delete this campaign, type exactly: ${state.selectedId}`);
        if (confirmation === null) return;
        await api(`/api/campaigns/${encodeURIComponent(state.selectedId)}`, {
          method: 'DELETE',
          body: JSON.stringify({ confirmation }),
        });
        state.selectedId = null;
        state.campaign = null;
        await loadState();
        showLibrary();
        toast('Campaign moved to the local recycle bin.');
      }
      if (action.dataset.action === 'show-sessions') {
        if (!state.campaign) {
          toast('Create or select a campaign first.', true);
          return;
        }
        state.scribeMode = false;
        state.projectMode = false;
        state.tab = 'sessions';
        renderCampaign();
      }
      if (action.dataset.action === 'show-characters') {
        state.tab = 'characters';
        renderCampaign();
      }
      if (action.dataset.action === 'set-my-character') {
        setMyCharacter(action.dataset.id);
        toast(
          selectedMyCharacter()
            ? 'My character saved on this device.'
            : 'My character shortcut cleared.',
        );
      }
      if (action.dataset.action === 'open-my-character') {
        const companion = state.project.companion;
        if (companion?.action !== 'open') {
          toast('Start the Companion first.', true);
        } else {
          await openLocalCompanion();
        }
      }
      if (action.dataset.action === 'open-local-companion') await openLocalCompanion();
      if (action.dataset.action === 'stop-companion') await stopCompanion();
      if (action.dataset.action === 'add-entity') openEntityEditor(action.dataset.type);
      if (action.dataset.action === 'edit-entity')
        openEntityEditor(
          action.dataset.type,
          state.campaign[action.dataset.type].find((item) => item.id === action.dataset.id),
        );
      if (
        action.dataset.action === 'delete-entity' &&
        confirm('Remove this entry? It will be moved to the local recycle bin when possible.')
      ) {
        await api(
          `/api/campaigns/${encodeURIComponent(state.selectedId)}/${action.dataset.type}/${encodeURIComponent(action.dataset.id)}`,
          { method: 'DELETE', body: '{}' },
        );
        state.campaign = await api(`/api/campaigns/${encodeURIComponent(state.selectedId)}`);
        render();
        toast('Entry removed.');
      }
    } catch (error) {
      toast(error.message, true);
    }
  }
  const projectAction = event.target.closest('[data-project-action]');
  if (projectAction)
    runProjectAction(projectAction.dataset.projectAction).catch((error) =>
      toast(error.message, true),
    );
  const storageAction = event.target.closest('[data-storage-action]');
  if (storageAction)
    runStorageAction(storageAction.dataset.storageAction, storageAction.dataset.storageKey).catch(
      (error) => toast(error.message, true),
    );
  const publishAction = event.target.closest('[data-publish-action]');
  if (publishAction)
    runPublishingAction(publishAction.dataset.publishAction).catch((error) =>
      toast(error.message, true),
    );
  const scribeAction = event.target.closest('[data-scribe-action]');
  if (scribeAction) {
    const kind = scribeAction.dataset.scribeAction === 'stop' ? 'transcriber-stop' : 'transcriber';
    runProjectAction(kind, 'scribe').catch((error) => toast(error.message, true));
  }
});

content.addEventListener('change', (event) => {
  if (!event.target.matches('[data-advanced-mode]')) return;
  state.advancedMode = event.target.checked;
  localStorage.setItem('questkeeper-manager-advanced', String(state.advancedMode));
  toast(state.advancedMode ? 'Advanced controls enabled.' : 'Advanced controls hidden.');
});

let compendiumSearchTimer;
content.addEventListener('input', (event) => {
  if (!event.target.matches('[data-compendium-search]')) return;
  state.compendiumSearch = event.target.value;
  clearTimeout(compendiumSearchTimer);
  compendiumSearchTimer = setTimeout(() => {
    loadCompendia()
      .then(renderCompendia)
      .catch((error) => toast(error.message, true));
  }, 180);
});

content.addEventListener('submit', (event) => {
  if (event.target.id !== 'ai-setup-form') return;
  event.preventDefault();
  saveAiSetup('complete').catch((error) => toast(error.message, true));
});

fields.addEventListener('click', (event) => {
  if (event.target.closest('[data-mood-phase-add]')) {
    const list = fields.querySelector('[data-mood-phase-list]');
    const index = list?.querySelectorAll('[data-mood-phase]').length ?? 0;
    list?.insertAdjacentHTML('beforeend', moodPhaseCard({}, index));
    window.managerI18n?.translateTree?.(list?.lastElementChild);
    list?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const removeMoodPhase = event.target.closest('[data-mood-phase-remove]');
  if (removeMoodPhase) {
    removeMoodPhase.closest('[data-mood-phase]')?.remove();
    return;
  }
  const duplicatePalette = event.target.closest('[data-palette-duplicate]');
  if (duplicatePalette) {
    const base = duplicatePalette.dataset.paletteDuplicate;
    const preset = PALETTE_PRESETS[base];
    fields.querySelector('[name="palette"][value="custom"]').checked = true;
    fields.querySelector('[name="customPaletteBase"]').value = base;
    for (const [role, color] of Object.entries(preset)) {
      fields.querySelector(`[name="paletteRole__${role}"]`).value = color;
    }
    refreshPaletteStudio();
    return;
  }
  const resetPaletteRole = event.target.closest('[data-palette-reset]');
  if (resetPaletteRole) {
    const role = resetPaletteRole.dataset.paletteReset;
    const base = fields.querySelector('[name="customPaletteBase"]')?.value || 'heroic';
    fields.querySelector(`[name="paletteRole__${role}"]`).value = PALETTE_PRESETS[base][role];
    refreshPaletteStudio();
    return;
  }
  if (event.target.closest('[data-palette-export]')) {
    downloadJson(paletteDraftFromFields(), 'questkeeper-companion-palette.json');
    toast('Custom Companion palette exported.');
    return;
  }
  if (event.target.closest('[data-palette-import]')) {
    fields.querySelector('[data-palette-import-file]')?.click();
    return;
  }
  const addCompendiumEntry = event.target.closest('[data-compendium-add-entry]');
  if (addCompendiumEntry) {
    const list = fields.querySelector('[data-compendium-entries]');
    const index = list.querySelectorAll('[data-compendium-entry]').length;
    const locale =
      fields.querySelector('[name="compendiumLocales"]').value.split(',')[0]?.trim() || 'en';
    list.insertAdjacentHTML('beforeend', compendiumEntryCard({}, index, locale));
    window.managerI18n?.translateTree?.(list.lastElementChild);
    list.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const removeCompendiumEntry = event.target.closest('[data-compendium-remove-entry]');
  if (removeCompendiumEntry) {
    removeCompendiumEntry.closest('[data-compendium-entry]')?.remove();
    return;
  }
  const addStoryHighlight = event.target.closest('[data-story-add]');
  if (addStoryHighlight) {
    const kind = addStoryHighlight.dataset.storyAdd;
    const list = fields.querySelector(`[data-story-list="${kind}"]`);
    const index = list?.querySelectorAll('[data-story-card]').length ?? 0;
    list?.insertAdjacentHTML('beforeend', storyHighlightCard(kind, {}, campaignLanguages(), index));
    window.managerI18n?.translateTree?.(list?.lastElementChild);
    list?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const removeStoryHighlight = event.target.closest('[data-story-remove]');
  if (removeStoryHighlight) {
    removeStoryHighlight.closest('[data-story-card]')?.remove();
    return;
  }
  const addNotebookPage = event.target.closest('[data-notebook-add-page]');
  if (addNotebookPage) {
    const list = fields.querySelector('[data-notebook-pages]');
    const index = list.querySelectorAll('[data-notebook-page]').length;
    list.insertAdjacentHTML('beforeend', notebookPageEditor({}, campaignLanguages(), index));
    window.managerI18n?.translateTree?.(list.lastElementChild);
    list.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const removeNotebookPage = event.target.closest('[data-notebook-remove-page]');
  if (removeNotebookPage) {
    removeNotebookPage.closest('[data-notebook-page]')?.remove();
    return;
  }
  const notebookButton = event.target.closest('[data-ai-notebook]');
  if (notebookButton) {
    processNotebookDraft().catch((error) => toast(error.message, true));
    return;
  }
  const translateCampaign = event.target.closest('[data-translate-campaign]');
  if (translateCampaign) {
    processCampaignTranslation().catch((error) => toast(error.message, true));
    return;
  }
  const applyTranslation = event.target.closest('[data-apply-translation]');
  if (applyTranslation) {
    applyCampaignTranslation();
    return;
  }
  const addLanguage = event.target.closest('[data-language-add]');
  if (addLanguage) {
    addCampaignLanguage(false);
    return;
  }
  const addCustomLanguage = event.target.closest('[data-language-add-custom]');
  if (addCustomLanguage) {
    addCampaignLanguage(true);
    return;
  }
  const removeLanguage = event.target.closest('[data-language-remove]');
  if (removeLanguage) {
    removeCampaignLanguage(removeLanguage.dataset.languageRemove);
    return;
  }
  const entityButton = event.target.closest('[data-ai-entity]');
  if (entityButton) {
    processEntityImport(entityButton.dataset.aiEntity).catch((error) => toast(error.message, true));
    return;
  }
  const button = event.target.closest('[data-ai-notes]');
  if (!button) return;
  processSessionNotes(button.dataset.aiNotes === 'images').catch((error) =>
    toast(error.message, true),
  );
});

fields.addEventListener('change', (event) => {
  if (event.target.name === 'palette') {
    refreshPaletteStudio();
    return;
  }
  if (event.target.matches('[name^="paletteRole__"]')) {
    refreshPaletteStudio();
    return;
  }
  if (event.target.matches('[data-palette-import-file]')) {
    const file = event.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        const palette = JSON.parse(text);
        if (palette?.version !== 1 || !palette.roles) {
          throw new Error('This is not a supported QuestKeeper palette file.');
        }
        const base = ['heroic', 'gothic', 'neutral'].includes(palette.base)
          ? palette.base
          : 'heroic';
        fields.querySelector('[name="palette"][value="custom"]').checked = true;
        fields.querySelector('[name="customPaletteBase"]').value = base;
        fields.querySelector('[name="customPaletteName"]').value = String(
          palette.name || 'Imported palette',
        ).slice(0, 80);
        for (const role of Object.keys(PALETTE_ROLE_LABELS)) {
          const color = String(palette.roles[role] || '').toUpperCase();
          if (!/^#[0-9A-F]{6}$/.test(color)) {
            throw new Error(`Imported ${role} colour is missing or invalid.`);
          }
          fields.querySelector(`[name="paletteRole__${role}"]`).value = color;
        }
        refreshPaletteStudio();
        toast('Palette imported as an editable draft. Review contrast before saving.');
      })
      .catch((error) => showDialogError(error.message));
    return;
  }
  if (event.target.matches('[data-notebook-toggle]')) {
    const body = event.target
      .closest('[data-notebook-editor]')
      ?.querySelector('[data-notebook-body]');
    if (body) body.hidden = !event.target.checked;
    return;
  }
  if (event.target.name === 'defaultLanguage' && event.target.closest('[data-language-picker]')) {
    const languages = normalizeLanguageCodes(
      fields.querySelector('[data-language-picker] [name="languages"]').value,
    );
    refreshCampaignLanguages(languages, event.target.value);
    languagePickerMessage('Default language updated. Required fields changed below.');
    return;
  }
  if (event.target.name === 'gameSystemId') {
    const customEdition = fields.querySelector('[data-custom-edition]');
    if (customEdition) customEdition.hidden = event.target.value !== 'generic';
    return;
  }
  const imageField = event.target.closest('[data-ai-image-field]');
  if (imageField && state.editor?.aiImages) {
    const image = state.editor.aiImages[Number(imageField.dataset.aiImageIndex)];
    if (!image) return;
    image[imageField.dataset.aiImageField] =
      imageField.dataset.aiImageField === 'afterSection'
        ? Number(imageField.value)
        : imageField.value;
    return;
  }
  if (
    event.target.name?.startsWith('loc__prose__') &&
    state.editor?.aiDraft &&
    state.editor.aiLanguage
  ) {
    renderAiReview(state.editor.aiDraft, state.editor.aiLanguage);
  }
});

fields.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  if (event.target.matches('[data-language-search]')) {
    event.preventDefault();
    addCampaignLanguage(false);
  } else if (event.target.matches('[data-language-custom]')) {
    event.preventDefault();
    addCampaignLanguage(true);
  }
});

fields.addEventListener('input', (event) => {
  if (event.target.matches('[name^="paletteRole__"]')) refreshPaletteStudio();
});

editorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const save = document.querySelector('#dialog-save');
  if (save.disabled) return;
  clearDialogError();
  const invalidField = editorForm.querySelector(':invalid');
  if (invalidField) {
    showDialogError(
      translate('Check the highlighted field before saving. Your draft is still here.'),
      invalidField,
    );
    return;
  }
  save.disabled = true;
  save.textContent = 'Saving…';
  saveEditor()
    .catch((error) => showDialogError(error.message))
    .finally(() => {
      save.disabled = false;
      save.textContent = 'Save';
    });
});
editorForm.addEventListener('input', clearDialogError);
document.querySelector('#dialog-close').addEventListener('click', () => {
  clearDialogError();
  dialog.close();
});
document.querySelector('#dialog-cancel').addEventListener('click', () => {
  clearDialogError();
  dialog.close();
});

document.querySelector('#show-manager-settings').addEventListener('click', () => {
  syncManagerThemeUi();
  managerSettingsDialog.showModal();
});
document.querySelector('#manager-settings-close').addEventListener('click', () => {
  managerSettingsDialog.close();
});
document.querySelector('#manager-settings-done').addEventListener('click', () => {
  managerSettingsDialog.close();
});
document.querySelector('#manager-theme-reset').addEventListener('click', () => {
  setManagerTheme('system');
  toast('Manager appearance now follows this device.');
});
managerSettingsDialog.addEventListener('change', (event) => {
  if (event.target.name !== 'managerTheme') return;
  setManagerTheme(event.target.value);
});
syncManagerThemeUi();

loadState({ allowFirstRunPrompt: true }).catch((error) => {
  content.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  toast(error.message, true);
});
