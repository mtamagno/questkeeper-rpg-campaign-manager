import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CURATED_PALETTE_ROLES,
  contrastRatio,
  customPaletteContrastReport,
  normalizeCustomPalette,
  safeCustomPalette,
} from '../campaign-palettes.mjs';

test('all curated palettes satisfy the custom semantic contrast contract', () => {
  for (const roles of Object.values(CURATED_PALETTE_ROLES)) {
    assert.equal(
      customPaletteContrastReport(roles).every((entry) => entry.passes),
      true,
    );
  }
});

test('normalizes a safe versioned custom palette', () => {
  const custom = normalizeCustomPalette({
    name: '  Moonlit Archive  ',
    base: 'neutral',
    roles: CURATED_PALETTE_ROLES.neutral,
  });
  assert.equal(custom.version, 1);
  assert.equal(custom.validated, true);
  assert.match(custom.onAccent, /^#[0-9A-F]{6}$/);
  assert.equal(custom.name, 'Moonlit Archive');
  assert.equal(custom.base, 'neutral');
  assert.equal(custom.roles.background, '#101318');
});

test('rejects malformed colours and explains unsafe contrast', () => {
  assert.throws(
    () =>
      normalizeCustomPalette({
        roles: { ...CURATED_PALETTE_ROLES.heroic, text: 'gold' },
      }),
    /six-digit hexadecimal/,
  );
  assert.throws(
    () =>
      normalizeCustomPalette({
        roles: { ...CURATED_PALETTE_ROLES.heroic, text: '#111118' },
      }),
    /text on background.*use at least 4\.5:1/,
  );
});

test('legacy invalid drafts fall back without mutating their stored value', () => {
  const draft = { version: 1, roles: { background: '#000000' } };
  assert.equal(safeCustomPalette(draft), undefined);
  assert.deepEqual(draft, { version: 1, roles: { background: '#000000' } });
});

test('contrast ratio follows WCAG luminance ordering', () => {
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(contrastRatio('#FFFFFF', '#000000'), 21);
});
