export const COMPANION_URL = 'http://127.0.0.1:4200';

export async function probeCompanion(fetchImpl = globalThis.fetch, url = COMPANION_URL) {
  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(1_200) });
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

export function resolveCompanionControl({ dependenciesReady, job, probe, url = COMPANION_URL }) {
  const port = new URL(url).port || '4200';
  if (!dependenciesReady) {
    return {
      action: 'prepare',
      label: 'Start Companion',
      status: 'Prepare the project first.',
      url,
    };
  }
  if (probe.questKeeper) {
    return { action: 'open', label: 'Open Companion', status: 'Ready', url };
  }
  if (probe.reachable) {
    return {
      action: 'retry',
      label: 'Retry',
      status: `Port ${port} is used by another application.`,
      url,
    };
  }
  if (job?.status === 'running' || job?.status === 'stopping') {
    return {
      action: 'wait',
      label: 'Starting…',
      status: 'Waiting for the Companion to become ready…',
      url,
    };
  }
  if (job?.status === 'failed') {
    return {
      action: 'retry',
      label: 'Retry',
      status: 'Startup failed. Review the preview log and try again.',
      url,
    };
  }
  return { action: 'start', label: 'Start Companion', status: 'Not started', url };
}
