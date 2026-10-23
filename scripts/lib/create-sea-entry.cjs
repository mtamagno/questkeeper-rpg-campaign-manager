const runtimeSelectionImport = /const\s*\{\s*discoverNodePaths,\s*npmCliCandidates,\s*validateRuntimeCandidate,\s*\}\s*=\s*require\(['"]\.\/runtime-selection\.cjs['"]\);/m;

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

module.exports = { embedRuntimeSelection };
