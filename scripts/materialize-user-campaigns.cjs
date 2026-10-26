const path = require('node:path');

const { materializeCampaigns, prepareStorage } = require('../tools/storage-paths.cjs');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  await prepareStorage(projectRoot);
  const result = await materializeCampaigns(projectRoot);
  console.log(
    result.changed
      ? `Prepared the replaceable campaign build mirror from ${result.paths.campaignsRoot}.`
      : 'Campaign build input already uses the active storage root.',
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
