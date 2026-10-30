# Installation Guide

<p align="center">
  <img src="images/companions/lyra-pathfinder.webp" alt="Lyra the pathfinder points toward the next step" height="360">
</p>

<p align="center"><em>Lyra knows the shortest road from download to game night.</em></p>

QuestKeeper runs on your computer and produces a static campaign website. A
database, cloud account, AI provider and preinstalled Node.js are not required.
On Windows, macOS and Linux, the graphical setup can either prepare a private
**Node.js 26** runtime or reuse a compatible installation already on the device.

Node.js 26 is the supported QuestKeeper runtime and entered upstream Active LTS
on 28 October 2026 with the codename Lithium. The installer always resolves the
newest verified Node.js 26 patch.

> **Looking around first?** Open the
> [live Companion](https://mtamagno.github.io/questkeeper-rpg-campaign-manager/)
> or the [interactive Manager demo](https://mtamagno.github.io/questkeeper-rpg-campaign-manager/manager-demo/).

## 1. Download QuestKeeper

Download the recommended ZIP or TAR.GZ from the
**[latest QuestKeeper release](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/releases/latest)**
and extract the complete versioned folder.

Each release also provides `SHA256SUMS.txt` so you can verify the downloaded
archive. Developers who want the newest unreleased changes can clone the
repository instead:

```bash
git clone https://github.com/mtamagno/questkeeper-rpg-campaign-manager.git
cd questkeeper-rpg-campaign-manager
```

Keep the extracted QuestKeeper folder in the location where you want to use it.
Desktop shortcuts point to that folder, so move it before running setup rather
than afterward.

## 2. Start the guided setup

| Platform            | Recommended release entry                               |
| ------------------- | ------------------------------------------------------- |
| Windows x64         | Double-click `QuestKeeper-Setup.exe`                    |
| macOS Intel         | Control-click **QuestKeeper Setup.app**, then **Open**  |
| macOS Apple Silicon | Control-click **QuestKeeper Setup.app**, then **Open**  |
| Linux x64           | Run `chmod +x questkeeper-setup && ./questkeeper-setup` |
| Source checkout     | Use `setup.bat`, `setup.command` or `setup.sh`          |

The setup opens a bilingual English/Italian page in the default browser. It is
served only on `127.0.0.1` and protected by a random session token. The page
shows each optional action before it runs:

- choose the recommended private Node.js 26 runtime or a compatible detected
  system runtime;
- prepare the project's locked dependencies;
- choose recommended per-user storage or an intentionally portable data folder;
- create separate **QuestKeeper Campaign Manager** and **QuestKeeper
  Companion** desktop launchers;
- open Campaign Manager when setup finishes.

For an existing runtime, QuestKeeper resolves the exact executable and checks
Node.js major version 26, processor architecture and a working npm before it is
offered. The chosen path is recorded in `.questkeeper/runtime-selection.json`
and reused by setup and both launchers. If that executable later disappears or
becomes incompatible, setup explains the fallback and prepares the private
runtime instead.

For the recommended private option, Node.js comes directly from
`https://nodejs.org/dist/`. QuestKeeper reads the official release index,
downloads the archive matching the operating system and processor, and compares
it with the published SHA-256 checksum before extraction into
`.questkeeper/runtime`. It does not make a system-wide installation and does
not need administrator privileges.

Nothing is installed merely by opening the setup: the checklist and **Prepare
QuestKeeper** button make the selected actions explicit. AI tools and models
remain a separate, optional Manager decision.

Setup keeps campaigns, media, transcripts, settings and backups separate from
the replaceable app and private Node runtime. Existing 1.1.4 campaign data is
copied, validated and switched atomically; the original remains available for
rollback. See [Data lifecycle](DATA-LIFECYCLE.md) for platform paths, portable
mode and recovery behavior.

After a successful run, setup shows the protected campaign location and whether
Campaign Manager was launched, then stops its loopback service automatically.
It attempts to close only its own browser tab. When the browser blocks that
action, the finished page remains visible and explicitly says it is safe to
close; deliberately launched QuestKeeper apps keep running.

On its first successful run, setup opens Campaign Manager and guides you through
the first campaign. The Manager normally uses `http://127.0.0.1:4173`; keep its
terminal window open while working.

Use **Quit / Esci** in the Manager header when you finish. After confirmation,
QuestKeeper stops the local Manager and every preview or background job started
by it, then shows a safe-to-close page. The published Companion website is not
affected.

> The first native binaries are not commercially code-signed. Windows may show
> SmartScreen and macOS may show Gatekeeper on the first launch. Confirm that
> the archive came from the official GitHub release, compare its checksum and
> use **More info → Run anyway** on Windows or **Control-click → Open** on
> macOS. Code signing and notarization require maintainer certificates and are
> tracked separately.

## 3. Choose only what you need

The first-run path offers three independent choices:

- **Manual only:** write and upload artwork through the Manager. This is the
  complete product, not a reduced mode.
- **Local AI:** connect Ollama for prose and/or ComfyUI for images. Hardware
  detection provides recommendations, but no model downloads automatically.
- **Remote AI:** add an explicitly chosen OpenAI API key. Each processing task
  still requires confirmation and produces a reviewable draft.

You can skip all AI setup and return to it later from the Manager sidebar. See
[AI setup](AI-SETUP.md) for providers, model roles, privacy and licenses.

## 4. Preview the real Companion

From **Setup & publishing**:

1. Choose **Prepare automatically** on the first run.
2. Choose **Check and build site**.
3. Choose **Launch site**, then **Open now**.

The Manager opens the campaign website locally, normally at
`http://127.0.0.1:4200`.

## 5. Publish when ready

- **GitHub Pages:** push the repository and enable GitHub Actions in the Pages
  settings.
- **Direct FTPS:** enter your hosting destination in **Preview & publish**, test
  the connection, then build and upload from the Manager.
- **Other static hosting:** upload the generated browser folder using your
  host's normal workflow.

Read the [Deployment Guide](DEPLOYMENT.md) before using plain FTP or configuring
Apache/Nginx paths.

## Updating QuestKeeper

Create a full local backup before updating. If you cloned with Git:

```bash
git pull
npm ci
```

Then reopen the Manager and run **Check and build site**. Installed releases
read protected campaign files from the per-user or portable data root and create
`src/campaigns/` only as a replaceable build mirror. Source checkouts retain the
legacy repository layout.

## Quick troubleshooting

| Symptom                                      | Try this                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| The setup does not open a browser            | Copy the local URL shown by the setup into a browser, or rerun the platform binary.                                                   |
| Windows or macOS blocks the first launch     | Verify the release checksum, then use the deliberate first-open flow described above.                                                 |
| Runtime preparation fails                    | Select the private runtime and rerun setup; partial downloads are temporary and the official checksum is checked again.               |
| Setup 1.1.0 stops while creating a shortcut  | Download 1.1.1 and rerun setup; the prepared runtime and dependencies remain usable.                                                  |
| The setup process remains open after setup   | In 1.1.2 or later, choose **Close setup** to terminate its local service and executable.                                              |
| A desktop shortcut stops working             | Return the QuestKeeper folder to its original location or rerun setup to recreate links.                                              |
| Companion shortcut does not open the browser | Check `.questkeeper/logs/companion-launch.log`; the launcher records port conflicts, missing dependencies and startup failures there. |
| An installed Node.js is not offered          | Only working Node.js 26 installations matching the app architecture and containing npm are listed. The private option remains safe.   |
| `node` is not recognized in a terminal       | This is expected when using the private option: its runtime is available to QuestKeeper without changing the system PATH.             |
| Port 4173 is busy                            | QuestKeeper automatically tries ports through 4183; use the URL printed in the terminal.                                              |
| The Companion does not reflect edits         | Run **Check and build site**, then refresh without cache.                                                                             |
| A local model is unavailable                 | Start Ollama or ComfyUI, then use **Discover installed** in AI setup.                                                                 |
| Publishing fails                             | Run **Test connection** and confirm the remote folder and FTPS mode.                                                                  |

Still stuck? Open a GitHub issue with your operating system, Node version and
the error text—never include API keys or publishing passwords.

---

**Next:** [Create and manage a campaign →](MANAGER-GUIDE.md) ·
[Return to the README](../README.md)
