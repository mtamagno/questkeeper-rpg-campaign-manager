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

## The everyday loop

1. **Choose or create a campaign.** Set its language, premise and visual identity.
2. **Add people and places.** Create characters, NPCs and locations manually or
   start from an AI-assisted import.
3. **Record a session.** Paste notes, attach images or use Discord Session Scribe.
4. **Review every draft.** Correct prose, fields, image placement and spoilers.
5. **Preview and publish.** Build the real Companion, inspect it, then release it.

Use the **Interface** selector to switch Manager instructions between English
and Italian. Campaigns may use any configured language codes.

## Campaigns, characters and NPCs

Forms manage names, biographies, public/private details, images, statistics,
relationships and manifests. Uploaded PNG, JPEG and WebP files are copied into
the correct campaign folder automatically.

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

Open **AI setup** from the sidebar at any time—not only during installation.
The hardware scan recommends practical choices based on CPU, RAM and detected
graphics memory.

| Need                            | Local option         | Remote option        |
| ------------------------------- | -------------------- | -------------------- |
| Prose and structured extraction | Ollama               | OpenAI API           |
| Image generation                | ComfyUI              | OpenAI API           |
| Manual work                     | No provider required | No provider required |

You can discover installed models, add custom model IDs, change defaults and
test providers. API keys stay in an ignored local configuration file and are
never returned to the browser after saving. Remote tasks require explicit
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

Use **Check and build site** before publishing. Errors identify malformed or
missing content; automatic backups make edits recoverable. **Launch site** opens
the real local Companion so you can check mobile layout, links, spoilers and
image crops before release.

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
- Back up or commit campaign files before major edits and updates.

---

**Next:** [See the player experience →](COMPANION-GUIDE.md) ·
[Install QuestKeeper](INSTALLATION-GUIDE.md) ·
[Return to the README](../README.md)
