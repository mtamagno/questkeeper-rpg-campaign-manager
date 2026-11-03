# Publishing Authority and Shared Hosting

**Status:** accepted research decision

**Date:** 3 November 2026

**Classification:** shared
**Tracks:** [#113](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/113)
and [#119](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/119)

## Decision

QuestKeeper supports two explicit publication trust levels:

1. **Owner-managed publishing** keeps local-only, GitHub and direct FTP/FTPS
   journeys. One installation or trusted group owns the destination. This mode
   does not claim to isolate mutually untrusted Managers.
2. **Shared campaign publishing** requires a server-enforced authority boundary.
   The target architecture is a small trusted publishing service that validates
   identity, campaign membership, capability, destination and revision before
   it accepts a build. The service uses short-lived, campaign-scoped grants and
   never gives hosting credentials to local Managers.

Identical unrestricted FTP or FTPS credentials give every holder identical
server authority. Client-side roles, hidden controls, installation IDs and
signed manifests cannot turn those credentials into per-user authorization.
FTPS protects the connection; it does not narrow what the credential may write.

SFTP or WebDAV may become provider adapters only when the host supplies distinct
credentials plus server-side directory ACLs. WebDAV conditional writes can also
provide useful revision protection. Neither protocol alone defines QuestKeeper
ownership, transfer or recovery semantics.

## Current publication and credential flow

The local Campaign Manager currently:

1. receives FTP/FTPS host, port, remote folder, username and password through
   `PUT /api/publishing/setup`;
2. writes them to the protected local configuration root through
   `tools/campaign-manager/publishing.mjs`;
3. returns only a redacted configuration to the browser;
4. performs a fresh validated build; and
5. gives the saved credential and caller-supplied remote path to `basic-ftp`,
   which uploads the complete build directory.

There is no person identity, campaign membership, server-side path grant,
published revision or stale-write precondition. The password is excluded from
campaign JSON and browser responses, but local file mode is only a best-effort
host-OS control. FTP library log output is captured for the job log, so secret
redaction remains a mandatory invariant.

GitHub Pages is a separate owner-managed path. Repository permissions and the
workflow token constrain the repository, but write access to one repository
does not by itself express different roles for several campaigns stored inside
that repository.

## Identities and capabilities

| Context           | Identity                                                      | Security meaning                                               |
| ----------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| Local-only        | local installation plus device user                           | Convenience and provenance only; no remote authorization claim |
| Legacy FTP/FTPS   | hosting credential                                            | Every holder receives the server rights of that credential     |
| GitHub deployment | GitHub user/app and repository grant                          | Enforced by GitHub at repository scope                         |
| Shared publishing | authenticated person/device plus server-issued campaign grant | Enforced per campaign and capability by the publishing service |

The shared service resolves these minimum roles per campaign:

- **owner:** grant, revoke, transfer, recover, publish and unpublish;
- **GM:** edit and publish, without ownership transfer unless explicitly granted;
- **editor:** edit approved content and create a reviewed release candidate;
- **player/read-only:** read published content and permitted private drafts only.

Create, edit, publish, unpublish, restore, delete, membership changes and
ownership transfer are separate capabilities. The Companion remains readable
without a Manager account when its owner publishes it publicly.

## Threat model

| Threat                      | Current direct FTP/FTPS                           | Required shared-mode control                                                        |
| --------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Accidental overwrite        | A second Manager can replace matching files       | Strong revision plus `If-Match`; reject stale writes with `412`                     |
| Crafted or malicious client | Hidden UI can be bypassed                         | Server checks subject, campaign and capability on every mutation                    |
| Stolen credential/token     | Full credential authority until changed           | Short expiry, revocation, rotation and least-privilege campaign scope               |
| Stale local copy            | Last upload wins                                  | Immutable release ID, parent revision and explicit conflict recovery                |
| Path traversal/wrong folder | Remote path is currently client-controlled        | Server derives a canonical campaign namespace; reject `..`, aliases and escapes     |
| Replaced manifest/signature | Shared FTP holder can replace both                | Verify signatures and grants inside the trusted service before commit               |
| Secret leakage              | Library/errors may reach logs                     | Structured allow-listed audit events; never log passwords, tokens or request bodies |
| Abandoned owner             | Hosting credential becomes the recovery mechanism | Recovery policy, second owner or time-bound admin recovery with audit evidence      |

## Backend capability matrix

| Backend                                                   | Transport security | Per-campaign enforcement | Conflict control                                 | Revocation/audit                      | Decision                                                      |
| --------------------------------------------------------- | ------------------ | ------------------------ | ------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------- |
| Plain FTP, shared credential                              | No                 | No                       | No                                               | Credential replacement only           | Legacy compatibility only; never shared mode                  |
| FTPS, shared credential                                   | Yes                | No                       | No                                               | Credential replacement only           | Owner-managed single trust domain                             |
| FTP/FTPS with distinct server accounts and directory ACLs | FTPS only          | Host-dependent           | Usually no                                       | Host-dependent                        | Optional owner-managed adapter, not QuestKeeper collaboration |
| SFTP with distinct accounts, chroot and ACLs              | Yes                | Host-dependent           | Usually no                                       | Host-dependent                        | Possible scoped adapter after capability probing              |
| WebDAV with distinct principals and ACLs                  | Yes with HTTPS     | Host-dependent           | ETag/`If-Match`; optional locks                  | Host-dependent                        | Strong adapter candidate, not the role authority itself       |
| GitHub App and one repository per authority boundary      | Yes                | Repository scope         | Git commits/merges                               | Short-lived tokens and platform audit | Supported owner-managed or delegated adapter                  |
| QuestKeeper publishing service                            | Yes                | Yes, campaign capability | Required revision precondition and atomic commit | Required                              | Chosen shared-mode authority boundary                         |

## Minimum server contract

The shared publishing service must:

- authenticate a person or registered device and issue a short-lived token;
- bind every grant to `subject`, `campaignId`, allowed capabilities and expiry;
- derive the storage destination from `campaignId`, never from a raw client path;
- validate the complete release manifest, size limits, checksums and canonical
  relative paths before changing live files;
- stage and atomically activate a release;
- require a strong current revision for every mutable action;
- record an append-only audit event without prose, media or secrets;
- support grant revocation, ownership transfer, recovery and export; and
- make authorization decisions before evaluating revision or content details so
  unauthorized callers cannot probe another campaign.

### Protocol trace

The following trace is the acceptance proof for the boundary; implementation may
change endpoint names but not the guarantees:

```http
GET /v1/campaigns/camp_7/publication
Authorization: Bearer <short-lived token for user A>

200 OK
ETag: "release-41"

PUT /v1/campaigns/camp_7/publication
Authorization: Bearer <token scoped to camp_7:publish>
If-Match: "release-41"
Content-Type: application/vnd.questkeeper.release+zip

201 Created
ETag: "release-42"
```

A stale authorized client receives `412 Precondition Failed`. A valid user-B
token scoped to another campaign receives `403 Forbidden` even if it crafts the
same URL, campaign ID, manifest and destination. A raw path such as
`../../other-campaign` receives `400 Bad Request` before staging. Repeating an
already accepted immutable release ID is idempotent and cannot create a second
activation.

This uses the HTTP strong-validator contract: `If-Match` on state-changing
requests prevents the lost-update problem. WebDAV locks may supplement but not
replace authorization or revision checks.

## Secrets, logs and local storage

- Campaign JSON, export archives, build artifacts and browser responses contain
  no hosting password, access token, refresh token or membership secret.
- Legacy publishing secrets remain in the protected configuration root and are
  redacted from diagnostics. A future OS credential-vault adapter is preferred
  over long-lived plaintext configuration.
- Shared-mode refresh material uses the OS credential vault when available.
  Access grants are short-lived and revocable.
- Audit logs contain actor ID, campaign ID, capability, release/revision ID,
  result and timestamp. They do not contain credentials, uploaded prose, image
  bytes or full request/response bodies.

## Migration and compatibility

1. Existing local-only campaigns continue unchanged and are labelled **This
   installation** until the owner explicitly enables sharing.
2. Existing FTP/FTPS destinations remain usable as **Owner-managed / shared
   credentials**. The Manager explains that all credential holders can overwrite
   all reachable campaigns.
3. Enabling shared mode creates or claims an explicit campaign ID after backup
   and ownership proof. Display names never establish ownership.
4. The first secure publication imports the current public revision as the
   migration base. Rollback to owner-managed publication remains possible; it
   also removes shared-mode guarantees and requires explicit confirmation.
5. Campaign transfer is a two-party audited operation with a recovery window.
   Deleting or unpublishing a campaign requires a fresh privileged grant.

## Rejected alternatives

- **Global Player/GM choice:** one person can have different roles per campaign.
- **Client-only role flags:** a modified Manager can bypass them.
- **Installation UUID as identity:** it proves neither a person nor authority and
  is easy to copy.
- **Signed manifest on raw shared FTP:** the same credential can replace the
  manifest, signature and files unless a trusted server refuses them.
- **One permanent shared token:** it recreates the unrestricted FTP problem and
  makes revocation and attribution unreliable.

## Implementation disposition

Disposition: **implement through the existing epic split**. Research issue #119
may close; it does not ship shared authorization. #120 defines identity, roles,
grants and transfer. #121 implements the service boundary, revision protocol and
adapters. #122 consumes effective capabilities in Manager UI. #123 removes the
global home role fork. #124 owns reversible claim and migration. Those issues
remain open until their behavior is released and smoke-tested.

## Authoritative references

- [RFC 959, FTP access-control commands](https://www.rfc-editor.org/rfc/rfc959.html)
- [RFC 4217, securing FTP with TLS](https://www.rfc-editor.org/rfc/rfc4217.html)
- [RFC 9110, HTTP conditional requests and `If-Match`](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match)
- [RFC 4918, WebDAV authorization, locks and lost-update handling](https://www.rfc-editor.org/rfc/rfc4918.html)
- [OpenSSH `sshd_config`, including chroot and `internal-sftp`](https://man.openbsd.org/sshd_config)
- [GitHub App user-token scope and expiry](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [OWASP secrets management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [OWASP logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
