import { Injectable, signal, type Signal } from '@angular/core';

export type DeviceStorageMode = 'persistent' | 'session';

/** Detects whether browser-local preferences can actually be persisted. */
@Injectable({ providedIn: 'root' })
export class DeviceStorageStatusService {
  private readonly modeSignal = signal<DeviceStorageMode>(this.detect());

  readonly mode: Signal<DeviceStorageMode> = this.modeSignal.asReadonly();

  /** Re-check after a setting write so the interface never promises a save that failed. */
  verify(): DeviceStorageMode {
    const mode = this.detect();
    this.modeSignal.set(mode);
    return mode;
  }

  private detect(): DeviceStorageMode {
    if (typeof localStorage === 'undefined') return 'session';
    const key = 'questkeeper:storage-probe';
    try {
      const previous = localStorage.getItem(key);
      localStorage.setItem(key, 'ok');
      if (previous === null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
      return 'persistent';
    } catch {
      return 'session';
    }
  }
}
