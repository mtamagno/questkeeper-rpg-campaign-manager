# Releasing QuestKeeper

QuestKeeper releases are immutable, verified snapshots of the public template.
They contain only tracked, redistributable project files—never local campaigns,
credentials, transcripts, generated model files or maintainer workspaces.

## Version contract

- `package.json` and the root entry in `package-lock.json` carry the product
  version without a leading `v`.
- The Git tag uses the same semantic version with a leading `v`.
- Release notes live at `docs/releases/vX.Y.Z.md`.
- Every version has one permanent fantasy codename and one new original release
  companion, recorded in the [Release Codex](../RELEASES.md).
- Companion art lives under `docs/images/releases/` and starts with the full
  version, for example `v1.0.0-starquill-auri.webp`.
- Compatible fixes increment the patch version, compatible features increment
  the minor version and breaking changes increment the major version.

The release workflow rejects a tag that does not match the package version or
does not have a notes file, codename and dedicated companion asset. Patch
versions also receive a new companion; a familiar-sized character is welcome,
but reusing an earlier release mascot is not.

## Release identity

Use the format **QuestKeeper X.Y.Z · Codename — Chapter title**. The codename is
short, pronounceable and fantasy-flavoured; the chapter title explains the
release outcome plainly. Both become permanent when the version is published.

The companion's role, prop, palette and quote should express the release's main
player-facing benefit. Use an original character with a distinct silhouette and
meaningful alt text. Do not imitate a commercial setting or ship placeholder
art. The full naming and art contract lives in the
[Release Codex](../RELEASES.md).

## Release gate

Before creating a tag:

1. choose the codename, chapter title and new companion;
2. add the companion asset, release notes and Release Codex entry;
3. update the package version;
4. run `npm run verify` from a clean worktree;
5. review the original campaign and Manager demo;
6. confirm no private or licensed campaign material is tracked;
7. commit and push the release candidate to `main`;
8. create and push the annotated tag.

```bash
git tag -a v1.0.0 -m "QuestKeeper 1.0.0"
git push origin v1.0.0
```

GitHub Actions repeats the quality gate, then publishes:

- `questkeeper-vX.Y.Z.zip` for Windows and general use;
- `questkeeper-vX.Y.Z.tar.gz` for macOS and Linux;
- `SHA256SUMS.txt` for integrity verification.

Both archives contain one versioned top-level folder. They are built with
`git archive`, so ignored local state and untracked files cannot enter a release.
Windows archives also include the graphical bootstrap and the dedicated Manager
and Companion launchers. Release verification checks that Node.js downloads are
checksum-verified and that setup retains an explicit user choice.

## Recovery

If verification fails, fix the cause and create a new version. Do not move or
replace a published stable tag. A mistakenly created release may be marked as a
draft while investigated, but its tag is not reused for different code.
