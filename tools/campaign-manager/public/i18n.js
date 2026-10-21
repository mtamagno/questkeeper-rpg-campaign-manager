(function () {
  const STORAGE_KEY = 'questkeeper-manager-language';
  const it = {
    'Skip to main content': 'Vai al contenuto principale',
    'Local campaign studio': 'Studio campagne locale',
    'Private on your computer': 'Privato sul tuo computer',
    'Your campaigns': 'Le tue campagne',
    'New campaign': 'Nuova campagna',
    'Search campaigns': 'Cerca campagne',
    Campaigns: 'Campagne',
    'Campaign sections': 'Sezioni della campagna',
    'Import backup': 'Importa backup',
    'AI setup': 'Configurazione AI',
    'Discord Session Scribe': 'Trascrittore Discord',
    'Preview & publish': 'Anteprima e pubblicazione',
    'Close campaign list': 'Chiudi elenco campagne',
    'Open campaign list': 'Apri elenco campagne',
    'Campaign manager': 'Gestore campagne',
    'Your adventure archive': 'Il tuo archivio di avventure',
    'Open Companion': 'Apri Companion',
    Quit: 'Esci',
    'Quit Campaign Manager? Active local jobs and previews started here will stop. Your published Companion remains online.':
      'Chiudere il Gestore campagne? Le attività locali e le anteprime avviate qui verranno interrotte. Il Companion pubblicato resterà online.',
    'Stopping local services…': 'Arresto dei servizi locali…',
    'QuestKeeper is closed': 'QuestKeeper è chiuso',
    'The Campaign Manager and the local services it started have stopped safely.':
      'Il Gestore campagne e i servizi locali che aveva avviato sono stati arrestati in sicurezza.',
    'You can close this browser tab. Your published Companion remains online.':
      'Puoi chiudere questa scheda del browser. Il Companion pubblicato resta online.',
    Interface: 'Interfaccia',
    Italian: 'Italiano',
    Edit: 'Modifica',
    Character: 'Personaggio',
    'New character': 'Nuovo personaggio',
    Close: 'Chiudi',
    Cancel: 'Annulla',
    Save: 'Salva',
    'No campaigns found.': 'Nessuna campagna trovata.',
    Campaign: 'Campagna',
    'Campaign palette': 'Palette della campagna',
    'Heroic · gold and midnight': 'Eroica · oro e blu notte',
    'Gothic · burgundy and fog': 'Gotica · bordeaux e nebbia',
    'Neutral · slate and silver': 'Neutrale · ardesia e argento',
    'A curated readable theme. You can change it later.':
      'Un tema curato e leggibile. Puoi cambiarlo in seguito.',
    'No JSON. No folders to copy.': 'Niente JSON. Nessuna cartella da copiare.',
    'Your next campaign starts here': 'La tua prossima campagna comincia qui',
    'Create a world, gather the party and chronicle each session through friendly forms. Campaign Companion prepares the files for you.':
      'Crea un mondo, riunisci il party e racconta ogni sessione con moduli semplici. Campaign Companion prepara i file per te.',
    'Create your first campaign': 'Crea la prima campagna',
    'Import a backup': 'Importa un backup',
    Overview: 'Panoramica',
    Characters: 'Personaggi',
    Sessions: 'Sessioni',
    Locations: 'Luoghi',
    'Non-player characters': 'Personaggi non giocanti',
    'Session chronicles': 'Cronache delle sessioni',
    'Locations and maps': 'Luoghi e mappe',
    'Add character': 'Aggiungi personaggio',
    'Add NPC': 'Aggiungi PNG',
    'Add session': 'Aggiungi sessione',
    'Add location': 'Aggiungi luogo',
    Backup: 'Backup',
    Delete: 'Elimina',
    'The story so far': 'La storia finora',
    'Table details': 'Dettagli del tavolo',
    'Game Master': 'Dungeon Master',
    System: 'Sistema',
    Started: 'Inizio',
    Archive: 'Archivio',
    'Add, revise or remove every entry without opening a single data file.':
      'Aggiungi, modifica o rimuovi ogni voce senza aprire alcun file dati.',
    Remove: 'Rimuovi',
    Level: 'Livello',
    'Entry ID': 'ID voce',
    'Suggested automatically from the name.': 'Suggerito automaticamente dal nome.',
    Name: 'Nome',
    Player: 'Giocatore',
    'Class / archetype': 'Classe / archetipo',
    'Species / ancestry': 'Specie / ascendenza',
    'Alignment / outlook': 'Allineamento / visione',
    'Height (cm)': 'Altezza (cm)',
    'Optional. Used on the profile and as an artwork proportion reference.':
      'Facoltativa. Usata nel profilo e come riferimento per le proporzioni delle immagini.',
    'Current hit points': 'Punti ferita attuali',
    'Maximum hit points': 'Punti ferita massimi',
    'Armor class': 'Classe armatura',
    Speed: 'Velocità',
    'Proficiency bonus': 'Bonus di competenza',
    Strength: 'Forza',
    Dexterity: 'Destrezza',
    Constitution: 'Costituzione',
    Intelligence: 'Intelligenza',
    Wisdom: 'Saggezza',
    Charisma: 'Carisma',
    'Saving throw proficiencies': 'Competenze nei tiri salvezza',
    'Skill proficiencies': 'Competenze nelle abilità',
    Languages: 'Linguaggi',
    Equipment: 'Equipaggiamento',
    'Features and traits': 'Privilegi e tratti',
    'One per line.': 'Uno per riga.',
    'One item per line.': 'Un oggetto per riga.',
    'Spoiler password': 'Password spoiler',
    'Discourages casual spoilers; this is not encryption.':
      'Scoraggia gli spoiler casuali; non è una cifratura.',
    'Square profile image': 'Immagine profilo quadrata',
    'Face or bust crop; square images work best.':
      'Primo piano o mezzo busto; le immagini quadrate rendono meglio.',
    'Full portrait image': 'Ritratto completo',
    'Optional full-body art; a 2:3 portrait works best.':
      'Figura intera facoltativa; funziona meglio un ritratto 2:3.',
    'Public profile': 'Profilo pubblico',
    'Private notes': 'Note private',
    Backstory: 'Storia personale',
    Gender: 'Genere',
    'Personality traits': 'Tratti della personalità',
    Ideals: 'Ideali',
    Bonds: 'Legami',
    Flaws: 'Difetti',
    'Known history': 'Storia conosciuta',
    'Interests and habits': 'Interessi e abitudini',
    'Secrets and notes': 'Segreti e note',
    'Import this player character with AI': 'Importa questo personaggio con l’AI',
    'Import this NPC with AI': 'Importa questo PNG con l’AI',
    'Use photos or screenshots of a sheet, or a public/shared Roll20 print-view URL. Every extracted field stays editable.':
      'Usa foto o schermate della scheda, oppure un URL pubblico/condiviso della vista di stampa di Roll20. Ogni campo estratto resta modificabile.',
    'Extraction model': 'Modello di estrazione',
    'Vision support is required for sheet images. Browser-capable remote models can inspect public URLs.':
      'Per leggere immagini serve un modello con visione. I modelli remoti con accesso al web possono consultare URL pubblici.',
    'Draft language': 'Lingua della bozza',
    'Sheet photos or screenshots': 'Foto o schermate della scheda',
    'Up to four images. Private/authenticated Roll20 sheets should be imported this way.':
      'Fino a quattro immagini. Per le schede Roll20 private o autenticate usa questo metodo.',
    'Public Roll20 print view or source URL': 'Vista di stampa Roll20 pubblica o URL sorgente',
    'Optional. Signed-in pages cannot be read remotely; use screenshots instead.':
      'Facoltativo. Le pagine che richiedono accesso non possono essere lette da remoto: usa le schermate.',
    'I consent to sending these sources to the selected engine when it is labelled':
      'Acconsento a inviare queste fonti al motore selezionato quando è indicato come',
    Remote: 'Remoto',
    'Extract editable draft': 'Estrai bozza modificabile',
    'Reading sources…': 'Lettura delle fonti…',
    'Editable import ready': 'Importazione modificabile pronta',
    'No extraction warnings were returned; manual review is still required.':
      'Non sono stati restituiti avvisi; la revisione manuale resta necessaria.',
    'Character draft extracted. Review the form before saving.':
      'Bozza del personaggio estratta. Controlla il modulo prima di salvare.',
    'Guided setup · about five minutes': 'Configurazione guidata · circa cinque minuti',
    'Three choices, always editable': 'Tre scelte, sempre modificabili',
    'Choose manual, local or remote creation.': 'Scegli creazione manuale, locale o remota.',
    'Register or discover the models available to each provider.':
      'Registra o rileva i modelli disponibili per ogni provider.',
    'Save the defaults; every session can still choose different models.':
      'Salva i predefiniti; ogni sessione potrà comunque scegliere modelli diversi.',
    'Nothing is downloaded, uploaded or billed until you explicitly start that action.':
      'Nulla viene scaricato, inviato o addebitato finché non avvii esplicitamente l’azione.',
    'Permanent provider & model library': 'Libreria permanente di provider e modelli',
    'Interactive first-run guide': 'Guida interattiva al primo avvio',
    'Your table, your choice of intelligence': 'Il tuo tavolo, la tua scelta di intelligenza',
    'Keep everything local, connect a remote API, or leave AI off. Return here whenever you want to add a key, discover a newly installed model or change the defaults.':
      'Mantieni tutto in locale, collega un’API remota oppure lascia l’AI disattivata. Torna qui quando vuoi aggiungere una chiave, rilevare un nuovo modello o cambiare i predefiniti.',
    Processor: 'Processore',
    Memory: 'Memoria',
    Graphics: 'Grafica',
    'The chronicler · prose & prompts': 'Il cronista · prosa e prompt',
    'Manage text engines': 'Gestisci i motori testuali',
    'Default provider': 'Provider predefinito',
    'Off · write manually': 'Disattivato · scrivi manualmente',
    'Local · Ollama': 'Locale · Ollama',
    'Remote · OpenAI API': 'Remoto · API OpenAI',
    'Default Ollama model': 'Modello Ollama predefinito',
    'Ollama model catalog': 'Catalogo modelli Ollama',
    'One model per line. You can add any model supported by your Ollama installation.':
      'Un modello per riga. Puoi aggiungere qualsiasi modello supportato dalla tua installazione di Ollama.',
    'Ollama address': 'Indirizzo Ollama',
    'Install Ollama first ↗': 'Installa prima Ollama ↗',
    'Discover installed models or download the selected default.':
      'Rileva i modelli installati oppure scarica quello predefinito selezionato.',
    'Discover installed': 'Rileva installati',
    'Download default': 'Scarica predefinito',
    'Test provider': 'Prova provider',
    'Default OpenAI text model': 'Modello testuale OpenAI predefinito',
    'OpenAI text-model catalog': 'Catalogo modelli testuali OpenAI',
    'One model ID per line. These models become selectable per session.':
      'Un ID modello per riga. Questi modelli diventano selezionabili in ogni sessione.',
    'OpenAI API key': 'Chiave API OpenAI',
    'Saved locally · leave blank to keep it': 'Salvata in locale · lascia vuoto per mantenerla',
    'The illustrator · images': 'L’illustratore · immagini',
    'Manage image engines': 'Gestisci i motori immagini',
    'Off · add images manually': 'Disattivato · aggiungi immagini manualmente',
    'Local · ComfyUI': 'Locale · ComfyUI',
    'Remote · OpenAI Images': 'Remoto · OpenAI Images',
    'Local generation looks viable': 'La generazione locale sembra adatta',
    'Remote or manual art recommended': 'Consigliate immagini remote o manuali',
    'Detected resources meet the 16 GB RAM / 6 GB VRAM baseline.':
      'Le risorse rilevate soddisfano la base di 16 GB di RAM e 6 GB di VRAM.',
    'ComfyUI address': 'Indirizzo ComfyUI',
    'ComfyUI installation folder': 'Cartella di installazione ComfyUI',
    'The folder must contain models/checkpoints.': 'La cartella deve contenere models/checkpoints.',
    'Default ComfyUI checkpoint': 'Checkpoint ComfyUI predefinito',
    'ComfyUI checkpoint catalog': 'Catalogo checkpoint ComfyUI',
    'Discover from a running ComfyUI instance or add a filename manually.':
      'Rileva da un’istanza ComfyUI attiva oppure aggiungi manualmente il nome del file.',
    'Install ComfyUI first ↗': 'Installa prima ComfyUI ↗',
    'Keep it running while QuestKeeper illustrates a session.':
      'Tienilo in esecuzione mentre QuestKeeper illustra una sessione.',
    'Recommended checkpoint download': 'Checkpoint consigliato da scaricare',
    'I reviewed and accept the': 'Ho letto e accetto la',
    'Download recommended checkpoint': 'Scarica checkpoint consigliato',
    'Default OpenAI image model': 'Modello immagini OpenAI predefinito',
    'OpenAI image-model catalog': 'Catalogo modelli immagini OpenAI',
    'One model ID per line. The selected ID is sent on each image request.':
      'Un ID modello per riga. L’ID selezionato viene inviato con ogni richiesta di immagine.',
    'No silent cloud fallback.': 'Nessun passaggio silenzioso al cloud.',
    'Local endpoints are restricted to this computer. API keys stay in the ignored':
      'Gli endpoint locali sono limitati a questo computer. Le chiavi API restano nella cartella ignorata',
    'folder and are never returned to the browser. Before a remote task, the Manager asks for consent again.':
      'e non vengono mai restituite al browser. Prima di un’attività remota il Manager chiede nuovamente il consenso.',
    'Save provider & model library': 'Salva provider e libreria modelli',
    'Save choices and continue': 'Salva scelte e continua',
    'All generated content opens as an editable draft.':
      'Ogni contenuto generato viene aperto come bozza modificabile.',
    'AI choices saved locally.': 'Scelte AI salvate in locale.',
    'Setup and publishing': 'Configurazione e pubblicazione',
    '1 · Preparation': '1 · Preparazione',
    'Prepare the project': 'Prepara il progetto',
    'Dependencies are installed. You can preview or validate your Companion.':
      'Le dipendenze sono installate. Puoi vedere l’anteprima o convalidare il Companion.',
    'Dependencies are missing. Prepare them once before previewing or publishing.':
      'Mancano le dipendenze. Preparale una volta prima dell’anteprima o della pubblicazione.',
    'Prepare automatically': 'Prepara automaticamente',
    'Reinstall dependencies': 'Reinstalla dipendenze',
    Ready: 'Pronto',
    'Not ready': 'Non pronto',
    '2 · Preview': '2 · Anteprima',
    'Open your Companion': 'Apri il tuo Companion',
    'Launch the local site with the campaign data you just entered.':
      'Avvia il sito locale con i dati della campagna appena inseriti.',
    'Launch site': 'Avvia sito',
    'Not started': 'Non avviato',
    '3 · Validation': '3 · Convalida',
    'Check before publishing': 'Controlla prima di pubblicare',
    'The production build catches invalid data or components before you push to GitHub.':
      'La build di produzione rileva dati o componenti non validi prima della pubblicazione.',
    'Check and build site': 'Controlla e crea il sito',
    'Not run': 'Non eseguita',
    '4 · Publishing': '4 · Pubblicazione',
    'Choose how the archive reaches the realm': 'Scegli come portare l’archivio nel regno',
    'GitHub Pages remains available through the included workflow. If your hosting provides FTP, configure it once and publish directly from this computer without GitHub Actions.':
      'GitHub Pages resta disponibile tramite il workflow incluso. Se il tuo hosting offre FTP, configuralo una volta e pubblica direttamente da questo computer senza GitHub Actions.',
    'Open the publishing guide': 'Apri la guida alla pubblicazione',
    'Direct hosting · FTP / FTPS': 'Hosting diretto · FTP / FTPS',
    'Publish from Campaign Manager': 'Pubblica dal Gestore campagne',
    Protocol: 'Protocollo',
    'FTPS · encrypted (recommended)': 'FTPS · cifrato (consigliato)',
    'FTP · unencrypted': 'FTP · non cifrato',
    Port: 'Porta',
    'Remote folder': 'Cartella remota',
    Username: 'Nome utente',
    'Hosting password': 'Password hosting',
    'I understand that plain FTP sends credentials and files without encryption. This is required only when FTP is selected instead of FTPS.':
      'Comprendo che il semplice FTP invia credenziali e file senza cifratura. La conferma è richiesta solo selezionando FTP invece di FTPS.',
    'Save destination': 'Salva destinazione',
    'Test connection': 'Prova connessione',
    'Build & publish now': 'Crea e pubblica ora',
    Configured: 'Configurato',
    'Not configured': 'Non configurato',
    'Credentials stay in the Git-ignored': 'Le credenziali restano nella cartella ignorata da Git',
    'folder and are never returned to the browser.': 'e non vengono mai restituite al browser.',
    'Publishing destination saved locally.': 'Destinazione di pubblicazione salvata in locale.',
    'Production build and upload started.': 'Build di produzione e caricamento avviati.',
    'Turn notes into a reviewable draft': 'Trasforma gli appunti in una bozza revisionabile',
    'Choose the engine for each job. Nothing is saved until you review and choose Save.':
      'Scegli il motore per ogni attività. Nulla viene salvato finché non controlli e selezioni Salva.',
    'Prose writer': 'Autore della prosa',
    'Visual prompt writer': 'Autore dei prompt visivi',
    'Image renderer': 'Generatore di immagini',
    'Process notes': 'Elabora appunti',
    'Process notes with images': 'Elabora appunti con immagini',
    'Draft ready for the Game Master': 'Bozza pronta per il Dungeon Master',
    'Place the illustrations in the chronicle': 'Posiziona le illustrazioni nella cronaca',
    'Insert position': 'Posizione di inserimento',
    Caption: 'Didascalia',
    'Accessibility text': 'Testo accessibile',
    'Writing and illustrating…': 'Scrittura e illustrazione…',
    'Writing draft…': 'Scrittura della bozza…',
    'Editable draft created. Review it before saving.':
      'Bozza modificabile creata. Controllala prima di salvare.',
    'Saved. Your Companion is up to date.': 'Salvato. Il tuo Companion è aggiornato.',
  };

  const textMemory = new WeakMap();
  const attributeMemory = new WeakMap();
  let language =
    localStorage.getItem(STORAGE_KEY) || (navigator.language.startsWith('it') ? 'it' : 'en');
  let pending = false;

  function translateCore(source) {
    if (language !== 'it') return source;
    if (it[source]) return it[source];
    let match = source.match(/^(Characters|Sessions|Locations|NPCs) · (\d+)$/);
    if (match) return `${it[match[1]] || match[1]} · ${match[2]}`;
    match = source.match(/^Suggested for this machine: (.+)\.$/);
    if (match) return `Suggerito per questo computer: ${match[1]}.`;
    match = source.match(/^After scene (\d+) · (.+)$/);
    if (match) return `Dopo la scena ${match[1]} · ${match[2]}`;
    match = source.match(/^(\d+) logical cores$/);
    if (match) return `${match[1]} core logici`;
    match = source.match(/^(\d+(?:\.\d+)?) GB currently free$/);
    if (match) return `${match[1]} GB attualmente liberi`;
    match = source.match(/^(Local|Remote) · (.+)$/);
    if (match) return `${match[1] === 'Local' ? 'Locale' : 'Remoto'} · ${match[2]}`;
    match = source.match(/^Level (\d+)$/);
    if (match) return `Livello ${match[1]}`;
    match = source.match(/^(.+) · (English|Italian) \(([^)]+)\)$/);
    if (match)
      return `${it[match[1]] || match[1]} · ${match[2] === 'Italian' ? 'Italiano' : 'English'} (${match[3]})`;
    match = source.match(/^(English|Italian) \(([^)]+)\)$/);
    if (match) return `${match[1] === 'Italian' ? 'Italiano' : 'English'} (${match[2]})`;
    return source;
  }

  function translateValue(value) {
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    const end = trailing.length ? value.length - trailing.length : value.length;
    return `${leading}${translateCore(value.slice(leading.length, end))}${trailing}`;
  }

  function translateTree(root = document.body) {
    document.documentElement.lang = language;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return ['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      if (!textMemory.has(node)) textMemory.set(node, node.nodeValue);
      const next = translateValue(textMemory.get(node));
      if (node.nodeValue !== next) node.nodeValue = next;
    }
    for (const element of root.querySelectorAll('[placeholder], [title], [aria-label]')) {
      if (!attributeMemory.has(element)) attributeMemory.set(element, new Map());
      const memory = attributeMemory.get(element);
      for (const name of ['placeholder', 'title', 'aria-label']) {
        if (!element.hasAttribute(name)) continue;
        if (!memory.has(name)) memory.set(name, element.getAttribute(name));
        const next = translateCore(memory.get(name));
        if (element.getAttribute(name) !== next) element.setAttribute(name, next);
      }
    }
    const selector = document.querySelector('#ui-language');
    if (selector) selector.value = language;
  }

  function schedule() {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      translateTree();
    });
  }

  function setLanguage(next) {
    language = next === 'it' ? 'it' : 'en';
    localStorage.setItem(STORAGE_KEY, language);
    translateTree();
  }

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  document.addEventListener('change', (event) => {
    if (event.target.id === 'ui-language') setLanguage(event.target.value);
  });
  window.managerI18n = {
    get language() {
      return language;
    },
    setLanguage,
    translate: translateCore,
    translateTree,
  };
  schedule();
})();
