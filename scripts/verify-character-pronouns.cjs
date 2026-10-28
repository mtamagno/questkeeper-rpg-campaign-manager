#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const characterModel = read('src', 'app', 'guild', 'models', 'character.model.ts');
const profile = read('src', 'app', 'guild', 'models', 'rulesetProfile.model.ts');
const detail = read(
  'src',
  'app',
  'adventurers',
  'pages',
  'character-detail',
  'character-detail.component.html',
);
const pdf = read('src', 'app', 'adventurers', 'services', 'campaignCharacterSheetPdf.service.ts');
const manager = read('tools', 'campaign-manager', 'public', 'app.js');
const ai = read('tools', 'campaign-manager', 'ai-service.mjs');

assert.match(characterModel, /readonly pronouns\?: BilingualText/);
assert.match(profile, /RulesetPresentationKey = 'sex' \| 'pronouns'/);
assert.match(profile, /presentationFields: base\.presentationFields/);
assert.match(detail, /char\.pronouns && isRecorded\(char\.pronouns\)/);
assert.match(detail, /\{\{ char\.pronouns \| bilingual \}\}/);
assert.match(pdf, /readonly pronouns\?: BilingualText/);
assert.match(pdf, /if \(pronouns\.trim\(\)\)/);
assert.match(manager, /activePresentationFields\(\)/);
assert.match(manager, /delete item\.pronouns/);
assert.match(manager, /pronouns: draft\.pronouns/);
assert.match(ai, /Never infer pronouns from a portrait, name, voice, or sex\/gender/);
assert.match(ai, /Copy pronouns only when the source states them explicitly/);

console.log(
  'Character pronoun contract verified: optional localized data, ruleset-aware authoring, conditional display/PDF and no AI inference.',
);
