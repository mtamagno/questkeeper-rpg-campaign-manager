/**
 * Language service — manages the active display language for the compendium.
 * Persists the user's choice in localStorage so it survives page refreshes.
 */

import { Injectable, computed, signal, type Signal, type WritableSignal } from '@angular/core';

import { type SupportedLanguage } from '@guild/models/language.model';

const STORAGE_KEY = 'campaign_companion_language';
const FOLLOW_CONTENT_STORAGE_KEY = 'questkeeper:interface-follows-content:v1';
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
const LANGUAGE_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;

function interfaceLanguageForContent(locale: string): SupportedLanguage | undefined {
  const base = locale.trim().toLowerCase().split('-')[0];
  return base === 'en' || base === 'it' ? base : undefined;
}

/**
 * Singleton service that exposes the current display language as a signal.
 * The choice is persisted in localStorage.
 *
 * @example
 * ```typescript
 * private readonly languageService = inject(LanguageService);
 * readonly lang = this.languageService.currentLanguage;
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly _currentLanguage: WritableSignal<SupportedLanguage>;
  private readonly _followsContentLanguage: WritableSignal<boolean>;

  /** The currently active display language. */
  readonly currentLanguage: Signal<SupportedLanguage>;
  readonly followsContentLanguage: Signal<boolean>;

  /**
   * Convenience derived signal: `true` when the active language is Italian.
   * Prefer this over locally re-deriving `currentLanguage() === 'it'` in
   * every consumer (DRY).
   */
  readonly isItalian: Signal<boolean>;

  constructor() {
    this._currentLanguage = signal(this.loadFromStorage());
    this._followsContentLanguage = signal(this.loadFollowPreference());
    this.currentLanguage = this._currentLanguage.asReadonly();
    this.followsContentLanguage = this._followsContentLanguage.asReadonly();
    this.isItalian = computed((): boolean => this._currentLanguage() === 'it');
  }

  /**
   * Legacy convenience toggle between English and Italian.
   */
  toggle(): void {
    const next: SupportedLanguage = this._currentLanguage() === 'en' ? 'it' : 'en';
    this.setLanguage(next);
  }

  /**
   * Sets the display language explicitly.
   * @param language - The language to activate.
   */
  setLanguage(language: SupportedLanguage): void {
    const normalized = this.normalize(language);
    if (normalized === undefined) return;
    this._currentLanguage.set(normalized);
    this.saveToStorage(normalized);
  }

  /** Keeps the interface aligned when the reader chooses a supported content locale. */
  followContentLanguage(locale: string): void {
    if (!this._followsContentLanguage()) return;
    const language = interfaceLanguageForContent(locale);
    if (language !== undefined) this.setLanguage(language);
  }

  /** Enables or disables the default link between campaign content and interface copy. */
  setFollowsContentLanguage(enabled: boolean): void {
    this._followsContentLanguage.set(enabled);
    try {
      localStorage.setItem(FOLLOW_CONTENT_STORAGE_KEY, String(enabled));
    } catch {
      // Preferences remain usable for the current visit when storage is unavailable.
    }
  }

  /**
   * Loads the stored language from localStorage.
   * Falls back to the default language if no valid value is found.
   */
  private loadFromStorage(): SupportedLanguage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const normalized = stored === null ? undefined : this.normalize(stored);
      if (normalized !== undefined) return normalized;
      return DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  }

  private loadFollowPreference(): boolean {
    try {
      return localStorage.getItem(FOLLOW_CONTENT_STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  }

  /**
   * Persists the language choice to localStorage.
   * @param language - The language to save.
   */
  private saveToStorage(language: SupportedLanguage): void {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // localStorage may be unavailable — fail silently
    }
  }

  /** Normalizes a user-provided language code without limiting the language list. */
  private normalize(language: string): SupportedLanguage | undefined {
    const [base = '', region] = language.trim().replace('_', '-').split('-');
    const normalized = region
      ? `${base.toLowerCase()}-${region.toUpperCase()}`
      : base.toLowerCase();
    return LANGUAGE_PATTERN.test(normalized) ? normalized : undefined;
  }
}
