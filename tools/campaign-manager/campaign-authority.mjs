import { randomUUID } from 'node:crypto';

export const AUTHORITY_SCHEMA_VERSION = 1;

export const CAMPAIGN_ROLES = Object.freeze(['owner', 'gm', 'editor', 'player', 'viewer']);

export const CAMPAIGN_CAPABILITIES = Object.freeze([
  'readPublished',
  'readPrivate',
  'editContent',
  'reviewRelease',
  'publish',
  'unpublish',
  'restoreCampaign',
  'manageMembers',
  'transferOwnership',
  'deleteCampaign',
]);

export const ROLE_CAPABILITIES = Object.freeze({
  owner: CAMPAIGN_CAPABILITIES,
  gm: Object.freeze([
    'readPublished',
    'readPrivate',
    'editContent',
    'reviewRelease',
    'publish',
    'unpublish',
    'restoreCampaign',
  ]),
  editor: Object.freeze(['readPublished', 'readPrivate', 'editContent', 'reviewRelease']),
  player: Object.freeze(['readPublished', 'readPrivate']),
  viewer: Object.freeze(['readPublished']),
});

export const LOCAL_CONTROLLER_CAPABILITIES = Object.freeze([
  'readPublished',
  'readPrivate',
  'editContent',
  'reviewRelease',
  'publish',
  'unpublish',
  'restoreCampaign',
]);

const TRUST_MODES = new Set(['local-only', 'owner-managed', 'shared']);
const CLAIM_STATES = new Set(['unclaimed', 'claimed', 'transfer-pending']);
const MEMBERSHIP_STATUSES = new Set(['active', 'revoked', 'pending']);
const PROVENANCE_VALUES = new Set(['created', 'invitation', 'import', 'transfer']);
const AUDIT_TYPES = new Set([
  'authority.created',
  'legacy.marked-unclaimed',
  'membership.granted',
  'membership.revoked',
  'ownership.transfer-started',
  'ownership.transferred',
  'ownership.transfer-cancelled',
]);
const AUDIT_KEYS = new Set([
  'id',
  'type',
  'actorSubjectId',
  'campaignId',
  'occurredAt',
  'targetSubjectId',
  'previousOwnerSubjectId',
  'installationId',
  'membershipId',
  'transferId',
  'role',
  'reasonCode',
]);
const ID_PATTERNS = Object.freeze({
  campaign: /^campaign_[a-z0-9][a-z0-9_-]{5,127}$/,
  person: /^person_[a-z0-9][a-z0-9_-]{5,127}$/,
  installation: /^installation_[a-z0-9][a-z0-9_-]{5,127}$/,
  membership: /^membership_[a-z0-9][a-z0-9_-]{5,127}$/,
  transfer: /^transfer_[a-z0-9][a-z0-9_-]{5,127}$/,
  audit: /^audit_[a-z0-9][a-z0-9_-]{5,127}$/,
});

function nowIso(now = new Date()) {
  const value = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(value.getTime())) throw new Error('Authority timestamps must be valid dates.');
  return value.toISOString();
}

function stableId(kind, idFactory = randomUUID) {
  return `${kind}_${String(idFactory())
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')}`;
}

function assertStableId(kind, value, label = kind) {
  if (!ID_PATTERNS[kind]?.test(String(value || ''))) {
    throw new Error(`${label} must be a stable ${kind} identifier.`);
  }
}

function clone(registry) {
  return structuredClone(registry);
}

function activeMembership(registry, subjectId, at) {
  const instant = new Date(at).getTime();
  return registry.memberships.find(
    (membership) =>
      membership.subjectId === subjectId &&
      membership.status === 'active' &&
      (!membership.expiresAt || new Date(membership.expiresAt).getTime() > instant),
  );
}

function auditEvent(registry, type, actorSubjectId, details, occurredAt, idFactory) {
  return {
    id: stableId('audit', idFactory),
    type,
    actorSubjectId,
    campaignId: registry.campaignId,
    occurredAt,
    ...details,
  };
}

function requireCapability(registry, actorSubjectId, capability, at) {
  const decision = campaignCapabilityDecision(registry, {
    subjectId: actorSubjectId,
    capability,
    now: at,
  });
  if (!decision.allowed) {
    throw new Error(`Capability ${capability} denied: ${decision.reason}.`);
  }
}

export function createPersonId(idFactory = randomUUID) {
  return stableId('person', idFactory);
}

export function createInstallationId(idFactory = randomUUID) {
  return stableId('installation', idFactory);
}

