# Campaign-scoped authority model

**Status:** implemented model; enforcement UI and remote service remain tracked by #121-#124  
**Schema:** `tools/campaign-manager/schemas/campaign-authority.v1.schema.json`  
**Runtime contract:** `tools/campaign-manager/campaign-authority.mjs`  
**Classification:** shared

## Why this exists

A person is not globally a Player or a Game Master. The same stable identity can
own one campaign, be a GM in another, edit a third and only read a fourth. The
authority registry therefore belongs to one stable campaign ID and never uses a
display name, folder name, FTP path or the first device that opens a campaign as
proof of ownership.

The registry is protected local/service configuration. It is not campaign
content and must not be copied into the generated Companion. The public
projection exposes only schema version, campaign ID, trust mode, claim state
and whether anonymous reading is available.

## Roles explain; capabilities decide

| Role   | Effective capabilities                                                               |
| ------ | ------------------------------------------------------------------------------------ |
| Owner  | Read, edit, review, publish, unpublish, restore, manage members, transfer and delete |
| GM     | Read private content, edit, review, publish, unpublish and restore                   |
| Editor | Read private content, edit and create a reviewed release candidate                   |
| Player | Read published and explicitly permitted private content                              |
| Viewer | Read published content                                                               |

Protected operations check a named capability. A UI label never authorizes an
operation. The current pure model is reusable by the local Manager and the
future publishing service, but only the trusted boundary described in
`PUBLISHING-AUTHORITY.md` can enforce remote mutations against a hostile client.

## Stable identities and modes

- Person IDs use the `person_…` namespace and may map to a future authenticated
  account. Mutable names remain profile data.
- Installation IDs use `installation_…`. They prove local provenance only and
  never become a person or owner automatically.
- Campaign IDs use `campaign_…` and are independent of slugs and destinations.
- `local-only` grants the explicitly recorded installation local editing and
  owner-managed publishing convenience, but not membership management,
  ownership transfer or deletion authority.
- `owner-managed` and `shared` registries have exactly one active owner.

## Membership lifecycle

Each membership records one active campaign role, stable subject, grant actor,
timestamp, provenance and optional expiry. A subject cannot receive a second
active or conflicting membership. Expired and revoked memberships remain as
provenance but contribute no effective capabilities.

Revocation requires `manageMembers`. The owner cannot be revoked: ownership
must be transferred first. Audit events use allow-listed identifiers and reason
codes; they contain no credentials, uploaded prose, images, request bodies or
free-form secret-bearing payloads.

## Ownership transfer and recovery

Transfer is a two-party operation:

1. the current owner nominates an active non-owner member and an expiry;
2. only that successor can accept before expiry;
3. acceptance promotes the successor to owner and demotes the previous owner to
   GM, preserving access and provenance;
4. until acceptance, the current owner retains all authority and may cancel the
   transfer; an expired transfer changes no role and must be restarted.

Service-level account recovery is deliberately not invented in this local
model. It belongs to the trusted service and must append an equivalent audited
event under the recovery policy defined by #121.

## Anonymous and legacy behavior

Anonymous readers receive only `readPublished`, and only when the campaign is
public. A legacy single-Manager campaign migrates to `unclaimed` local-only
state with no owner membership. Claiming it requires the explicit, reversible
proof flow tracked by #124; opening a folder never silently claims it.

## Validation and compatibility

Version 1 rejects malformed identifiers, duplicate membership IDs, conflicting
active roles, invalid dates, unsupported roles/statuses/provenance, invalid
owner counts and secret-bearing audit fields. New schema versions must ship a
forward migration and keep the preceding validator available until all stored
registries have migrated.

Run the focused proof with:

```bash
npm run test:campaign-authority
```

The tests cover mixed roles across three campaigns, anonymous and local-only
access, expiry, revocation, transfer acceptance/cancellation/expiry, invalid
grants and the privacy-safe public projection.
