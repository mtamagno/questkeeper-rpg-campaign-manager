# Releasing QuestKeeper

QuestKeeper releases are immutable, verified snapshots of the public template.
They contain only tracked, redistributable project files—never local campaigns,
credentials, transcripts, generated model files or maintainer workspaces.

## Version contract

- `package.json` and the root entry in `package-lock.json` carry the product
  version without a leading `v`.
- The Git tag uses the same semantic version with a leading `v`.
- Release notes live at `docs/releases/vX.Y.Z.md`.
- Compatible fixes increment the patch version, compatible features increment
  the minor version and breaking changes increment the major version.

The release workflow rejects a tag that does not match the package version or
does not have a notes file.

## Release gate

Before creating a tag:

1. update the package version and release notes;
2. run `npm run verify` from a clean worktree;
3. review the original campaign and Manager demo;
4. confirm no private or licensed campaign material is tracked;
5. commit and push the release candidate to `main`;
6. create and push the annotated tag.

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

## Recovery

If verification fails, fix the cause and create a new version. Do not move or
replace a published stable tag. A mistakenly created release may be marked as a
draft while investigated, but its tag is not reused for different code.
