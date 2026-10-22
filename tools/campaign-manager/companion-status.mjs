export const COMPANION_URL = 'http://127.0.0.1:4200';

export async function probeCompanion(fetchImpl = globalThis.fetch) {
  try {
    const response = await fetchImpl(COMPANION_URL, { signal: AbortSignal.timeout(1_200) });
    if (!response.ok) return { reachable: true, questKeeper: false };
    const html = await response.text();
    return {
      reachable: true,
      questKeeper:
        html.includes('name="application-name" content="QuestKeeper"') ||
        html.includes('<app-root'),
    };
  } catch {
    return { reachable: false, questKeeper: false };
  }
}

export function resolveCompanionControl({ dependenciesReady, job, probe }) {
  if (!dependenciesReady) {
    return {
      action: 'prepare',
      label: 'Start Companion',
      status: 'Prepare the project first.',
      url: COMPANION_URL,
    };
  }
  if (probe.questKeeper) {
    return { action: 'open', label: 'Open Companion', status: 'Ready', url: COMPANION_URL };
  }
  if (probe.reachable) {
    return {
      action: 'retry',
      label: 'Retry',
      status: 'Port 4200 is used by another application.',
      url: COMPANION_URL,
    };
  }
  if (job?.status === 'running' || job?.status === 'stopping') {
    return {
      action: 'wait',
      label: 'Starting…',
      status: 'Waiting for the Companion to become ready…',
      url: COMPANION_URL,
    };
  }
  if (job?.status === 'failed') {
    return {
      action: 'retry',
      label: 'Retry',
      status: 'Startup failed. Review the preview log and try again.',
      url: COMPANION_URL,
    };
  }
  return { action: 'start', label: 'Start Companion', status: 'Not started', url: COMPANION_URL };
}
