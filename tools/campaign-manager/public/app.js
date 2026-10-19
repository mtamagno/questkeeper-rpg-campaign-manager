const token = document.querySelector('meta[name="manager-token"]').content;
const content = document.querySelector('#content');
const campaignList = document.querySelector('#campaign-list');
const dialog = document.querySelector('#editor-dialog');
const editorForm = document.querySelector('#editor-form');
const fields = document.querySelector('#dialog-fields');
const mobileMenu = document.querySelector('#mobile-menu');

const state = {
  campaigns: [],
  campaign: null,
  selectedId: null,
  tab: 'overview',
  projectMode: false,
  scribeMode: false,
  aiMode: false,
  project: {
    dependenciesReady: false,
    transcriber: { configured: false, environmentReady: false },
    jobs: {},
    ai: null,
  },
  editor: null,
};

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
  if (!response.ok) throw new Error(result.error || `Error ${response.status}`);
  return result;
}

function toast(message, error = false) {
  const element = document.createElement('div');
  element.className = `toast${error ? ' error' : ''}`;
  element.textContent = message;
  document.querySelector('#toast-region').append(element);
  setTimeout(() => element.remove(), 4200);
}

function setMenuOpen(open) {
  document.body.classList.toggle('menu-open', open);
  mobileMenu.setAttribute('aria-expanded', String(open));
}

async function loadState({ selectFirst = false } = {}) {
  const result = await api('/api/state');
  state.campaigns = result.campaigns;
  state.project = {
    dependenciesReady: result.dependenciesReady,
    transcriber: result.transcriber,
    jobs: result.jobs,
    ai: result.ai,
    publishing: result.publishing,
  };
  if (selectFirst && !state.selectedId && result.campaigns.length) {
    state.selectedId = result.campaigns[0].id;
    state.campaign = await api(`/api/campaigns/${encodeURIComponent(state.selectedId)}`);
  }
  if (!result.ai?.config?.setupComplete) state.aiMode = true;
  renderSidebar();
  render();
}

async function selectCampaign(id) {
  state.selectedId = id;
  state.projectMode = false;
  state.scribeMode = false;
  state.aiMode = false;
  state.campaign = await api(`/api/campaigns/${encodeURIComponent(id)}`);
  state.tab = 'overview';
  setMenuOpen(false);
  renderSidebar();
  render();
}

function renderSidebar() {
  const query = document.querySelector('#campaign-search').value.toLowerCase();
  const campaigns = state.campaigns.filter((item) =>
    `${localized(item.name)} ${localized(item.description)}`.toLowerCase().includes(query),
  );
  campaignList.innerHTML = campaigns.length
    ? campaigns
        .map(
          (item) => `
          <button class="campaign-link ${item.id === state.selectedId && !state.projectMode ? 'active' : ''}" data-campaign="${escapeHtml(item.id)}">
            <span class="campaign-link__sigil">${escapeHtml(localized(item.name).charAt(0).toUpperCase() || '✦')}</span>
            <span><strong>${escapeHtml(localized(item.name, item.defaultLanguage ?? 'en'))}</strong><small>${escapeHtml(localized(item.status, item.defaultLanguage ?? 'en') || 'Campaign')}</small></span>
            <span class="campaign-link__count">${item.counts.characters}</span>
          </button>`,
        )
        .join('')
    : '<div class="empty">No campaigns found.</div>';
}

