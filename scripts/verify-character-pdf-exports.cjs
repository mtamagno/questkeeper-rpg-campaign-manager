const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
const service = read(
  'src/app/adventurers/services/campaignCharacterSheetPdf.service.ts',
);
const component = read(
  'src/app/adventurers/components/character-sheet/character-sheet.component.ts',
);
const template = read(
  'src/app/adventurers/components/character-sheet/character-sheet.component.html',
);
const exportTemplate = read(
  'src/app/adventurers/components/character-pdf-export/character-pdf-export.component.html',
);
const exportComponent = read(
  'src/app/adventurers/components/character-pdf-export/character-pdf-export.component.ts',
);
const detail = read(
  'src/app/adventurers/pages/character-detail/character-detail.component.html',
);
const catalog = JSON.parse(read('src/app/guild/i18n/ui.json'));

for (const variant of ['complete', 'print', 'share', 'game-night']) {
  assert.match(service, new RegExp(`'${variant}'`), `${variant} PDF variant is missing.`);
  assert.match(exportComponent, new RegExp(`id: '${variant}'`), `${variant} selector is missing.`);
}

assert.match(service, /export type CampaignPdfVariant/);
assert.match(service, /drawStoryPages/);
assert.match(service, /drawGameNightPage/);
assert.match(service, /variant === 'print'/);
assert.match(service, /variant === 'share'/);
assert.match(service, /contentBottom: 279/);
assert.match(service, /const journeyY = profileEnd \+ 9/);
assert.match(service, /journeyY \+ 22 <= PAGE\.contentBottom/);
assert.match(
  service,
  /leftY = drawProfileText\([\s\S]+?'Ideali' : 'Ideals'/,
  'The left profile cursor must include the Ideals block before placing the journey seal.',
);
assert.match(service, /while \(remainingLines\.length > 0\)/);
assert.match(service, /remainingLines = remainingLines\.slice\(pageLines\.length\)/);
assert.doesNotMatch(service, /const visibleLines = bodyLines\.slice/);
assert.match(service, /No entries recorded/);
assert.match(service, /body:\s*sheet\.features\.length > 0/);
assert.match(service, /inventoryRows\.length > 0 \? inventoryRows/);
assert.match(service, /const spellTableStartPage = doc\.getNumberOfPages\(\)/);
assert.match(
  service,
  /margin: \{ top: 35, right: PAGE\.margin, bottom: 18, left: PAGE\.margin \}/,
);
assert.match(service, /willDrawPage:/);
assert.match(service, /Dotazioni e magia - continua/);
for (const completeProfileField of [
  'profile.backstory',
  'profile.knownHistory',
  'profile.traits',
  'profile.ideals',
  'profile.bonds',
  'profile.flaws',
]) {
  assert.match(
    service,
    new RegExp(completeProfileField.replace('.', '\\.')),
    `${completeProfileField} is missing from paginated story output.`,
  );
}
assert.match(template, /app-character-pdf-export/);
assert.match(exportTemplate, /role="radiogroup"/);
assert.match(exportTemplate, /type="radio"/);
assert.match(exportTemplate, /characterPdf\.privacyHelp/);
assert.match(exportTemplate, /generateRequested\.emit\(selectedVariant\(\)\)/);

for (const input of ['loreChapters', 'diary', 'quotes']) {
  assert.match(detail, new RegExp(`\\[${input}\\]`), `${input} is not passed to the PDF builder.`);
}

for (const locale of ['en', 'it']) {
  const pdfCopy = catalog.locales?.[locale]?.texts?.characterPdf;
  assert.ok(pdfCopy, `${locale} characterPdf catalog is missing.`);
  assert.ok(pdfCopy.privacyHelp, `${locale} PDF privacy guidance is missing.`);
  for (const variant of ['complete', 'print', 'share', 'gameNight']) {
    assert.ok(pdfCopy.variants?.[variant]?.title, `${locale}/${variant} title is missing.`);
    assert.ok(
      pdfCopy.variants?.[variant]?.description,
      `${locale}/${variant} description is missing.`,
    );
  }
}

for (const protectedInput of ['privateProfile', 'password', 'notebook']) {
  assert.doesNotMatch(
    service,
    new RegExp(`readonly ${protectedInput}\\??:`),
    `${protectedInput} must not enter the PDF generator contract.`,
  );
}

console.log('Character PDF export variants and privacy boundary verified.');
