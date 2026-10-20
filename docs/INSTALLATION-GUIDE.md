# Installation Guide

<p align="center">
  <img src="images/companions/lyra-pathfinder.webp" alt="Lyra the pathfinder points toward the next step" height="360">
</p>

<p align="center"><em>Lyra knows the shortest road from download to game night.</em></p>

QuestKeeper runs on your computer and produces a static campaign website. A
database, cloud account, AI provider and preinstalled Node.js are not required.
The graphical setup prepares a private **Node.js 24** runtime on Windows, macOS
and Linux.

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

- download a private Node.js 24 runtime into `.questkeeper/runtime`;
- prepare the project's locked dependencies;
- create separate **QuestKeeper Campaign Manager** and **QuestKeeper
  Companion** desktop launchers;
- open Campaign Manager when setup finishes.

Node.js comes directly from `https://nodejs.org/dist/`. QuestKeeper reads the
official release index, downloads the archive matching the operating system and
processor, and compares it with the published SHA-256 checksum before
extraction. It does not make a system-wide installation and does not need
administrator privileges.

Nothing is installed merely by opening the setup: the checklist and **Prepare
QuestKeeper** button make the selected actions explicit. AI tools and models
remain a separate, optional Manager decision.

On its first successful run, setup opens Campaign Manager and guides you through
the first campaign. The Manager normally uses `http://127.0.0.1:4173`; keep its
terminal window open while working.

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

Commit or back up your campaign files before updating. If you cloned with Git:

```bash
git pull
npm ci
```

Then reopen the Manager and run **Check and build site**. Your campaign data is
stored as ordinary files under `src/campaigns/`.

## Quick troubleshooting

| Symptom                                     | Try this                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| The setup does not open a browser           | Copy the local URL shown by the setup into a browser, or rerun the platform binary.      |
| Windows or macOS blocks the first launch    | Verify the release checksum, then use the deliberate first-open flow described above.    |
| Runtime preparation fails                   | Rerun setup; partial downloads are temporary and the official checksum is checked again. |
| Setup 1.1.0 stops while creating a shortcut | Download 1.1.1 and rerun setup; the prepared runtime and dependencies remain usable.     |
| A desktop shortcut stops working            | Return the QuestKeeper folder to its original location or rerun setup to recreate links. |
| `node` is not recognized in a terminal      | This is expected: the release keeps its Node.js runtime private inside QuestKeeper.      |
| Port 4173 is busy                           | QuestKeeper automatically tries ports through 4183; use the URL printed in the terminal. |
| The Companion does not reflect edits        | Run **Check and build site**, then refresh without cache.                                |
| A local model is unavailable                | Start Ollama or ComfyUI, then use **Discover installed** in AI setup.                    |
| Publishing fails                            | Run **Test connection** and confirm the remote folder and FTPS mode.                     |

Still stuck? Open a GitHub issue with your operating system, Node version and
the error text—never include API keys or publishing passwords.

---

**Next:** [Create and manage a campaign →](MANAGER-GUIDE.md) ·
[Return to the README](../README.md)
