import { Injectable, signal } from '@angular/core';

interface InstallChoice {
  readonly outcome: 'accepted' | 'dismissed';
  readonly platform: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<InstallChoice>;
  prompt(): Promise<void>;
}

/** Exposes the browser-owned PWA install prompt without inventing a fake install flow. */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: BeforeInstallPromptEvent | undefined;

  readonly canInstall = signal(false);
  readonly isInstalled = signal(this.detectStandaloneMode());

  constructor() {
    window.addEventListener('beforeinstallprompt', (event: Event): void => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(!this.isInstalled());
    });

    window.addEventListener('appinstalled', (): void => {
      this.deferredPrompt = undefined;
      this.canInstall.set(false);
      this.isInstalled.set(true);
    });
  }

  /** Opens the native browser prompt and consumes it exactly once. */
  async install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    const prompt = this.deferredPrompt;
    if (prompt === undefined) {
      return 'unavailable';
    }

    await prompt.prompt();
    const choice = await prompt.userChoice;
    this.deferredPrompt = undefined;
    this.canInstall.set(false);
    return choice.outcome;
  }

  private detectStandaloneMode(): boolean {
    const navigatorWithStandalone = navigator as Navigator & { readonly standalone?: boolean };
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      navigatorWithStandalone.standalone === true
    );
  }
}