export function createCampaignAuthority({
  campaignId,
  ownerSubjectId,
  trustMode = 'shared',
  now = new Date(),
  idFactory = randomUUID,
}) {
  assertStableId('campaign', campaignId, 'campaignId');
  assertStableId('person', ownerSubjectId, 'ownerSubjectId');
  if (!TRUST_MODES.has(trustMode) || trustMode === 'local-only') {
    throw new Error('Claimed authority requires owner-managed or shared trust mode.');
  }
  const occurredAt = nowIso(now);
  const membership = {
    id: stableId('membership', idFactory),
    subjectId: ownerSubjectId,
    role: 'owner',
    status: 'active',
    provenance: 'created',
    grantedBy: ownerSubjectId,
    grantedAt: occurredAt,
  };
  const registry = {
    version: AUTHORITY_SCHEMA_VERSION,
    campaignId,
    trustMode,
    claimState: 'claimed',
    memberships: [membership],
    audit: [
      auditEvent(
        { campaignId },
        'authority.created',
        ownerSubjectId,
        { targetSubjectId: ownerSubjectId, membershipId: membership.id },
        occurredAt,
        idFactory,
      ),
    ],
  };
  return validateCampaignAuthority(registry);
}

export function createLegacyUnclaimedAuthority({
  campaignId,
  installationId,
  now = new Date(),
  idFactory = randomUUID,
}) {
  assertStableId('campaign', campaignId, 'campaignId');
  assertStableId('installation', installationId, 'installationId');
  const occurredAt = nowIso(now);
  return validateCampaignAuthority({
    version: AUTHORITY_SCHEMA_VERSION,
    campaignId,
    trustMode: 'local-only',
    claimState: 'unclaimed',
    localControllerInstallationId: installationId,
    memberships: [],
    audit: [
      auditEvent(
        { campaignId },
        'legacy.marked-unclaimed',
        installationId,
        { installationId },
        occurredAt,
        idFactory,
      ),
    ],
  });
}

export function validateCampaignAuthority(registry) {
  const failures = [];
  if (registry?.version !== AUTHORITY_SCHEMA_VERSION) failures.push('unsupported schema version');
  try {
    assertStableId('campaign', registry?.campaignId, 'campaignId');
  } catch (error) {
    failures.push(error.message);
  }
  if (!TRUST_MODES.has(registry?.trustMode)) failures.push('unsupported trust mode');
  if (!CLAIM_STATES.has(registry?.claimState)) failures.push('unsupported claim state');
  if (!Array.isArray(registry?.memberships)) failures.push('memberships must be an array');
  if (!Array.isArray(registry?.audit)) failures.push('audit must be an array');

  const membershipIds = new Set();
  const activeSubjects = new Set();
  let ownerCount = 0;
  for (const membership of registry?.memberships ?? []) {
    try {
      assertStableId('membership', membership.id, 'membership.id');
      assertStableId('person', membership.subjectId, 'membership.subjectId');
      assertStableId('person', membership.grantedBy, 'membership.grantedBy');
    } catch (error) {
      failures.push(error.message);
    }
    if (membershipIds.has(membership.id)) failures.push(`duplicate membership ${membership.id}`);
    membershipIds.add(membership.id);
    if (!CAMPAIGN_ROLES.includes(membership.role))
      failures.push(`unsupported role ${membership.role}`);
    if (!MEMBERSHIP_STATUSES.has(membership.status)) {
      failures.push(`unsupported membership status ${membership.status}`);
    }
    if (!PROVENANCE_VALUES.has(membership.provenance)) {
      failures.push(`unsupported membership provenance ${membership.provenance}`);
    }
    if (Number.isNaN(Date.parse(membership.grantedAt))) failures.push('invalid grantedAt');
    if (membership.expiresAt && Number.isNaN(Date.parse(membership.expiresAt))) {
      failures.push('invalid expiresAt');
    }
    if (membership.status === 'revoked' && !membership.revokedAt) {
      failures.push(`revoked membership ${membership.id} needs revokedAt`);
    }
    if (membership.status === 'active') {
      if (activeSubjects.has(membership.subjectId)) {
        failures.push(`conflicting active memberships for ${membership.subjectId}`);
      }
      activeSubjects.add(membership.subjectId);
      if (membership.role === 'owner') ownerCount += 1;
    }
  }

  if (registry?.claimState === 'unclaimed' && ownerCount !== 0) {
    failures.push('unclaimed authority cannot contain an owner');
  }
  if (registry?.claimState !== 'unclaimed' && ownerCount !== 1) {
    failures.push('claimed authority needs exactly one active owner');
  }
  if (registry?.trustMode === 'local-only') {
    try {
      assertStableId(
        'installation',
        registry.localControllerInstallationId,
        'localControllerInstallationId',
      );
    } catch (error) {
      failures.push(error.message);
    }
  }
  if (registry?.pendingTransfer) {
    try {
      assertStableId('transfer', registry.pendingTransfer.id, 'pendingTransfer.id');
      assertStableId('person', registry.pendingTransfer.fromSubjectId, 'transfer source');
      assertStableId('person', registry.pendingTransfer.toSubjectId, 'transfer target');
    } catch (error) {
      failures.push(error.message);
    }
    if (Number.isNaN(Date.parse(registry.pendingTransfer.expiresAt))) {
      failures.push('invalid transfer expiry');
    }
  }

  for (const event of registry?.audit ?? []) {
    try {
      assertStableId('audit', event.id, 'audit.id');
    } catch (error) {
      failures.push(error.message);
    }
    if (event.campaignId !== registry.campaignId) failures.push('audit campaign mismatch');
    if (Number.isNaN(Date.parse(event.occurredAt))) failures.push('invalid audit timestamp');
    if (!AUDIT_TYPES.has(event.type)) failures.push(`unsupported audit type ${event.type}`);
    const unknownKeys = Object.keys(event).filter((key) => !AUDIT_KEYS.has(key));
    if (unknownKeys.length)
      failures.push(`audit event ${event.id} has unknown fields ${unknownKeys}`);
    if (event.reasonCode && !/^[a-z0-9-]+$/.test(event.reasonCode)) {
      failures.push(`audit event ${event.id} has invalid reasonCode`);
    }
    const serialized = JSON.stringify(event).toLowerCase();
    if (/password|token|secret|credential|requestbody/.test(serialized)) {
      failures.push(`audit event ${event.id} contains a forbidden secret-bearing field`);
    }
  }

  if (failures.length) throw new Error(`Invalid campaign authority: ${failures.join('; ')}.`);
  return registry;
}

