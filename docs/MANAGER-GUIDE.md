# Campaign Manager Guide

<table>
  <tr>
    <td width="50%" align="center"><img src="images/companions/brannik-guardian.webp" alt="Brannik the dwarven guardian protects the campaign archive" height="340"></td>
    <td width="50%" align="center"><img src="images/companions/nyx-storyweaver.webp" alt="Nyx the bard weaves session memories into a story" height="340"></td>
  </tr>
</table>

<p align="center"><em>Brannik guards the archive. Nyx helps turn table notes into a tale worth keeping.</em></p>

Campaign Manager is the local control room for QuestKeeper. It provides guided
forms for campaign files, automatic indexes and backups, validation, previews
and publishing—without asking a GM to hand-edit JSON.

Open the [interactive Manager demo](https://mtamagno.github.io/questkeeper-rpg-campaign-manager/manager-demo/)
to explore the workflow safely in a browser.

## Local compendia

Open **Local compendia** from the sidebar to manage personal rules, homebrew and
table notes without editing JSON folders. New packages are private by default.
Imports always show counts, conflicts, broken references and overwrite intent
before writing; exporting private material requires an explicit warning. See
[Local custom compendia](LOCAL-COMPENDIA.md) for the package and privacy contract.

## The everyday loop

1. **Choose or create a campaign.** Set its language, premise and visual identity.
2. **Add people and places.** Create characters, NPCs and locations manually or
   start from an AI-assisted import.
3. **Record a session.** Paste notes, attach images or use Discord Session Scribe.
4. **Review every draft.** Correct prose, fields, image placement and spoilers.
5. **Preview and publish.** Build the real Companion, inspect it, then release it.

Use the **Interface** selector to switch Manager instructions between English
and Italian. Campaigns may use any configured language codes.

When you finish, choose **Quit / Esci** in the header. The confirmation makes
clear that local previews and background jobs started by this Manager will
stop, while an already published Companion remains online. Wait for the
safe-to-close screen before closing the browser tab.

## Campaigns, characters and NPCs

Forms manage names, biographies, public/private details, images, statistics,
relationships and manifests. Uploaded PNG, JPEG and WebP files are copied into
the protected campaign folder automatically. Installed releases keep that
folder outside the replaceable application and runtime; see
[Data lifecycle](DATA-LIFECYCLE.md).

Author a bond once in the relationship editor. Character profiles, NPC dossiers,
detail pages and the network map all derive from that same record. Do not repeat
relationship prose inside an NPC biography. For NPC feelings, record only what
published events let the party observe, hear or infer; AI suggestions follow the
same rule and remain editable drafts.

When creating or editing a campaign, choose **Heroic**, **Gothic** or
**Neutral**. The preset updates the Companion's surfaces, accents and focus
colors while preserving readable status colors. Existing campaigns without a
selection keep the Heroic appearance, and the choice can be changed later.

For faster character and NPC entry, choose an assisted import source:

- up to four character-sheet photos or screenshots;
- a public/shared Roll20 print-view URL when the selected remote model supports
  browser access;
- a manual blank form at any time.

Extraction creates an **editable draft** with source evidence. QuestKeeper does
not scrape a private Roll20 sheet through your signed-in browser. Use screenshots
for private sheets and verify names, statistics, equipment and spell choices.

### Story highlights

The character form includes optional lists for **Quick facts**, **Signature
items** and **Favourite moments**. Add only small public details that help a
player recognise the person behind the sheet. Signature items explain meaning
rather than repeating inventory; every favourite moment must select a public
source and provide a readable link label. IDs are generated automatically.

Assisted imports follow the same form. They may propose a highlight only when
the uploaded or shared source states it, and every proposal remains editable
until you press **Save**.

### Optional character notebooks

Every character editor includes an optional **Personal notebook** panel. Turn
it on only for a character who keeps an in-world journal.

- **Manual:** upload the 2:3 front and back covers, add or remove complete 3:2
  interior spreads, and edit localized titles, eras, reflections, mood and alt
  text. Existing assets remain in place unless you upload replacements.
- **AI-assisted:** write a notebook brief, define that character's visual
  identity, choose the prompt-planning and image-rendering models, then generate
  one to four editable spreads. The draft fills only the selected language, so
  every other campaign language remains clearly available for manual or assisted
  translation. Remote models require explicit consent.

The visual identity belongs to the character, not the campaign: record medium,
palette, handwriting, recurring objects and how the marks react to the owner's
mood. AI output never saves or publishes itself. Review every cover, visible
word, thought, fact and accessibility description, then use the normal
**Save** button.

## Turn notes into a session

The session editor accepts handwritten-note transcriptions, ordinary digital
notes or a local Discord transcript. You can always write the recap manually.

- **Process notes** drafts structured prose and campaign sections.
- **Process notes with images** also plans illustrations and places each one in
  a chosen chronicle scene.

The GM separately chooses:

1. the model that writes prose;
2. the text model that prepares image prompts;
3. the model that renders images.

Captions, accessibility text, prose and placement remain editable before save.
No generated result publishes itself.

## Optional AI setup

On the first run, choose **Configure now**, **Use manual mode** or **Remind me
later**. Manual and deferred choices persist across saves, reloads and Manager
restarts; they never block ordinary authoring. Provider changes can be saved as
a draft, and the sidebar shows whether setup is ready, deferred, manual,
incomplete or needs attention. **Reset setup choice** returns to the three-path
prompt without deleting saved provider details.

Open **AI setup** from the sidebar at any time—not only during installation.
The hardware scan recommends practical choices based on CPU, RAM and detected
graphics memory.

| Need                            | Local option         | Remote option                         |
| ------------------------------- | -------------------- | ------------------------------------- |
| Prose and structured extraction | Ollama               | OpenAI, xAI/Grok or Gemini            |
| Image-prompt planning           | Ollama               | Any configured capable text model     |
| Image generation                | ComfyUI              | Any configured image-capable provider |
| Manual work                     | No provider required | No provider required                  |

You can discover installed models, add custom model IDs, change defaults and
test providers. Prose, sheet extraction, prompt planning and rendering can use
different engines. API keys stay in an ignored local configuration file and
are never returned to the browser after saving. Remote tasks require explicit
consent and may incur provider charges.

See [AI Setup](AI-SETUP.md) for model roles, downloads, licenses and privacy.

## Discord Session Scribe

If the group plays in a Discord voice channel, **Discord Session Scribe** can
prepare, launch, monitor and stop the local transcription bot from the Manager.
It writes a speaker-labelled Markdown transcript and does not retain the audio
recording.

The bot is optional. In-person groups can use paper or any notes app and paste
the result into the same session editor. Always obtain informed consent from
everyone before transcription and follow local law.

Read the [Discord Scribe guide](../discord-transcriber/README.md) before first use.

## Preview, validate and recover

The **Storage & recovery** panel shows the active Node.js executable and the
resolved application, runtime, campaign, configuration, transcript, backup,
log and cache locations. Every path can be copied or opened directly. Use
**Back up now** for a complete local snapshot including media, or **Export all
campaigns** for smaller portable JSON bundles without images. No diagnostic
returns the contents of a saved secret.

### Local runtime and preview reliability

QuestKeeper launches npm through the selected Node runtime's `npm-cli.js`
instead of spawning a Windows `.cmd` shim. This keeps system and private
runtimes reliable when the installation path contains spaces and avoids
`shell: true` command-injection behavior. The same resolver is used for
dependency installation, local preview, production builds and direct
publishing builds.

If process creation fails, the job log identifies the action, runtime path,
safe command display and platform error code, then offers a setup/retry action.
Environment variables, tokens and saved provider or publishing secrets are not
included. Repeated preview clicks reuse the running job, and quitting the
Manager stops the complete preview process tree.

Use **Check and build site** before publishing. Errors identify malformed or
missing content; automatic backups make edits recoverable. **Launch site** opens
the real local Companion so you can check mobile layout, links, spoilers and
image crops before release.

Before every build, QuestKeeper validates protected campaign data and refreshes
a replaceable static-source mirror. A full backup includes the whole campaign
tree and original media; a campaign export remains the smaller portable content
bundle.

Advanced users can inspect the underlying schema in the
[Content Guide](CONTENT-GUIDE.md), but Manager-generated files remain ordinary,
portable project files.

## Publish

Choose either:

- **GitHub Pages**, using the included workflow; or
- **Direct FTPS**, with host, port, remote folder and credentials stored only in
  the ignored local publishing configuration.

Test a destination before the first upload. Plain FTP is available only for
legacy hosts and displays an explicit warning because it does not encrypt
credentials or files. See [Deployment](DEPLOYMENT.md) for full instructions.

## Guardrails worth keeping

- Review facts and statistics extracted by AI.
- Use only original or licensed writing and art.
- Keep API keys and publishing passwords out of campaign data and Git.
- Separate player-safe information from GM-only spoilers.
- Preview the built Companion before every public release.
- Create a full local backup before major edits and updates.

---

**Next:** [See the player experience →](COMPANION-GUIDE.md) ·
[Install QuestKeeper](INSTALLATION-GUIDE.md) ·
[Return to the README](../README.md)
