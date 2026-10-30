# Long-Term Support releases

An LTS release is QuestKeeper's recommended base for a long-running campaign.
It favors reliability and compatible fixes over rapid behavioral change.

- The active LTS version is named in the Release Codex and GitHub Release title.
- Critical security, data-integrity, setup reliability and accessibility fixes
  are maintained on that line until a successor is explicitly designated LTS.
- New capabilities continue on later versions; an LTS patch receives them only
  when they are needed to fix a supported workflow without destabilizing it.
- Tags are immutable. An LTS designation never moves an old tag or rewrites its
  assets; a fix produces a new semantic version.
- Every LTS artifact still passes the normal verification, native packaging,
  checksum and smoke-test gates.

QuestKeeper 1.1.5 · Storyforge is the active LTS release. It supersedes 1.1.4
after integrating the complete 1.1.4 feedback milestone, recoverable user-owned
storage and the character toolkit. The preceding `v1.1.3` packaging tag failed
its Windows gate and was never published as a GitHub Release; it remains
immutable.
