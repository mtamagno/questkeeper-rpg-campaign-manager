# Campaign Manager

Campaign Manager is the visual, local setup tool included with Campaign
Companion. It lets a group build and maintain its archive without copying
folders or editing JSON manifests.

## Open it

No global packages, database or online account are required. On Windows, the
visual setup can download and verify Node.js 24 automatically.

- Windows: double-click `setup.bat`, review the graphical checklist and choose
  **Prepare QuestKeeper**. Optional desktop shortcuts can reopen either the
  Manager or player Companion later.
- macOS: double-click `setup.command`. On first launch, Control-click the file,
  choose **Open**, then confirm. If needed, run `chmod +x setup.command` once.
- Linux: run `chmod +x setup.sh && ./setup.sh`.
- Any platform: run `npm run manage` from a terminal.

The manager opens at `http://127.0.0.1:4173`. Keep its terminal window open;
closing that window stops the manager. If port 4173 is already occupied, it
automatically tries the next available port up to 4183.

## Typical workflow

1. Select **+** or **Create your first campaign** and fill in the campaign
   details. The ID becomes part of the URL, so use lowercase letters, numbers
   and hyphens.
2. Choose a primary language and any additional language codes (`es`, `de`,
   `ja`, `pt-BR`, and so on). Reopen the campaign editor whenever you add a
   language to fill its translation fields.
3. Open the Characters, NPCs, Sessions or Locations tab and add entries with
   the forms. Uploaded PNG, JPEG and WebP images are copied into the correct
   campaign folder automatically.
4. Open **Setup and publishing** and choose **Prepare automatically** on the
   first run. This installs the project's locked dependencies.
5. Choose **Check and build site**. Fix any problem shown in the log.
6. Choose **Launch site**, then **Open now** to view the real Companion at
   `http://127.0.0.1:4200`.

On the first launch, the Manager also opens **AI setup**. It detects CPU, RAM
and available graphics memory, then recommends optional local prose and image
models. The panel remains available afterward: add API keys, discover local
Ollama and ComfyUI models, maintain custom model catalogs and change defaults
at any time. Nothing is downloaded until you choose a model; manual authoring
remains a first-class option. See the complete
[AI setup guide](../../docs/AI-SETUP.md).

All edits are ordinary files under `src/campaigns/`, so they remain portable
and versionable. The manager itself works before project dependencies are
installed because it uses only Node.js built-ins.

## Session notes and Discord Scribe

Choose **Discord Session Scribe** in the sidebar when your group plays in a
Discord voice channel. After the one-time token configuration, the manager can
prepare, launch, monitor and stop the local transcription bot. Its live log and
output folder are shown on the same screen.

The bot is entirely optional. For an in-person table—or whenever the group
prefers not to transcribe voice—take handwritten notes or use any notes app,
then enter the summary and key events in the **Sessions** tab. Both workflows
produce the same campaign archive. In either case, the session editor can turn
reviewed notes into a fully editable draft with **Process notes**, or add
illustrations with **Process notes with images**. Local Ollama and ComfyUI
providers and an opt-in OpenAI API provider share the same guided setup.
Every processing run exposes separate choices for the prose writer, the text
model that plans visual prompts and the model that renders the images. Before
saving, the Game Master chooses the precise chronicle scene where each image
appears and can edit its caption and accessibility text.

The same review-first workflow can create Characters and NPCs from up to four
sheet photos/screenshots, or from a public/shared Roll20 print-view URL when a
browser-capable remote model is selected. Private Roll20 sheets are never
scraped through the user's signed-in browser: use screenshots for those. Core
statistics, proficiencies, equipment and profile prose remain normal editable
fields after extraction.

The Scribe writes a local Markdown transcript and does not retain an audio
recording. Read the [Discord Scribe guide](../../discord-transcriber/README.md)
before first use, obtain informed consent from every participant and follow
local law.

## Backups and deletion

The **Backup** button downloads campaign text and structured data as a JSON
bundle. Images are deliberately not embedded because they can make backups
very large: copy the campaign's `images/` folder separately. Use **Import
backup** in the sidebar to restore a bundle whose ID is not already present.

Deleting a character, NPC, session or campaign requires confirmation. Files
are moved to `.campaign-manager/trash/` whenever possible instead of being
permanently erased. Locations stored in the shared `maps.json` file are removed
from that file and remain recoverable through Git history or a backup.

## Publish on GitHub Pages or direct hosting

The panel prepares and validates the project locally. To publish, push the
changed files to your GitHub repository and enable **Settings → Pages → GitHub
Actions**. The included workflow builds and deploys the static site. See the
main [README](../../README.md#publish) for details.

If your web host provides FTP access, open **Preview & publish**, configure the
host, remote folder, username and password, then choose **Build & publish
now**. FTPS is the secure default; plain FTP requires an explicit warning
acknowledgement. Credentials stay in the ignored `.campaign-manager/` folder.
See the [deployment guide](../../docs/DEPLOYMENT.md) for the complete flow.

## Troubleshooting

- **The window closes immediately:** open PowerShell or Terminal in the project
  folder and run `npm run manage` to see the error message.
- **`node` is not recognized on Windows:** reopen `setup.bat` and keep automatic
  Node.js installation selected. The installer verifies the official checksum
  before requesting administrator approval.
- **A desktop shortcut stopped working:** move the QuestKeeper folder back or
  rerun setup after moving it to recreate both links.
- **The Companion does not open:** use **Prepare automatically** once, then
  start it again. Only one preview can use port 4200 at a time.
- **A build reports invalid data:** open the affected entry in the manager or
  consult the [content guide](../../docs/CONTENT-GUIDE.md) for advanced fields.

Campaign Manager binds only to localhost and uses a per-run token for changes.
It is an editing convenience, not an authentication system: do not expose its
port to the Internet.
