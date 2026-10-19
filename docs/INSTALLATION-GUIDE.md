# Installation Guide

<p align="center">
  <img src="images/companions/lyra-pathfinder.webp" alt="Lyra the pathfinder points toward the next step" height="360">
</p>

<p align="center"><em>Lyra knows the shortest road from download to game night.</em></p>

QuestKeeper runs on your computer and produces a static campaign website. You
only need **Node.js 24** to begin; a database, cloud account and AI provider are
not required.

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

Install the current [Node.js 24 LTS release](https://nodejs.org/) if it is not
already available.

## 2. Start the guided setup

| Platform     | What to open                          |
| ------------ | ------------------------------------- |
| Windows      | Double-click `setup.bat`              |
| macOS        | Double-click `setup.command`          |
| Linux        | Run `chmod +x setup.sh && ./setup.sh` |
| Any platform | Run `npm run manage` in a terminal    |

On macOS, Control-click **setup.command**, choose **Open**, then confirm if
Gatekeeper blocks the first launch.

On its first run, setup installs the locked project dependencies, opens Campaign
Manager and guides you through the first campaign. The Manager normally uses
`http://127.0.0.1:4173`; keep its terminal window open while working.

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

| Symptom                              | Try this                                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| The setup closes immediately         | Open a terminal in the folder and run `npm run manage` to see the message.               |
| `node` is not recognized             | Install Node.js 24, close the terminal and reopen it.                                    |
| Port 4173 is busy                    | QuestKeeper automatically tries ports through 4183; use the URL printed in the terminal. |
| The Companion does not reflect edits | Run **Check and build site**, then refresh without cache.                                |
| A local model is unavailable         | Start Ollama or ComfyUI, then use **Discover installed** in AI setup.                    |
| Publishing fails                     | Run **Test connection** and confirm the remote folder and FTPS mode.                     |

Still stuck? Open a GitHub issue with your operating system, Node version and
the error text—never include API keys or publishing passwords.

---

**Next:** [Create and manage a campaign →](MANAGER-GUIDE.md) ·
[Return to the README](../README.md)
