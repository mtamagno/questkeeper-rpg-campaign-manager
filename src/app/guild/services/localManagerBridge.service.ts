import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal, type Signal } from '@angular/core';

interface ManagerHandshake {
  readonly managerUrl: string;
  readonly campaignId?: string;
}

const SESSION_KEY = 'questkeeper-local-manager-bridge:v1';

function trustedLoopbackOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
      return undefined;
    }
    return url.origin;
  } catch {
    return undefined;
  }
}

/**
 * Enables an Open Manager link only inside a loopback Companion tab opened by
 * the authenticated local Campaign Manager. Hosted sites never expose it.
 */
@Injectable({ providedIn: 'root' })
export class LocalManagerBridgeService {
  private readonly document = inject(DOCUMENT);
  private readonly _managerUrl = signal<string | undefined>(undefined);
  readonly managerUrl: Signal<string | undefined> = this._managerUrl.asReadonly();

  constructor() {
    void this.initialize();
  }

  open(campaignId?: string): void {
    const managerUrl = this._managerUrl();
    const browserWindow = this.document.defaultView;
    if (managerUrl === undefined || browserWindow === null) return;
    const destination = new URL(managerUrl);
    if (campaignId) destination.searchParams.set('campaign', campaignId);
    browserWindow.open(destination.toString(), '_blank', 'noopener');
  }

  private async initialize(): Promise<void> {
    const browserWindow = this.document.defaultView;
    if (
      browserWindow === null ||
      !['127.0.0.1', 'localhost'].includes(browserWindow.location.hostname)
    ) {
      return;
    }

    const current = new URL(browserWindow.location.href);
    const managerUrl = trustedLoopbackOrigin(current.searchParams.get('qkManager') ?? '');
    const handshake = current.searchParams.get('qkHandshake') ?? '';
    current.searchParams.delete('qkManager');
    current.searchParams.delete('qkHandshake');
    if (managerUrl !== undefined || handshake.length > 0) {
      browserWindow.history.replaceState(
        {},
        '',
        `${current.pathname}${current.search}${current.hash}`,
      );
    }

    if (managerUrl !== undefined && /^[a-f0-9]{48}$/.test(handshake)) {
      try {
        const response = await browserWindow.fetch(
          `${managerUrl}/api/companion-handshake?token=${encodeURIComponent(handshake)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) return;
        const result = (await response.json()) as ManagerHandshake;
        const verified = trustedLoopbackOrigin(result.managerUrl);
        if (verified !== managerUrl) return;
        browserWindow.sessionStorage.setItem(SESSION_KEY, verified);
        this._managerUrl.set(verified);
        return;
      } catch {
        return;
      }
    }

    const remembered = trustedLoopbackOrigin(
      browserWindow.sessionStorage.getItem(SESSION_KEY) ?? '',
    );
    if (remembered !== undefined) this._managerUrl.set(remembered);
  }
}