export function effectiveCampaignCapabilities(
  registry,
  { subjectId, installationId, anonymous = false, now = new Date(), publicCampaign = false } = {},
) {
  validateCampaignAuthority(registry);
  if (anonymous) return publicCampaign ? ['readPublished'] : [];
  if (
    registry.trustMode === 'local-only' &&
    installationId === registry.localControllerInstallationId
  ) {
    return [...LOCAL_CONTROLLER_CAPABILITIES];
  }
  if (!subjectId) return [];
  const membership = activeMembership(registry, subjectId, nowIso(now));
  return membership ? [...ROLE_CAPABILITIES[membership.role]] : [];
}

export function campaignCapabilityDecision(registry, options) {
  if (!CAMPAIGN_CAPABILITIES.includes(options.capability)) {
    throw new Error(`Unknown campaign capability ${options.capability}.`);
  }
  const capabilities = effectiveCampaignCapabilities(registry, options);
  if (capabilities.includes(options.capability)) return { allowed: true, reason: 'granted' };
  if (options.anonymous) return { allowed: false, reason: 'not-public' };
  return { allowed: false, reason: 'missing-campaign-grant' };
}

export function grantCampaignMembership(
  registry,
  { actorSubjectId, subjectId, role, expiresAt, provenance = 'invitation', now = new Date() },
  idFactory = randomUUID,
) {
  validateCampaignAuthority(registry);
  const occurredAt = nowIso(now);
  requireCapability(registry, actorSubjectId, 'manageMembers', occurredAt);
  assertStableId('person', subjectId, 'subjectId');
  if (!CAMPAIGN_ROLES.includes(role) || role === 'owner') {
    throw new Error('Membership grants may use gm, editor, player or viewer roles.');
  }
  if (activeMembership(registry, subjectId, occurredAt)) {
    throw new Error(`Subject ${subjectId} already has an active campaign membership.`);
  }
  const normalizedExpiry = expiresAt ? nowIso(expiresAt) : undefined;
  if (normalizedExpiry && new Date(normalizedExpiry) <= new Date(occurredAt)) {
    throw new Error('Membership expiry must be in the future.');
  }
  const next = clone(registry);
  const membership = {
    id: stableId('membership', idFactory),
    subjectId,
    role,
    status: 'active',
    provenance,
    grantedBy: actorSubjectId,
    grantedAt: occurredAt,
    ...(normalizedExpiry ? { expiresAt: normalizedExpiry } : {}),
  };
  next.memberships.push(membership);
  next.audit.push(
    auditEvent(
      next,
      'membership.granted',
      actorSubjectId,
      { targetSubjectId: subjectId, membershipId: membership.id, role },
      occurredAt,
      idFactory,
    ),
  );
  return validateCampaignAuthority(next);
}

export function revokeCampaignMembership(
  registry,
  { actorSubjectId, subjectId, reasonCode = 'access-removed', now = new Date() },
  idFactory = randomUUID,
) {
  validateCampaignAuthority(registry);
  const occurredAt = nowIso(now);
  requireCapability(registry, actorSubjectId, 'manageMembers', occurredAt);
  const membership = activeMembership(registry, subjectId, occurredAt);
  if (!membership) throw new Error(`Subject ${subjectId} has no active membership.`);
  if (membership.role === 'owner') throw new Error('Transfer ownership before revoking the owner.');
  const next = clone(registry);
  const target = next.memberships.find((candidate) => candidate.id === membership.id);
  target.status = 'revoked';
  target.revokedAt = occurredAt;
  target.revokedBy = actorSubjectId;
  next.audit.push(
    auditEvent(
      next,
      'membership.revoked',
      actorSubjectId,
      { targetSubjectId: subjectId, membershipId: membership.id, reasonCode },
      occurredAt,
      idFactory,
    ),
  );
  return validateCampaignAuthority(next);
}

