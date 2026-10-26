# QuestKeeper Data Lifecycle

QuestKeeper keeps irreplaceable table data outside the replaceable application
and Node.js runtime. Updating or reinstalling the app must never require the GM
to overwrite a campaign directory.

## Storage modes

| Mode                   | Intended use                                  | Data location                                                                     |
| ---------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| Per-user (recommended) | Installed release                             | The operating system's standard QuestKeeper data, config, state and cache folders |
| Portable               | USB drive or deliberately self-contained copy | `.questkeeper/user-data/` beside the app                                          |
| Legacy                 | Source checkout and development               | Existing repository folders such as `src/campaigns/`                              |

The central resolver in `tools/storage-paths.cjs` owns every path. Campaigns,
original media, transcripts, backups and configuration are protected user data.
The downloaded app, private Node runtime, dependencies, build output and
generated campaign mirror are replaceable.

## First migration from 1.1.4

Setup previews the source, destination, campaign count, free space and ID
collisions. It copies the complete campaign tree to staging, validates
`campaigns.json` and every referenced campaign, then adopts the new directory
with an atomic rename. Before the legacy source becomes a replaceable build
mirror, its original contents are preserved under the protected backup root as
`pre-storage-migration`. Configuration, Discord credentials and transcripts are
copied only when their protected destinations do not already exist.

An interruption before or during the switch removes staging where possible and
does not delete the original. Running setup again resumes from a valid source or
adopts the already validated destination.

## Builds, exports and backups

Before a preview or production build, QuestKeeper validates protected campaign
data and refreshes `src/campaigns/` as a replaceable build mirror. The Companion
therefore keeps its static build format without making that mirror the source of
truth.

A campaign export is portable structured content. A full local backup copies
the complete campaign tree, including original media, into the protected backup
root. Keep a second copy on another device for disaster recovery.

## Safe cleanup

You may recreate the private runtime, `node_modules/`, `dist/`, caches and the
build mirror after confirming no process is using them. Do not remove the data,
configuration, transcript or backup roots shown by Campaign Manager unless you
have intentionally exported or backed them up. Paths and logs must never expose
API keys, Discord tokens or publishing passwords.
