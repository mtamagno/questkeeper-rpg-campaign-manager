# Prepare a game-night offline pack

QuestKeeper's offline pack is a deliberate, device-local reading copy for a
venue with unreliable internet. It is not a hidden download of the whole
campaign.

## Before leaving your connection

1. Open the campaign and choose **Offline pack** from the home page, sidebar or
   `Ctrl/Cmd + K` navigation.
2. Keep the public character profiles you need checked.
3. Review the three most recent recaps QuestKeeper will include.
4. Choose **Prepare for offline** and wait for the ready confirmation.
5. The saved library below the controls is the exact content available on this
   device. Open a character and the newest recap once to verify them.

Preparing again replaces that campaign's previous pack. Each pack shows its
preparation time and content counts. **Remove from device** clears it without
changing the campaign source.

## What is saved

- the selected characters' name, public identity and public profile fields;
- at most the three newest session titles, locations, summaries, story-so-far
  snippets and key moments;
- selected public profile artwork when the installed service worker is active;
- the public campaign directory and campaign title needed to find the pack
  again.

## What is never added automatically

- passwords or unlock state;
- protected sheets, statistics, equipment or spells;
- secret profiles, private notes or GM notes;
- complete prose chapters, transcripts or unpublished source files.

This boundary is enforced in the snapshot model and the service-worker
configuration. Character and session source JSON files are not part of the
offline cache.

## At the table

Open **Offline pack** from the campaign. The connection badge makes the current
state visible. Saved profiles and recaps remain readable in the same bilingual
interface; anything that was not prepared is described as unavailable instead
of silently failing.

Browser storage can be removed by the browser, operating system or user. Treat
the pack as a convenience copy, not the only campaign archive.