export function beginOwnershipTransfer(
  registry,
  { actorSubjectId, toSubjectId, expiresAt, now = new Date() },
  idFactory = randomUUID,
) {
  validateCampaignAuthority(registry);
  const occurredAt = nowIso(now);
  requireCapability(registry, actorSubjectId, 'transferOwnership', occurredAt);
  const owner = activeMembership(registry, actorSubjectId, occurredAt);
  if (owner?.role !== 'owner') throw new Error('Only the current owner can start a transfer.');
  const target = activeMembership(registry, toSubjectId, occurredAt);
  if (!target || target.role === 'owner') {
    throw new Error('Ownership transfer target needs an active non-owner membership.');
  }
  if (registry.pendingTransfer) throw new Error('An ownership transfer is already pending.');
  const normalizedExpiry = nowIso(expiresAt);
  if (new Date(normalizedExpiry) <= new Date(occurredAt)) {
    throw new Error('Ownership transfer expiry must be in the future.');
  }
  const next = clone(registry);
  const transfer = {
    id: stableId('transfer', idFactory),
    fromSubjectId: actorSubjectId,
    toSubjectId,
    requestedAt: occurredAt,
    expiresAt: normalizedExpiry,
  };
  next.claimState = 'transfer-pending';
  next.pendingTransfer = transfer;
  next.audit.push(
    auditEvent(
      next,
      'ownership.transfer-started',
      actorSubjectId,
      { targetSubjectId: toSubjectId, transferId: transfer.id },
      occurredAt,
      idFactory,
    ),
  );
  return validateCampaignAuthority(next);
}

export function acceptOwnershipTransfer(
  registry,
  { actorSubjectId, now = new Date() },
  idFactory = randomUUID,
) {
  validateCampaignAuthority(registry);
  const occurredAt = nowIso(now);
  const transfer = registry.pendingTransfer;
  if (!transfer || registry.claimState !== 'transfer-pending') {
    throw new Error('No ownership transfer is pending.');
  }
  if (transfer.toSubjectId !== actorSubjectId) {
    throw new Error('Only the nominated successor can accept ownership.');
  }
  if (new Date(transfer.expiresAt) <= new Date(occurredAt)) {
    throw new Error('Ownership transfer has expired; the current owner retains control.');
  }
  const target = activeMembership(registry, actorSubjectId, occurredAt);
  const owner = activeMembership(registry, transfer.fromSubjectId, occurredAt);
  if (!target || !owner || owner.role !== 'owner') {
    throw new Error('Ownership transfer participants are no longer eligible.');
  }
  const next = clone(registry);
  next.memberships.find((candidate) => candidate.id === owner.id).role = 'gm';
  next.memberships.find((candidate) => candidate.id === target.id).role = 'owner';
  next.claimState = 'claimed';
  delete next.pendingTransfer;
  next.audit.push(
    auditEvent(
      next,
      'ownership.transferred',
      actorSubjectId,
      {
        previousOwnerSubjectId: transfer.fromSubjectId,
        targetSubjectId: actorSubjectId,
        transferId: transfer.id,
      },
      occurredAt,
      idFactory,
    ),
  );
  return validateCampaignAuthority(next);
}

export function cancelOwnershipTransfer(
  registry,
  { actorSubjectId, reasonCode = 'owner-cancelled', now = new Date() },
  idFactory = randomUUID,
) {
  validateCampaignAuthority(registry);
  const occurredAt = nowIso(now);
  requireCapability(registry, actorSubjectId, 'transferOwnership', occurredAt);
  if (!registry.pendingTransfer) throw new Error('No ownership transfer is pending.');
  const next = clone(registry);
  const transferId = next.pendingTransfer.id;
  delete next.pendingTransfer;
  next.claimState = 'claimed';
  next.audit.push(
    auditEvent(
      next,
      'ownership.transfer-cancelled',
      actorSubjectId,
      { transferId, reasonCode },
      occurredAt,
      idFactory,
    ),
  );
  return validateCampaignAuthority(next);
}

export function publicCampaignAuthority(registry, { publicCampaign = true } = {}) {
  validateCampaignAuthority(registry);
  return {
    version: registry.version,
    campaignId: registry.campaignId,
    trustMode: registry.trustMode,
    claimState: registry.claimState,
    publicAccess: publicCampaign ? 'anonymous-read' : 'members-only',
  };
}
