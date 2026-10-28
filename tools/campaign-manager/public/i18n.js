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
    'Local compendia': 'Compendi locali',
    'Private rules & notes': 'Regole e appunti privati',
    'Your local compendia': 'I tuoi compendi locali',
    'Create or import versioned packages without changing bundled rules. Local material stays on this device and sharing exports exclude it by default.':
      'Crea o importa pacchetti versionati senza modificare le regole incluse. Il materiale locale resta su questo dispositivo ed Ã¨ escluso dalle esportazioni di condivisione per impostazione predefinita.',
    'New package': 'Nuovo pacchetto',
    'Preview import': 'Anteprima importazione',
    'Private by default': 'Privato per impostazione predefinita',
    'QuestKeeper stores this package in protected user data. Publication and redistribution rights are never inferred from a title, game or source.':
      'QuestKeeper conserva questo pacchetto nei dati utente protetti. I diritti di pubblicazione e redistribuzione non vengono mai dedotti da titolo, gioco o fonte.',
    'Package identity': 'IdentitÃ  del pacchetto',
    'Stable namespace': 'Namespace stabile',
    Version: 'Versione',
    'Owner / author': 'Proprietario / autore',
    Languages: 'Lingue',
    'Source and ruleset': 'Fonte e sistema di gioco',
    'Source name': 'Nome della fonte',
    'Source URL or local URI': 'URL della fonte o URI locale',
    'Game system ID': 'ID del sistema di gioco',
    'System / edition': 'Sistema / edizione',
    'Sharing permission': 'Permesso di condivisione',
    'Package visibility': 'VisibilitÃ  del pacchetto',
    'License identifier': 'Identificatore licenza',
    'License URL or local URI': 'URL della licenza o URI locale',
    'Required attribution': 'Attribuzione richiesta',
    'Permitted transformations': 'Trasformazioni consentite',
    Entries: 'Voci',
    'Package entries': 'Voci del pacchetto',
    'Add entry': 'Aggiungi voce',
    'Stable entry ID': 'ID stabile della voce',
    Type: 'Tipo',
    'Qualified references': 'Riferimenti qualificati',
    'Explicit override target': 'Destinazione override esplicita',
    'Other language values': 'Valori nelle altre lingue',
    'Installed packages': 'Pacchetti installati',
    'No local packages yet': 'Nessun pacchetto locale',
    'Create personal rules or preview a package before importing it.':
      'Crea regole personali o visualizza lâ€™anteprima di un pacchetto prima di importarlo.',
    'Resolved search': 'Ricerca risolta',
    'Search names, types or qualified IDs': 'Cerca nomi, tipi o ID qualificati',
    'Import preview Â· nothing written yet': 'Anteprima importazione Â· nulla Ã¨ stato scritto',
    Conflicts: 'Conflitti',
    'Invalid links': 'Collegamenti non validi',
    'Validation errors': 'Errori di convalida',
    'References to review': 'Riferimenti da controllare',
    'Import reviewed package': 'Importa pacchetto verificato',
    'AI setup': 'Configurazione AI',
    'Choose setup': 'Scegli configurazione',
    'Remind me later': 'Ricordamelo più tardi',
    'Manual mode': 'Modalità manuale',
    'Draft saved': 'Bozza salvata',
    'Needs attention': 'Richiede attenzione',
    'Choose how you create': 'Scegli come creare',
    'Optional tools, never a gate': 'Strumenti opzionali, mai un ostacolo',
    'How should QuestKeeper help?': 'Come dovrebbe aiutarti QuestKeeper?',
    'Campaigns, characters and sessions always work by hand. Choose AI now, keep everything manual, or decide another day.':
      'Campagne, personaggi e sessioni funzionano sempre anche manualmente. Configura ora l’AI, mantieni tutto manuale oppure decidi un altro giorno.',
    'Guided setup': 'Configurazione guidata',
    'Configure now': 'Configura ora',
    'Choose local or remote providers and a model for each task. Nothing runs or leaves this computer without your action.':
      'Scegli provider locali o remoti e un modello per ogni attività. Nulla viene eseguito o lascia questo computer senza una tua azione.',
    'No AI required': 'Nessuna AI necessaria',
    'Use manual mode': 'Usa la modalità manuale',
    'Write and edit everything yourself. AI setup stays available here if you change your mind later.':
      'Scrivi e modifica tutto personalmente. La configurazione AI resterà disponibile qui se cambierai idea.',
    'Decide later': 'Decidi più tardi',
    'Continue with the Campaign Manager now. QuestKeeper remembers this choice and will not redirect you after saves.':
      'Continua ora con il Gestore campagne. QuestKeeper ricorderà la scelta e non ti reindirizzerà dopo i salvataggi.',
    'Save draft': 'Salva bozza',
    'Reset setup choice': 'Reimposta scelta iniziale',
    'AI setup draft saved locally.': 'Bozza della configurazione AI salvata in locale.',
    'Manual authoring selected. AI remains optional.':
      'Creazione manuale selezionata. L’AI resta opzionale.',
    'AI setup postponed. QuestKeeper will not interrupt your work.':
      'Configurazione AI rimandata. QuestKeeper non interromperà il tuo lavoro.',
    'AI setup choice reset.': 'Scelta della configurazione AI reimpostata.',
    'Discord Session Scribe': 'Trascrittore Discord',
    'Preview & publish': 'Anteprima e pubblicazione',
    'Storage & recovery': 'Archivio e recupero',
    'Protected table memories stay separate from replaceable app and runtime files.':
      'I ricordi protetti del tavolo restano separati dai file sostituibili dell app e del runtime.',
    'Back up now': 'Crea backup ora',
    'Export all campaigns': 'Esporta tutte le campagne',
    'Active Node.js': 'Node.js attivo',
    Application: 'Applicazione',
    'Replaceable app files': 'File sostituibili dell applicazione',
    'Node runtime': 'Runtime Node',
    'Replaceable private runtime': 'Runtime privato sostituibile',
    'Campaigns & media': 'Campagne e media',
    'Protected user data': 'Dati utente protetti',
    Configuration: 'Configurazione',
    'Protected settings & secrets': 'Impostazioni e segreti protetti',
    Transcripts: 'Trascrizioni',
    'Protected session notes': 'Appunti di sessione protetti',
    Backups: 'Backup',
    'Protected recovery copies': 'Copie di recupero protette',
    Logs: 'Registri',
    'Diagnostic state': 'Stato diagnostico',
    Cache: 'Cache',
    'Replaceable generated files': 'File generati sostituibili',
    'Copy path': 'Copia percorso',
    'Open folder': 'Apri cartella',
    'Not available': 'Non disponibile',
    'Paths never contain or reveal saved API keys, Discord tokens or publishing passwords.':
      'I percorsi non contengono e non rivelano chiavi API, token Discord o password di pubblicazione.',
    'Credentials stay in the protected local configuration folder and are never returned to the browser.':
      'Le credenziali restano nella cartella locale protetta e non vengono mai restituite al browser.',
    'Close campaign list': 'Chiudi elenco campagne',
    'Open campaign list': 'Apri elenco campagne',
    'Campaign manager': 'Gestore campagne',
    'Your adventure archive': 'Il tuo archivio di avventure',
    'Campaign Library': 'Biblioteca campagne',
    'All your adventures': 'Tutte le tue avventure',
    'Choose your table': 'Scegli il tuo tavolo',
    'Your campaign library': 'La tua biblioteca di campagne',
    'Open a chronicle or manage it without losing your place in the archive.':
      'Apri una cronaca o gestiscila senza perdere il tuo posto nell’archivio.',
    'New campaign': 'Nuova campagna',
    'Open campaign': 'Apri campagna',
    'Edit details': 'Modifica dettagli',
    'Download backup': 'Scarica backup',
    'No matching campaigns': 'Nessuna campagna corrispondente',
    'Try another search or create a new adventure.':
      'Prova un’altra ricerca o crea una nuova avventura.',
    'Open Companion': 'Apri Companion',
    'Stop Companion': 'Arresta Companion',
    'Close QuestKeeper': 'Chiudi QuestKeeper',
    'Local services': 'Servizi locali',
    'What would you like to close?': 'Cosa vuoi chiudere?',
    'Keep the Campaign Manager open.': 'Mantieni aperto il Gestore campagne.',
    'Quit Manager': 'Chiudi Gestore',
    'Leave the Companion running.': 'Lascia il Companion in esecuzione.',
    'Stop all local services': 'Arresta tutti i servizi locali',
    'Close Manager, Companion and every service started here.':
      'Chiudi Gestore, Companion e ogni servizio avviato da qui.',
    'Stop the local Companion? The Campaign Manager will remain open.':
      'Arrestare il Companion locale? Il Gestore campagne resterà aperto.',
    'Stop all local QuestKeeper services? Manager, Companion and every service started here will close.':
      'Arrestare tutti i servizi locali di QuestKeeper? Gestore, Companion e ogni servizio avviato da qui verranno chiusi.',
    'Quit only the Campaign Manager? The local Companion will keep running until you stop it separately.':
      'Chiudere solo il Gestore campagne? Il Companion locale continuerà a funzionare finché non lo arresterai separatamente.',
    'Closing Manager…': 'Chiusura Gestore…',
    'Campaign Manager is closed': 'Il Gestore campagne è chiuso',
    'The Campaign Manager has stopped. Your local Companion is still available.':
      'Il Gestore campagne è stato chiuso. Il Companion locale è ancora disponibile.',
    'The local Companion is stopping.': 'Il Companion locale si sta arrestando.',
    'Start Companion': 'Avvia Companion',
    'Starting…': 'Avvio…',
    Retry: 'Riprova',
    Ready: 'Pronto',
    'Preparation required': 'Preparazione necessaria',
    'Prepare the project first.': 'Prepara prima il progetto.',
    'Waiting for the Companion to become ready…': 'Attendo che il Companion sia pronto…',
    'Port 4200 is used by another application.': 'La porta 4200 è usata da un’altra applicazione.',
    'Startup failed. Review the preview log and try again.':
      'Avvio non riuscito. Controlla il registro dell’anteprima e riprova.',
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
    Heroic: 'Eroica',
    Gothic: 'Gotica',
    Neutral: 'Neutrale',
    'Gold and midnight': 'Oro e blu notte',
    'Burgundy and fog': 'Bordeaux e nebbia',
    'Slate and silver': 'Ardesia e argento',
    'Previewed here and applied when the Companion tab reloads or regains focus.':
      'Mostrata qui e applicata quando la scheda del Companion si ricarica o torna in primo piano.',
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
    'Personal notebook': 'Taccuino personale',
    'Optional illustrated journal owned by this character.':
      'Diario illustrato opzionale appartenente a questo personaggio.',
    'Give this character a notebook': 'Assegna un taccuino a questo personaggio',
    'Notebook title': 'Titolo del taccuino',
    'Short description': 'Descrizione breve',
    'Notebook password': 'Password del taccuino',
    'Character-specific art direction': 'Direzione artistica specifica del personaggio',
    'Describe this owner’s medium, palette, handwriting, recurring symbols and how mood should alter the pages.':
      'Descrivi tecnica, palette, grafia, simboli ricorrenti e come l’umore del proprietario deve trasformare le pagine.',
    'Front cover': 'Copertina anteriore',
    'Back cover': 'Copertina posteriore',
    'Cover image': 'Immagine di copertina',
    'Portrait 2:3. Front spine on the left; back spine on the right.':
      'Formato verticale 2:3. Dorso a sinistra sul fronte e a destra sul retro.',
    'Accessibility text': 'Testo accessibile',
    'Interior spreads': 'Aperture interne',
    'Each image is one complete landscape opening.':
      'Ogni immagine raffigura un’apertura orizzontale completa.',
    'Add page': 'Aggiungi pagina',
    'Remove page': 'Rimuovi pagina',
    'Page ID': 'ID pagina',
    'Stable identifier. It must be unique inside this notebook.':
      'Identificatore stabile. Deve essere univoco nel taccuino.',
    Mood: 'Atmosfera',
    'Page title': 'Titolo della pagina',
    'Era / chapter': 'Periodo / capitolo',
    'Owner reflection': 'Pensiero del proprietario',
    'Illustrated spread': 'Apertura illustrata',
    'Landscape 3:2 image containing the complete two-page spread.':
      'Immagine orizzontale 3:2 che contiene l’intera apertura di due pagine.',
    'Create an editable notebook with AI': 'Crea un taccuino modificabile con l’AI',
    'The result remains a draft. Nothing replaces this form until you review and save it.':
      'Il risultato resta una bozza. Nulla viene salvato finché non lo controlli e confermi.',
    'Notebook subject': 'Contenuto del taccuino',
    'Describe the memories, events or themes the pages may contain. Include private facts only if you intend to send them to the selected provider.':
      'Descrivi ricordi, eventi o temi delle pagine. Inserisci fatti privati solo se vuoi inviarli al provider scelto.',
    'Number of spreads': 'Numero di aperture',
    'Draft language': 'Lingua della bozza',
    'Prompt writer': 'Autore dei prompt',
    'Plans covers, page content and placement.': 'Progetta copertine, contenuti e composizione.',
    'Image renderer': 'Generatore di immagini',
    'Renders the cover and complete spreads.': 'Genera copertine e aperture complete.',
    'Generate notebook draft with images': 'Genera la bozza illustrata del taccuino',
    'Draft ready for review': 'Bozza pronta per la revisione',
    'Planning and illustrating…': 'Progettazione e illustrazione…',
    'Notebook draft created. Review every page before saving.':
      'Bozza del taccuino creata. Controlla ogni pagina prima di salvare.',
    'Describe what this notebook should remember first.':
      'Descrivi prima ciò che il taccuino deve ricordare.',
    'Add character-specific art direction before generating the notebook.':
      'Aggiungi la direzione artistica del personaggio prima di generare il taccuino.',
    'Current spread · upload a file only to replace it.':
      'Apertura attuale · carica un file solo per sostituirla.',
    'I consent to sending this character context and notebook brief to any selected engine labelled':
      'Acconsento a inviare il contesto del personaggio e il brief del taccuino a ogni motore selezionato indicato come',
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
    'Campaign content languages': 'Lingue dei contenuti della campagna',
    'Search common languages by name or code. Regional variants remain separate.':
      'Cerca le lingue comuni per nome o codice. Le varianti regionali restano distinte.',
    'Find a language': 'Trova una lingua',
    'Add language': 'Aggiungi lingua',
    'Default language': 'Lingua predefinita',
    'Add a custom BCP-47 tag': 'Aggiungi un tag BCP-47 personalizzato',
    'Custom language tag': 'Tag lingua personalizzato',
    'Add custom language': 'Aggiungi lingua personalizzata',
    'Use this for a valid language or regional variant not listed above.':
      'Usalo per una lingua valida o una variante regionale non presente nell’elenco.',
    'Choose a language from the list, or use the custom language path.':
      'Scegli una lingua dall’elenco oppure usa il percorso per una lingua personalizzata.',
    'Enter a valid BCP-47 language tag, such as sr-Latn or en-GB.':
      'Inserisci un tag lingua BCP-47 valido, come sr-Latn o en-GB.',
    'That language is already selected.': 'Questa lingua è già selezionata.',
    'Language added. Its translation fields are ready below.':
      'Lingua aggiunta. I campi di traduzione sono già disponibili qui sotto.',
    'A campaign needs at least one language.': 'Una campagna richiede almeno una lingua.',
    'This language already contains campaign text. It will be hidden from the campaign but preserved in the data. Continue?':
      'Questa lingua contiene già testi della campagna. Verrà nascosta dalla campagna ma conservata nei dati. Continuare?',
    'Language removed from the campaign list; its existing text is preserved.':
      'Lingua rimossa dall’elenco della campagna; i testi esistenti sono stati conservati.',
    'Language removed.': 'Lingua rimossa.',
    'Default language updated. Required fields changed below.':
      'Lingua predefinita aggiornata. I campi obbligatori qui sotto sono cambiati.',
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
    Sex: 'Sesso',
    'Sex / gender': 'Sesso / genere',
    Pronouns: 'Pronomi',
    'Custom terminology': 'Terminologia personalizzata',
    'Used by the Generic / custom profile. Leave a label blank to hide that identity or presentation field.':
      'Usata dal profilo generico / personalizzato. Lascia vuota unâ€™etichetta per nascondere quel campo identitario o di presentazione.',
    'Personality traits': 'Tratti della personalità',
    Ideals: 'Ideali',
    Bonds: 'Legami',
    Flaws: 'Difetti',
    'Known history': 'Storia conosciuta',
    'Interests and habits': 'Interessi e abitudini',
    'Story highlights': 'Dettagli narrativi',
    'Optional details that make the public profile personal without turning it into a statistics dashboard.':
      'Dettagli opzionali che rendono personale il profilo pubblico senza trasformarlo in un pannello di statistiche.',
    'Quick facts': 'Fatti rapidi',
    'Short non-mechanical details for the profile opening.':
      'Brevi dettagli non meccanici per lâ€™apertura del profilo.',
    'Signature items': 'Oggetti significativi',
    'Meaningful possessions, separate from mechanical inventory.':
      'Oggetti importanti, separati dallâ€™inventario meccanico.',
    'Favourite moments': 'Momenti preferiti',
    'Subjective memories that always point to a public source.':
      'Ricordi soggettivi che rimandano sempre a una fonte pubblica.',
    Add: 'Aggiungi',
    Label: 'Etichetta',
    Value: 'Valore',
    'Item name': 'Nome dellâ€™oggetto',
    'Moment title': 'Titolo del momento',
    'Why it matters': 'PerchÃ© Ã¨ importante',
    'Public story source': 'Fonte pubblica della storia',
    'No linked source': 'Nessuna fonte collegata',
    'Personal chapter': 'Capitolo personale',
    Notebook: 'Taccuino',
    'Session diary': 'Diario delle sessioni',
    'Character quote': 'Citazione del personaggio',
    'Campaign chronicle': 'Cronaca della campagna',
    'Source ID': 'ID della fonte',
    'Optional chapter, notebook page, session or chronicle ID.':
      'ID opzionale del capitolo, della pagina del taccuino, della sessione o della cronaca.',
    'Source link label': 'Etichetta del link alla fonte',
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
    'Independent task roles': 'Ruoli AI indipendenti',
    'Choose the right engine for each job': 'Scegli il motore giusto per ogni attività',
    'Only models whose saved capabilities match a role are offered. QuestKeeper never changes provider silently.':
      'Sono proposti solo i modelli le cui capacità salvate corrispondono al ruolo. QuestKeeper non cambia mai provider di nascosto.',
    'Prose & structured drafts': 'Prosa e bozze strutturate',
    'Session prose and structured campaign drafts.':
      'Prosa delle sessioni e bozze strutturate della campagna.',
    'Sheet extraction & vision': 'Estrazione schede e visione',
    'Character and NPC sheet images.': 'Immagini delle schede di personaggi e PNG.',
    'Image-prompt planning': 'Pianificazione dei prompt immagine',
    'Plans illustrations without rendering them.': 'Pianifica le illustrazioni senza generarle.',
    'Image generation': 'Generazione immagini',
    'Renders approved prompts.': 'Genera i prompt approvati.',
    'Local chronicler': 'Cronista locale',
    'Local illustrator': 'Illustratore locale',
    'Remote provider library': 'Libreria di provider remoti',
    'Bring the accounts you already use': 'Collega gli account che usi già',
    'Keys stay in the ignored local configuration and are never returned to this page. Capability tags determine which task selectors can offer each model.':
      'Le chiavi restano nella configurazione locale ignorata da Git e non vengono mai restituite a questa pagina. Le capacità determinano per quali attività può essere proposto ciascun modello.',
    'Register only models and capabilities verified for your account. Unknown capabilities remain unavailable to task selectors.':
      'Registra solo modelli e capacità verificati per il tuo account. Le capacità sconosciute restano escluse dalle attività.',
    'API base URL': 'URL base API',
    'API key': 'Chiave API',
    'Paste a provider key': 'Incolla una chiave del provider',
    'Remove the saved key': 'Rimuovi la chiave salvata',
    'Model catalog and capabilities': 'Catalogo modelli e capacità',
    'One per line:': 'Uno per riga:',
    'API docs ↗': 'Documentazione API ↗',
    'Privacy ↗': 'Privacy ↗',
    'Pricing ↗': 'Prezzi ↗',
    'Discover models': 'Rileva modelli',
    'Only configured models with structured output and vision appear here. Public URL access also requires web capability.':
      'Qui compaiono solo modelli configurati con output strutturato e visione. Gli URL pubblici richiedono anche la capacità web.',
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
    'Open now': 'Apri ora',
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
    'Open my character': 'Apri il mio personaggio',
    'My character': 'Il mio personaggio',
    'My character · change': 'Il mio personaggio · cambia',
    'This is my character': 'Questo è il mio personaggio',
    'Choose my character': 'Scegli il mio personaggio',
    'Choose from the party': 'Scegli dal gruppo',
    'Quick return': 'Accesso rapido',
    'The Manager will open this profile directly whenever the Companion is ready.':
      'Il Gestore aprirà direttamente questo profilo ogni volta che il Companion è pronto.',
    'Choose your character once from the Characters tab to make every return immediate.':
      'Scegli una volta il tuo personaggio dalla scheda Personaggi per rendere immediato ogni ritorno.',
    'My character saved on this device.':
      'Il mio personaggio è stato salvato su questo dispositivo.',
    'My character shortcut cleared.': 'Accesso rapido al mio personaggio rimosso.',
    'Start the Companion first.': 'Avvia prima il Companion.',
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
    match = source.match(/^Add the (.+) API key in AI setup first\.$/);
    if (match) return `Aggiungi prima la chiave API ${match[1]} nella configurazione AI.`;
    match = source.match(/^The selected model does not support the (.+) role\.$/);
    if (match) return `Il modello selezionato non supporta il ruolo ${match[1]}.`;
    match = source.match(/^Choose a compatible (.+) model for this task\.$/);
    if (match) return `Scegli un modello ${match[1]} compatibile per questa attività.`;
    match = source.match(/^(.+) request failed \((\d+)\)(.*)$/);
    if (match) return `Richiesta ${match[1]} non riuscita (${match[2]})${match[3]}`;
    match = source.match(/^Level (\d+)$/);
    if (match) return `Livello ${match[1]}`;
    match = source.match(/^Spread (\d+)$/);
    if (match) return `Apertura ${match[1]}`;
    match = source.match(
      /^Saved\. The (heroic|gothic|neutral) palette will appear when the Companion reloads or regains focus\.$/,
    );
    if (match) {
      const names = { heroic: 'eroica', gothic: 'gotica', neutral: 'neutrale' };
      return `Salvato. La palette ${names[match[1]]} apparirà quando il Companion si ricarica o torna in primo piano.`;
    }
    match = source.match(/^(.+) · (.+) \(([^)]+)\)$/);
    if (match)
      return `${it[match[1]] || match[1]} · ${match[2] === 'Italian' ? 'Italiano' : match[2] === 'English' ? 'Inglese' : match[2]} (${match[3]})`;
    match = source.match(/^(English|Italian|inglese|italiano) \(([^)]+)\)$/i);
    if (match)
      return `${match[1].toLowerCase().startsWith('ital') ? 'Italiano' : 'Inglese'} (${match[2]})`;
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
