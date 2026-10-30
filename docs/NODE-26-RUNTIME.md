# Node.js 26 runtime contract

QuestKeeper 1.1.3 standardizes development, CI, source launchers and native
setup packages on Node.js 26.

## Current upstream status

Node.js 26 entered upstream **Active LTS** on 28 October 2026 with the codename
Lithium. QuestKeeper 1.1.5 therefore ships its supported runtime after the
upstream transition rather than describing a future lifecycle milestone.

## Runtime rules

- `package.json` accepts Node.js 26 only (`>=26 <27`) and `.nvmrc` selects 26.
- CI and release builders run Node.js 26.
- The graphical setup accepts a system runtime only after checking the major
  version, architecture and bundled npm.
- The recommended private runtime resolves the newest published 26.x archive,
  verifies its official SHA-256 checksum and stays inside `.questkeeper/`.
- Source launchers fail with a clear message when another major is active.
- Native setup binaries are built with Node.js 26 and then smoke-tested.

Historical release notes continue to describe the runtime used by those
versions and are intentionally not rewritten.

## Upgrade verification

Before release, run the full quality gate using an actual Node.js 26 runtime,
not merely a host installation from another major:

```bash
npm ci
npm run verify
npm run build:setup -- --platform=windows --arch=x64
```

The release workflow repeats these gates for Windows, Linux and both supported
macOS architectures.
