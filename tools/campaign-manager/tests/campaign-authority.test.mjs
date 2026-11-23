import assert from 'node:assert/strict';
import test from 'node:test';

import {
  acceptOwnershipTransfer,
  beginOwnershipTransfer,
  campaignCapabilityDecision,
  cancelOwnershipTransfer,
  createCampaignAuthority,
  createLegacyUnclaimedAuthority,
  effectiveCampaignCapabilities,
  grantCampaignMembership,
  publicCampaignAuthority,
  revokeCampaignMembership,
  validateCampaignAuthority,
} from '../campaign-authority.mjs';

const people = Object.freeze({
  alex: 'person_alex-000001',
  blair: 'person_blair-00001',
  casey: 'person_casey-00001',
  drew: 'person_drew-000001',
});

const ids = () => {
  let next = 0;
  return () => `test-${String(++next).padStart(8, '0')}`;
};
const idFactory = ids();

function campaign(suffix, owner = people.alex) {
  return createCampaignAuthority({
    campaignId: `campaign_${suffix}-000001`,
    ownerSubjectId: owner,
    now: '2026-11-23T09:00:00.000Z',
    idFactory,
  });
}

test('the same identity has deterministic campaign-scoped roles across three campaigns', () => {
  let owned = campaign('owned');
  let mastered = campaign('mastered', people.blair);
  let played = campaign('played', people.casey);
  mastered = grantCampaignMembership(
    mastered,
    { actorSubjectId: people.blair, subjectId: people.alex, role: 'gm' },
    idFactory,
  );
  played = grantCampaignMembership(
    played,
    { actorSubjectId: people.casey, subjectId: people.alex, role: 'player' },
    idFactory,
  );

  assert.equal(
    effectiveCampaignCapabilities(owned, { subjectId: people.alex }).includes('transferOwnership'),
    true,
  );
  assert.equal(
    effectiveCampaignCapabilities(mastered, { subjectId: people.alex }).includes('publish'),
    true,
  );
  assert.deepEqual(effectiveCampaignCapabilities(played, { subjectId: people.alex }), [
    'readPublished',
    'readPrivate',
  ]);
});

test('anonymous and local-only decisions do not invent campaign ownership', () => {
  const claimed = campaign('public');
  assert.deepEqual(
    effectiveCampaignCapabilities(claimed, { anonymous: true, publicCampaign: true }),
    ['readPublished'],
  );
  assert.deepEqual(effectiveCampaignCapabilities(claimed, { anonymous: true }), []);

  const legacy = createLegacyUnclaimedAuthority({
    campaignId: 'campaign_legacy-00001',
    installationId: 'installation_local-00001',
    now: '2026-11-23T09:00:00.000Z',
    idFactory,
  });
  assert.equal(legacy.claimState, 'unclaimed');
  assert.equal(legacy.memberships.length, 0);
  assert.equal(
    effectiveCampaignCapabilities(legacy, {
      installationId: 'installation_local-00001',
    }).includes('editContent'),
    true,
  );
  assert.equal(
    effectiveCampaignCapabilities(legacy, {
      installationId: 'installation_local-00001',
    }).includes('transferOwnership'),
    false,
  );
});

test('revocation and expiry remove capabilities without changing authorship provenance', () => {
  let registry = campaign('revocation');
  registry = grantCampaignMembership(
    registry,
    {
      actorSubjectId: people.alex,
      subjectId: people.blair,
      role: 'editor',
      provenance: 'import',
      expiresAt: '2026-11-24T09:00:00.000Z',
      now: '2026-11-23T09:00:00.000Z',
    },
    idFactory,
  );
  assert.equal(
    campaignCapabilityDecision(registry, {
      subjectId: people.blair,
      capability: 'editContent',
      now: '2026-11-23T10:00:00.000Z',
    }).allowed,
    true,
  );
  assert.equal(
    campaignCapabilityDecision(registry, {
      subjectId: people.blair,
      capability: 'editContent',
      now: '2026-11-25T10:00:00.000Z',
    }).allowed,
    false,
  );
  registry = revokeCampaignMembership(
    registry,
    {
      actorSubjectId: people.alex,
      subjectId: people.blair,
      now: '2026-11-23T11:00:00.000Z',
    },
    idFactory,
  );
  const membership = registry.memberships.find((entry) => entry.subjectId === people.blair);
  assert.equal(membership.status, 'revoked');
  assert.equal(membership.provenance, 'import');
  assert.equal(
    registry.audit.some((event) => event.type === 'membership.revoked'),
    true,
  );
});