function render() {
  if (state.aiMode) {
    renderAiSetup();
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

function campaignAsset(path) {
  if (!path || !state.selectedId) return '';
  const prefix = `campaigns/${state.selectedId}/`;
  const relativePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;
  return `/campaign-assets/${encodeURIComponent(state.selectedId)}/${relativePath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
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
    default:
      return renderOverview();
  }
}

function renderOverview() {
  const { campaign, characters, npcs, sessions, maps } = state.campaign;
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
      <section class="project-panel"><span class="eyebrow">The story so far</span><h2>${escapeHtml(localized(campaign.name))}</h2><p>${escapeHtml(localized(campaign.storySoFar) || 'Your running campaign recap will appear here.')}</p></section>
      <section class="project-panel"><h3>Table details</h3><dl class="detail-list"><div><dt>Game Master</dt><dd>${escapeHtml(campaign.dungeonMaster)}</dd></div><div><dt>Party</dt><dd>${escapeHtml(campaign.partyName)}</dd></div><div><dt>System</dt><dd>${escapeHtml(campaign.edition)}</dd></div><div><dt>Started</dt><dd>${escapeHtml(campaign.startDate)}</dd></div></dl></section>
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
      <article class="card"><div class="card__top"><span class="card__avatar">${escapeHtml(entityName(type, item).charAt(0).toUpperCase() || '✦')}</span><div class="card__menu"><button data-action="edit-entity" data-type="${type}" data-id="${escapeHtml(item.id)}">Edit</button><button data-action="delete-entity" data-type="${type}" data-id="${escapeHtml(item.id)}">Remove</button></div></div><h3>${escapeHtml(entityName(type, item))}</h3><p>${escapeHtml(entityDescription(type, item)).slice(0, 180)}</p><div class="card__meta">${entityTags(
        type,
        item,
      )
        .filter(Boolean)
        .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join('')}</div></article>`,
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

function normalizeLanguageCodes(value) {
  return [
    ...new Set(
      String(value ?? '')
        .split(/[\s,]+/)
        .map((code) => code.trim())
        .filter(Boolean),
    ),
  ];
}

function campaignLanguages() {
  const entry = state.campaign?.manifestEntry;
  const inferred = Object.keys(entry?.name ?? {});
  return entry?.languages?.length ? entry.languages : inferred.length ? inferred : ['en'];
}

function languageName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function localizedFields(prefix, label, value, languages, options = {}) {
  return languages.map((language) =>
    field(
      `loc__${prefix}__${language}`,
      `${label} · ${languageName(language)} (${language})`,
      value?.[language] ?? '',
      options,
    ),
  );
}

function engineValue(provider, model) {
  return `${provider}::${model}`;
}

function parseEngineValue(value) {
  const separator = String(value || '').indexOf('::');
  if (separator < 1) return null;
  return { provider: value.slice(0, separator), model: value.slice(separator + 2) };
}

function engineChoices(kind) {
  const config = state.project.ai?.config;
  if (!config) return [];
  if (kind === 'text') {
    return [
      ...(config.text.ollamaModels ?? []).map((model) => ({
        value: engineValue('ollama', model),
        label: `Local · Ollama · ${model}`,
      })),
      ...(config.text.openaiKeyConfigured ? config.text.openaiModels : []).map((model) => ({
        value: engineValue('openai', model),
        label: `Remote · OpenAI · ${model}`,
      })),
    ];
  }
  return [
    ...(config.image.comfyCheckpoints ?? []).map((model) => ({
      value: engineValue('comfyui', model),
      label: `Local · ComfyUI · ${model}`,
    })),
    ...(config.text.openaiKeyConfigured ? config.image.openaiModels : []).map((model) => ({
      value: engineValue('openai', model),
      label: `Remote · OpenAI · ${model}`,
    })),
  ];
}

function defaultEngineValue(kind) {
  const config = state.project.ai?.config;
  if (!config) return '';
  const provider = kind === 'text' ? config.text.provider : config.image.provider;
  if (provider === 'off') {
    return kind === 'text'
      ? engineValue('ollama', config.text.ollamaModel)
      : engineValue('comfyui', config.image.comfyCheckpoint);
  }
  const model =
    kind === 'text'
      ? provider === 'ollama'
        ? config.text.ollamaModel
        : config.text.openaiModel
      : provider === 'comfyui'
        ? config.image.comfyCheckpoint
        : config.image.openaiModel;
  return engineValue(provider, model);
}

function engineSelect(name, label, kind, hint) {
  const choices = engineChoices(kind);
  const selected = defaultEngineValue(kind);
  return `<label class="field"><span>${escapeHtml(label)}</span><select name="${name}">${choices.length ? choices.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === selected ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('') : '<option value="">Configure a model first</option>'}</select><small>${escapeHtml(hint)}</small></label>`;
}

function entityAiImportPanel(type, languages) {
  const label = type === 'characters' ? 'player character' : 'NPC';
  return `<div class="ai-compose entity-ai-import field--wide"><div><strong>Import this ${label} with AI</strong><small>Use photos or screenshots of a sheet, or a public/shared Roll20 print-view URL. Every extracted field stays editable.</small></div><div class="ai-source-grid">${engineSelect('entityEngine', 'Extraction model', 'text', 'Vision support is required for sheet images. Browser-capable remote models can inspect public URLs.')}<label class="field"><span>Draft language</span><select name="entityLanguage">${languages.map((language) => `<option value="${escapeHtml(language)}">${escapeHtml(languageName(language))} (${escapeHtml(language)})</option>`).join('')}</select></label><label class="field field--wide"><span>Sheet photos or screenshots</span><input name="aiSourceImages" type="file" accept="image/png,image/jpeg,image/webp" multiple /><small>Up to four images. Private/authenticated Roll20 sheets should be imported this way.</small></label><label class="field field--wide"><span>Public Roll20 print view or source URL</span><input name="aiSourceUrl" type="url" placeholder="https://app.roll20.net/…" /><small>Optional. Signed-in pages cannot be read remotely; use screenshots instead.</small></label></div><label class="consent-check"><input name="entityRemoteConsent" type="checkbox" /> I consent to sending these sources to the selected engine when it is labelled <strong>Remote</strong>.</label><div class="action-row"><button class="primary-button" type="button" data-ai-entity="${type}">Extract editable draft</button></div><div class="ai-review" data-ai-entity-review hidden></div></div>`;
}

function openDialog({ title, eyebrow, html, editor }) {
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
      field('id', 'Campaign ID', '', {
        required: true,
        hint: 'Lowercase letters, numbers and hyphens only.',
      }),
      field('startDate', 'Start date', new Date().toISOString().slice(0, 10), { type: 'date' }),
      section('Languages'),
      field('primaryLanguage', 'Primary language code', 'en', {
        required: true,
        hint: 'Any language code, such as en, es, de, pt-BR or fr-CA.',
      }),
      field('additionalLanguages', 'Additional language codes', '', {
        hint: 'Optional · comma-separated. You can add translations after creation.',
      }),
      section('Campaign introduction'),
      field('name', 'Campaign name', '', { required: true }),
      field('description', 'Short description', '', { type: 'textarea' }),
      field('status', 'Status', 'In progress'),
      field('palette', 'Campaign palette', 'heroic', {
        type: 'select',
        values: [
          ['heroic', 'Heroic · gold and midnight'],
          ['gothic', 'Gothic · burgundy and fog'],
          ['neutral', 'Neutral · slate and silver'],
        ],
        hint: 'A curated readable theme. You can change it later.',
      }),
      section('Your table'),
      field('dungeonMaster', 'Game Master', ''),
      field('partyName', 'Party name', ''),
      field('edition', 'System / edition', ''),
      field('cover', 'Cover image', '', { type: 'file', hint: 'PNG, JPEG or WebP · up to 8 MB' }),
    ].join('');
  }
  return [
    field('id', 'Campaign ID', entry.id ?? '', {
      required: true,
      hint: 'Lowercase letters, numbers and hyphens only.',
    }),
    field('startDate', 'Start date', details.startDate ?? new Date().toISOString().slice(0, 10), {
      type: 'date',
    }),
    section('Languages'),
    field('languages', 'Language codes', languages.join(', '), {
      required: true,
      hint: 'Add any BCP-47 language code. Save and reopen to reveal new translation fields.',
    }),
    field('defaultLanguage', 'Default language', entry.defaultLanguage ?? languages[0]),
    section('Name and introduction'),
    ...localizedFields('name', 'Campaign name', entry.name, languages, { required: true }),
    ...localizedFields('description', 'Description', entry.description, languages, {
      type: 'textarea',
    }),
    ...localizedFields('status', 'Status', entry.status, languages),
    field('palette', 'Campaign palette', entry.palette ?? 'heroic', {
      type: 'select',
      values: [
        ['heroic', 'Heroic · gold and midnight'],
        ['gothic', 'Gothic · burgundy and fog'],
        ['neutral', 'Neutral · slate and silver'],
      ],
      hint: 'A curated readable theme. You can change it later.',
    }),
    section('Your table'),
    field('dungeonMaster', 'Game Master', details.dungeonMaster ?? ''),
    field('partyName', 'Party name', details.partyName ?? ''),
    field('edition', 'System / edition', details.edition ?? ''),
    field('cover', 'Cover image', '', { type: 'file', hint: 'PNG, JPEG or WebP · up to 8 MB' }),
    section('Running recap'),
    ...localizedFields('story', 'Story so far', details.storySoFar, languages, {
      type: 'textarea',
    }),
  ].join('');
}

function openCampaignEditor(editing = false) {
  openDialog({
    title: editing ? 'Edit campaign' : 'New campaign',
    eyebrow: editing ? 'Overview' : 'A new adventure',
    html: campaignForm(editing ? state.campaign : null),
    editor: { kind: 'campaign', editing },
  });
  if (editing) fields.querySelector('[name="id"]').disabled = true;
}

function entityForm(type, item = {}) {
  const languages = campaignLanguages();
  const common = [
    field('id', 'Entry ID', item.id ?? '', {
      required: true,
      hint: 'Suggested automatically from the name.',
    }),
  ];
  if (type === 'characters') {
    return [
      ...common,
      entityAiImportPanel(type, languages),
      field('name', 'Name', item.name, { required: true }),
      field('playerName', 'Player', item.playerName),
      ...localizedFields('sex', 'Gender', item.sex, languages),
      field('heightCm', 'Height (cm)', item.heightCm ?? '', {
        type: 'number',
        min: 1,
        hint: 'Optional. Used on the profile and as an artwork proportion reference.',
      }),
      field('level', 'Level', item.sheet?.level ?? 1, { type: 'number', min: 1 }),
      field('classType', 'Class / archetype', item.sheet?.classType),
      field('race', 'Species / ancestry', item.sheet?.race),
      field('background', 'Background', item.sheet?.background),
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
      `<div class="ai-compose field--wide"><div><strong>Turn notes into a reviewable draft</strong><small>Choose the engine for each job. Nothing is saved until you review and choose Save.</small></div><div class="ai-engine-grid">${engineSelect('proseEngine', 'Prose writer', 'text', 'Turns raw notes into the editable chronicle.')}${engineSelect('imagePromptEngine', 'Visual prompt writer', 'text', 'Plans what to illustrate and where it belongs.')}${engineSelect('imageEngine', 'Image renderer', 'image', 'Renders the approved visual prompts.')}</div><div class="action-row"><button class="secondary-button" type="button" data-ai-notes="text">Process notes</button><button class="primary-button" type="button" data-ai-notes="images">Process notes with images</button></div><label class="consent-check"><input name="remoteConsent" type="checkbox" /> I consent to sending these notes to any selected engine labelled <strong>Remote</strong>. Local-only tasks do not require this.</label><div class="ai-review" data-ai-review hidden></div></div>`,
      section('Review and edit the draft'),
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
  if (item) idInput.readOnly = true;
}

function localizedFormValue(form, prefix, fallback = '', languages = campaignLanguages()) {
  const value = Object.fromEntries(
    languages.map((language) => [
      language,
      form.get(`loc__${prefix}__${language}`)?.toString().trim() || fallback,
    ]),
  );
  const first = Object.values(value).find(Boolean) || fallback;
  if (!value.en) value.en = first;
  return value;
}

async function uploadSelectedImage(inputName, category) {
  const file = fields.querySelector(`[name="${inputName}"]`)?.files?.[0];
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
  const primaryLanguage = form.get('primaryLanguage')?.toString().trim() || 'en';
  const languages = creating
    ? normalizeLanguageCodes(`${primaryLanguage},${form.get('additionalLanguages') ?? ''}`)
    : normalizeLanguageCodes(form.get('languages'));
  const defaultLanguage = creating
    ? primaryLanguage
    : form.get('defaultLanguage')?.toString().trim() || languages[0];
  const primary = (fieldName, fallback = '') => {
    const text = form.get(fieldName)?.toString().trim() || fallback;
    return Object.fromEntries(
      [...new Set([...languages, 'en'])].map((language) => [
        language,
        language === defaultLanguage || language === 'en' ? text : '',
      ]),
    );
  };
  const data = {
    id: form.get('id')?.toString() || state.selectedId,
    languages,
    defaultLanguage,
    palette: form.get('palette')?.toString() || 'heroic',
    name: creating ? primary('name') : localizedFormValue(form, 'name', '', languages),
    description: creating
      ? primary('description')
      : localizedFormValue(form, 'description', '', languages),
    status: creating
      ? primary('status', 'In progress')
      : localizedFormValue(form, 'status', '', languages),
    edition: form.get('edition')?.toString(),
    startDate: form.get('startDate')?.toString(),
    dungeonMaster: form.get('dungeonMaster')?.toString(),
    partyName: form.get('partyName')?.toString(),
  };
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
      storySoFar: localizedFormValue(form, 'story', '', languages),
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

async function buildEntity(type, form, original = {}) {
  const id = form.get('id').toString();
  const languages = campaignLanguages();
  if (type === 'characters') {
    const item = baseCharacter(original);
    const profileImage = await uploadSelectedImage('profileImage', 'characters');
    const portraitImage = await uploadSelectedImage('portraitImage', 'characters');
    item.id = id;
    item.name = form.get('name').toString();
    item.playerName = form.get('playerName').toString();
    item.sex = localizedFormValue(form, 'sex', '', languages);
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
    item.privateProfile = {
      ...item.privateProfile,
      secretBackstory: localizedFormValue(form, 'secret', '', languages),
    };
    item.sheet = {
      ...item.sheet,
      level: Number(form.get('level')) || 1,
      classType: form.get('classType').toString(),
      race: form.get('race').toString(),
      background: form.get('background').toString(),
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

function renderAiSetup() {
  document.querySelector('#page-title').textContent = 'AI setup';
  const ai = state.project.ai;
  if (!ai) {
    content.innerHTML = '<div class="empty">Loading the local AI profile…</div>';
    return;
  }
  const { config, hardware, recommendations, models } = ai;
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
      <div class="choice-grid ai-provider-grid">
        <section class="project-panel"><span class="eyebrow">The chronicler · prose & prompts</span><h3>Manage text engines</h3><label class="field"><span>Default provider</span><select name="textProvider"><option value="off" ${config.text.provider === 'off' ? 'selected' : ''}>Off · write manually</option><option value="ollama" ${config.text.provider === 'ollama' ? 'selected' : ''}>Local · Ollama</option><option value="openai" ${config.text.provider === 'openai' ? 'selected' : ''}>Remote · OpenAI API</option></select></label><label class="field"><span>Default Ollama model</span><select name="ollamaModel">${modelNameOptions(config.text.ollamaModels, config.setupComplete ? config.text.ollamaModel : recommendations.textModelId)}</select><small>Suggested for this machine: ${escapeHtml(recommendations.textModelId)}.</small></label><label class="field"><span>Ollama model catalog</span><textarea name="ollamaModels">${escapeHtml(config.text.ollamaModels.join('\n'))}</textarea><small>One model per line. You can add any model supported by your Ollama installation.</small></label><label class="field"><span>Ollama address</span><input name="ollamaUrl" value="${escapeHtml(config.text.ollamaUrl)}" /></label><div class="provider-help"><a href="https://ollama.com/download" target="_blank" rel="noreferrer">Install Ollama first ↗</a><span>Discover installed models or download the selected default.</span></div><div class="action-row"><button class="secondary-button" type="button" data-ai-action="discover-text">Discover installed</button><button class="secondary-button" type="button" data-ai-action="download-text">Download default</button><button class="secondary-button" type="button" data-ai-action="test-text">Test provider</button></div><hr /><label class="field"><span>Default OpenAI text model</span><select name="openaiTextModel">${modelNameOptions(config.text.openaiModels, config.text.openaiModel)}</select></label><label class="field"><span>OpenAI text-model catalog</span><textarea name="openaiTextModels">${escapeHtml(config.text.openaiModels.join('\n'))}</textarea><small>One model ID per line. These models become selectable per session.</small></label><label class="field"><span>OpenAI API key</span><input name="openaiApiKey" type="password" autocomplete="off" placeholder="${config.text.openaiKeyConfigured ? 'Saved locally · leave blank to keep it' : 'sk-…'}" /></label></section>
        <section class="project-panel"><span class="eyebrow">The illustrator · images</span><h3>Manage image engines</h3><label class="field"><span>Default provider</span><select name="imageProvider"><option value="off" ${config.image.provider === 'off' ? 'selected' : ''}>Off · add images manually</option><option value="comfyui" ${config.image.provider === 'comfyui' ? 'selected' : ''}>Local · ComfyUI</option><option value="openai" ${config.image.provider === 'openai' ? 'selected' : ''}>Remote · OpenAI Images</option></select></label><div class="recommendation ${recommendations.localImageRecommended ? 'is-good' : 'is-caution'}"><strong>${recommendations.localImageRecommended ? 'Local generation looks viable' : 'Remote or manual art recommended'}</strong><span>${escapeHtml(recommendations.imageReason)}</span></div><label class="field"><span>ComfyUI address</span><input name="comfyUrl" value="${escapeHtml(config.image.comfyUrl)}" /></label><label class="field"><span>ComfyUI installation folder</span><input name="comfyRoot" value="${escapeHtml(config.image.comfyRoot)}" placeholder="C:\\ComfyUI" /><small>The folder must contain models/checkpoints.</small></label><label class="field"><span>Default ComfyUI checkpoint</span><select name="comfyCheckpoint">${modelNameOptions(config.image.comfyCheckpoints, config.image.comfyCheckpoint)}</select></label><label class="field"><span>ComfyUI checkpoint catalog</span><textarea name="comfyCheckpoints">${escapeHtml(config.image.comfyCheckpoints.join('\n'))}</textarea><small>Discover from a running ComfyUI instance or add a filename manually.</small></label><div class="provider-help"><a href="https://docs.comfy.org/installation/desktop" target="_blank" rel="noreferrer">Install ComfyUI first ↗</a><span>Keep it running while QuestKeeper illustrates a session.</span></div><div class="action-row"><button class="secondary-button" type="button" data-ai-action="discover-image">Discover installed</button><button class="secondary-button" type="button" data-ai-action="test-image">Test provider</button></div><hr /><label class="field"><span>Recommended checkpoint download</span><select name="imageModel">${optionList(models.image, recommendations.imageModelId)}</select></label><label class="consent-check"><input name="licenseAccepted" type="checkbox" /> I reviewed and accept the <a href="${escapeHtml(selectedImageModel.licenseUrl)}" target="_blank" rel="noreferrer">${escapeHtml(selectedImageModel.license)}</a>.</label><button class="secondary-button" type="button" data-ai-action="download-image">Download recommended checkpoint</button><hr /><label class="field"><span>Default OpenAI image model</span><select name="openaiImageModel">${modelNameOptions(config.image.openaiModels, config.image.openaiModel)}</select></label><label class="field"><span>OpenAI image-model catalog</span><textarea name="openaiImageModels">${escapeHtml(config.image.openaiModels.join('\n'))}</textarea><small>One model ID per line. The selected ID is sent on each image request.</small></label></section>
      </div>
      <section class="privacy-panel"><strong>No silent cloud fallback.</strong><p>Local endpoints are restricted to this computer. API keys stay in the ignored <code>.campaign-manager/</code> folder and are never returned to the browser. Before a remote task, the Manager asks for consent again.</p></section>
      <div class="setup-footer"><button class="primary-button" type="submit">${config.setupComplete ? 'Save provider & model library' : 'Save choices and continue'}</button><span>All generated content opens as an editable draft.</span></div>
      ${activeLog ? `<pre class="job-log">${escapeHtml(activeLog.logs)}</pre>` : ''}
    </form>`;
}

function aiSetupPayload(form, complete = true) {
  const lines = (name) =>
    String(form.get(name) || '')
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  return {
    setupComplete: complete,
    text: {
      provider: form.get('textProvider'),
      ollamaUrl: form.get('ollamaUrl'),
      ollamaModel: form.get('ollamaModel'),
      ollamaModels: lines('ollamaModels'),
      openaiModel: form.get('openaiTextModel'),
      openaiModels: lines('openaiTextModels'),
      openaiApiKey: form.get('openaiApiKey'),
    },
    image: {
      provider: form.get('imageProvider'),
      comfyUrl: form.get('comfyUrl'),
      comfyRoot: form.get('comfyRoot'),
      comfyCheckpoint: form.get('comfyCheckpoint'),
      comfyCheckpoints: lines('comfyCheckpoints'),
      openaiModel: form.get('openaiImageModel'),
      openaiModels: lines('openaiImageModels'),
    },
  };
}

async function saveAiSetup(complete = true) {
  const formElement = document.querySelector('#ai-setup-form');
  const form = new FormData(formElement);
  await api('/api/ai/setup', {
    method: 'PUT',
    body: JSON.stringify(aiSetupPayload(form, complete)),
  });
  await loadState();
  if (complete) state.aiMode = false;
  render();
  toast('AI choices saved locally.');
}

async function runAiSetupAction(action) {
  const form = new FormData(document.querySelector('#ai-setup-form'));
  await api('/api/ai/setup', {
    method: 'PUT',
    body: JSON.stringify(aiSetupPayload(form, state.project.ai.config.setupComplete)),
  });
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
  const result = await api('/api/ai/test', { method: 'POST', body: JSON.stringify({ kind }) });
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

async function saveEditor() {
  const form = new FormData(editorForm);
  if (state.editor.kind === 'campaign') await saveCampaign(form);
  else {
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
  toast('Saved. Your Companion is up to date.');
}

function renderProject() {
  document.querySelector('#page-title').textContent = 'Setup and publishing';
  const install = state.project.jobs.install;
  const build = state.project.jobs.build;
  const preview = state.project.jobs.preview;
  const ftpJob = state.project.jobs['ftp-publish'];
  const publishing = state.project.publishing ?? {};
  const activeLog =
    [ftpJob, preview, build, install].find((job) => job?.status === 'running') ||
    ftpJob ||
    preview ||
    build ||
    install;
  content.innerHTML = `
    <div class="project-stack">
      <section class="project-panel"><span class="eyebrow">1 · Preparation</span><h2>Prepare the project</h2><p>${state.project.dependenciesReady ? 'Dependencies are installed. You can preview or validate your Companion.' : 'On first use, install everything the project needs. An internet connection is required.'}</p><div class="action-row"><button class="primary-button" data-project-action="install" ${install?.status === 'running' ? 'disabled' : ''}>${state.project.dependenciesReady ? 'Reinstall dependencies' : 'Prepare automatically'}</button><span class="job-status ${install?.status || ''}">${install ? escapeHtml(install.status) : state.project.dependenciesReady ? 'Ready' : 'Not prepared'}</span></div></section>
      <section class="project-panel"><span class="eyebrow">2 · Preview</span><h2>Open your Companion</h2><p>Launch the local site with the campaign data you just entered.</p><div class="action-row"><button class="primary-button" data-project-action="preview" ${!state.project.dependenciesReady || preview?.status === 'running' ? 'disabled' : ''}>Launch site</button>${preview?.status === 'running' ? '<a class="secondary-button" href="http://127.0.0.1:4200" target="_blank" rel="noreferrer">Open now</a>' : ''}<span class="job-status ${preview?.status || ''}">${preview ? escapeHtml(preview.status) : 'Not started'}</span></div></section>
      <section class="project-panel"><span class="eyebrow">3 · Validation</span><h2>Check before publishing</h2><p>The production build catches invalid data or components before you push to GitHub.</p><div class="action-row"><button class="secondary-button" data-project-action="build" ${!state.project.dependenciesReady || build?.status === 'running' ? 'disabled' : ''}>Check and build site</button><span class="job-status ${build?.status || ''}">${build ? escapeHtml(build.status) : 'Not run'}</span></div></section>
      <section class="project-panel"><span class="eyebrow">4 · Publishing</span><h2>Choose how the archive reaches the realm</h2><p>GitHub Pages remains available through the included workflow. If your hosting provides FTP, configure it once and publish directly from this computer without GitHub Actions.</p><a class="secondary-button" href="https://github.com/mtamagno/questkeeper-rpg-campaign-manager#publish" target="_blank" rel="noreferrer">Open the publishing guide</a></section>
      <form id="publishing-form" class="project-panel publishing-panel"><span class="eyebrow">Direct hosting · FTP / FTPS</span><h2>Publish from Campaign Manager</h2><div class="publishing-grid"><label class="field"><span>Protocol</span><select name="protocol"><option value="ftps" ${publishing.protocol !== 'ftp' ? 'selected' : ''}>FTPS · encrypted (recommended)</option><option value="ftp" ${publishing.protocol === 'ftp' ? 'selected' : ''}>FTP · unencrypted</option></select></label><label class="field"><span>Host</span><input name="host" value="${escapeHtml(publishing.host)}" placeholder="ftp.example.com" /></label><label class="field"><span>Port</span><input name="port" type="number" min="1" value="${publishing.port || 21}" /></label><label class="field"><span>Remote folder</span><input name="remotePath" value="${escapeHtml(publishing.remotePath || '/')}" placeholder="/public_html/questkeeper" /></label><label class="field"><span>Username</span><input name="username" autocomplete="username" value="${escapeHtml(publishing.username)}" /></label><label class="field"><span>Password</span><input name="password" type="password" autocomplete="new-password" placeholder="${publishing.passwordConfigured ? 'Saved locally · leave blank to keep it' : 'Hosting password'}" /></label></div><label class="consent-check"><input name="insecureConsent" type="checkbox" /> I understand that plain FTP sends credentials and files without encryption. This is required only when FTP is selected instead of FTPS.</label><div class="action-row"><button class="secondary-button" type="button" data-publish-action="save">Save destination</button><button class="secondary-button" type="button" data-publish-action="test">Test connection</button><button class="primary-button" type="button" data-publish-action="publish" ${!state.project.dependenciesReady || ftpJob?.status === 'running' ? 'disabled' : ''}>Build & publish now</button><span class="job-status ${ftpJob?.status || ''}">${ftpJob ? escapeHtml(ftpJob.status) : publishing.host ? 'Configured' : 'Not configured'}</span></div><small>Credentials stay in the Git-ignored <code>.campaign-manager/</code> folder and are never returned to the browser.</small></form>
      ${activeLog ? `<pre class="job-log">${escapeHtml(activeLog.logs)}</pre>` : ''}
    </div>`;
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
  if (state.projectMode) renderProject();
  if (state.scribeMode) renderScribe();
  if (state.aiMode) renderAiSetup();
  if (Object.values(result.jobs).some((job) => ['running', 'stopping'].includes(job.status))) {
    setTimeout(() => refreshJobs().catch((error) => toast(error.message, true)), 1200);
  } else await loadState();
}

async function runProjectAction(kind, view = 'project') {
  await api(`/api/actions/${kind}`, { method: 'POST', body: '{}' });
  state.projectMode = view === 'project';
  state.scribeMode = view === 'scribe';
  state.aiMode = false;
  renderSidebar();
  void refreshJobs();
}

async function exportCurrent() {
  const bundle = await api(`/api/campaigns/${encodeURIComponent(state.selectedId)}/export`);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(
    new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
  );
  link.download = `${state.selectedId}-backup.json`;
  link.click();
  URL.revokeObjectURL(link.href);
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
document.querySelector('#campaign-search').addEventListener('input', renderSidebar);
document.querySelector('#new-campaign').addEventListener('click', () => openCampaignEditor(false));
mobileMenu.addEventListener('click', () =>
  setMenuOpen(!document.body.classList.contains('menu-open')),
);
document.querySelector('#menu-backdrop').addEventListener('click', () => setMenuOpen(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) setMenuOpen(false);
});
document.querySelector('#show-project').addEventListener('click', () => {
  state.projectMode = true;
  state.scribeMode = false;
  state.aiMode = false;
  setMenuOpen(false);
  renderSidebar();
  render();
});
document.querySelector('#show-scribe').addEventListener('click', () => {
  state.scribeMode = true;
  state.projectMode = false;
  state.aiMode = false;
  setMenuOpen(false);
  renderSidebar();
  render();
});
document.querySelector('#show-ai-setup').addEventListener('click', () => {
  state.aiMode = true;
  state.scribeMode = false;
  state.projectMode = false;
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
document.querySelector('#open-companion').addEventListener('click', () => {
  if (!state.project.dependenciesReady) {
    state.projectMode = true;
    render();
    toast('Prepare the project first.');
    return;
  }
  if (state.project.jobs.preview?.status === 'running')
    window.open('http://127.0.0.1:4200', '_blank', 'noopener');
  else runProjectAction('preview').catch((error) => toast(error.message, true));
});

content.addEventListener('click', async (event) => {
  const aiAction = event.target.closest('[data-ai-action]');
  if (aiAction) {
    runAiSetupAction(aiAction.dataset.aiAction).catch((error) => toast(error.message, true));
    return;
  }
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    renderCampaign();
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
        await loadState({ selectFirst: true });
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

content.addEventListener('submit', (event) => {
  if (event.target.id !== 'ai-setup-form') return;
  event.preventDefault();
  saveAiSetup(true).catch((error) => toast(error.message, true));
});

fields.addEventListener('click', (event) => {
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

editorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const save = document.querySelector('#dialog-save');
  save.disabled = true;
  save.textContent = 'Saving…';
  saveEditor()
    .catch((error) => toast(error.message, true))
    .finally(() => {
      save.disabled = false;
      save.textContent = 'Save';
    });
});
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#dialog-cancel').addEventListener('click', () => dialog.close());

loadState({ selectFirst: true }).catch((error) => {
  content.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  toast(error.message, true);
});
