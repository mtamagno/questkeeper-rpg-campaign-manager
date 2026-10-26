const runtimeSelectionImport = /const\s*\{\s*discoverNodePaths,\s*npmCliCandidates,\s*validateRuntimeCandidate,\s*\}\s*=\s*require\(['"]\.\/runtime-selection\.cjs['"]\);/m;
const storagePathsImport = /const\s*\{\s*materializeCampaigns,\s*prepareStorage,\s*publicStorageSummary,\s*resolveStoragePaths,\s*\}\s*=\s*require\(['"]\.\.\/storage-paths\.cjs['"]\);/m;

function embedRuntimeSelection(serverSource, runtimeSelectionSource) {
  if (!runtimeSelectionImport.test(serverSource)) {
    throw new Error('The setup server runtime-selection import could not be bundled.');
  }
  const embeddedRuntime = `const __questkeeperRuntimeSelection = (() => {
  const module = { exports: {} };
  const exports = module.exports;
  ((module, exports) => {
${runtimeSelectionSource}
  })(module, exports);
  return module.exports;
})();
const { discoverNodePaths, npmCliCandidates, validateRuntimeCandidate } =
  __questkeeperRuntimeSelection;`;
  return serverSource.replace(runtimeSelectionImport, embeddedRuntime);
}

function embedStoragePaths(serverSource, storagePathsSource) {
  if (!storagePathsImport.test(serverSource)) {
    throw new Error('The setup server storage-paths import could not be bundled.');
  }
  const embeddedStorage = `const __questkeeperStoragePaths = (() => {
  const module = { exports: {} };
  const exports = module.exports;
  ((module, exports) => {
${storagePathsSource}
  })(module, exports);
  return module.exports;
})();
const { materializeCampaigns, prepareStorage, publicStorageSummary, resolveStoragePaths } =
  __questkeeperStoragePaths;`;
  return serverSource.replace(storagePathsImport, embeddedStorage);
}

module.exports = { embedRuntimeSelection, embedStoragePaths };