test('ownership transfer is two-party, expiring, auditable and recoverable', () => {
  let registry = campaign('transfer');
  registry = grantCampaignMembership(
    registry,
    { actorSubjectId: people.alex, subjectId: people.blair, role: 'gm' },
    idFactory,
  );
  registry = beginOwnershipTransfer(
    registry,
    {
      actorSubjectId: people.alex,
      toSubjectId: people.blair,
      now: '2026-11-23T10:00:00.000Z',
      expiresAt: '2026-11-24T10:00:00.000Z',
    },
    idFactory,
  );
  assert.throws(
    () =>
      acceptOwnershipTransfer(
        registry,
        { actorSubjectId: people.casey, now: '2026-11-23T11:00:00.000Z' },
        idFactory,
      ),
    /nominated successor/,
  );
  assert.throws(
    () =>
      acceptOwnershipTransfer(
        registry,
        { actorSubjectId: people.blair, now: '2026-11-25T11:00:00.000Z' },
        idFactory,
      ),
    /expired/,
  );
  const cancelled = cancelOwnershipTransfer(
    registry,
    { actorSubjectId: people.alex, now: '2026-11-23T12:00:00.000Z' },
    idFactory,
  );
  assert.equal(cancelled.claimState, 'claimed');
  assert.equal(cancelled.pendingTransfer, undefined);

  registry = beginOwnershipTransfer(
    cancelled,
    {
      actorSubjectId: people.alex,
      toSubjectId: people.blair,
      now: '2026-11-23T13:00:00.000Z',
      expiresAt: '2026-11-24T13:00:00.000Z',
    },
    idFactory,
  );
  registry = acceptOwnershipTransfer(
    registry,
    { actorSubjectId: people.blair, now: '2026-11-23T14:00:00.000Z' },
    idFactory,
  );
  assert.equal(
    registry.memberships.find((entry) => entry.subjectId === people.blair).role,
    'owner',
  );
  assert.equal(registry.memberships.find((entry) => entry.subjectId === people.alex).role, 'gm');
  assert.equal(
    registry.audit.some((event) => event.type === 'ownership.transferred'),
    true,
  );
});

test('duplicate, conflicting and invalid grants fail safely', () => {
  let registry = campaign('invalid');
  registry = grantCampaignMembership(
    registry,
    { actorSubjectId: people.alex, subjectId: people.drew, role: 'viewer' },
    idFactory,
  );
  assert.throws(
    () =>
      grantCampaignMembership(
        registry,
        { actorSubjectId: people.alex, subjectId: people.drew, role: 'editor' },
        idFactory,
      ),
    /already has an active/,
  );
  assert.throws(
    () =>
      grantCampaignMembership(
        registry,
        { actorSubjectId: people.alex, subjectId: people.casey, role: 'owner' },
        idFactory,
      ),
    /may use gm, editor, player or viewer/,
  );
  const malformed = structuredClone(registry);
  malformed.memberships.push({ ...malformed.memberships.at(-1), id: malformed.memberships[0].id });
  assert.throws(() => validateCampaignAuthority(malformed), /duplicate membership/);
});

test('public projection excludes memberships, installation identity, audit and secrets', () => {
  let registry = campaign('projection');
  registry = grantCampaignMembership(
    registry,
    { actorSubjectId: people.alex, subjectId: people.blair, role: 'player' },
    idFactory,
  );
  const output = publicCampaignAuthority(registry);
  assert.deepEqual(Object.keys(output).sort(), [
    'campaignId',
    'claimState',
    'publicAccess',
    'trustMode',
    'version',
  ]);
  assert.equal(JSON.stringify(output).includes(people.blair), false);
  assert.equal(JSON.stringify(output).toLowerCase().includes('audit'), false);
});
