/**
 * Stores the progress of the lightweight Companion demo tour.
 * The state is local orientation only and never changes campaign permissions.
 */

import { computed, Injectable, type Signal } from '@angular/core';

import { persistedSignal } from '@guild/utils/persistedSignal';

export type GuidedTourStatus = 'idle' | 'active' | 'paused' | 'completed';

export interface GuidedTourState {
  readonly version: 1;
  readonly status: GuidedTourStatus;
  readonly step: number;
  readonly campaignId?: string;
}

export const GUIDED_TOUR_STEP_COUNT = 5;

const INITIAL_STATE: GuidedTourState = {
  version: 1,
  status: 'idle',
  step: 0,
};

function isGuidedTourState(value: unknown): value is GuidedTourState {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<GuidedTourState>;
  return (
    candidate.version === 1 &&
    (candidate.status === 'idle' ||
      candidate.status === 'active' ||
      candidate.status === 'paused' ||
      candidate.status === 'completed') &&
    typeof candidate.step === 'number' &&
    Number.isInteger(candidate.step) &&
    candidate.step >= 0 &&
    candidate.step < GUIDED_TOUR_STEP_COUNT &&
    (candidate.campaignId === undefined ||
      (typeof candidate.campaignId === 'string' && candidate.campaignId.length > 0))
  );
}

@Injectable({ providedIn: 'root' })
export class GuidedTourService {
  private readonly storedState = persistedSignal<GuidedTourState>(
    'guided-demo-tour-v1',
    INITIAL_STATE,
    isGuidedTourState,
  );

  readonly state: Signal<GuidedTourState> = this.storedState.asReadonly();
  readonly status = computed((): GuidedTourStatus => this.state().status);
  readonly isActive = computed((): boolean => this.status() === 'active');
  readonly isCompleted = computed((): boolean => this.status() === 'completed');

  /** Starts a new tour or resumes the remembered unfinished step. */
  open(): void {
    const current = this.state();
    if (current.status === 'completed' || current.status === 'idle') {
      this.storedState.set({ ...INITIAL_STATE, status: 'active' });
      return;
    }
    this.storedState.set({ ...current, status: 'active' });
  }

  /** Hides the guide while preserving the exact step and campaign. */
  pause(): void {
    const current = this.state();
    if (current.status === 'active') {
      this.storedState.set({ ...current, status: 'paused' });
    }
  }

  /** Starts again from the selector without retaining a previous campaign. */
  restart(): void {
    this.storedState.set({ ...INITIAL_STATE, status: 'active' });
  }

  /** Associates the tour with the campaign the visitor explicitly opened. */
  attachCampaign(campaignId: string): void {
    const current = this.state();
    if (current.status !== 'active' || current.step === 0 || current.campaignId === campaignId) {
      return;
    }
    this.storedState.set({ ...current, campaignId });
  }

  advance(): void {
    const current = this.state();
    const nextStep = Math.min(current.step + 1, GUIDED_TOUR_STEP_COUNT - 1);
    this.storedState.set({ ...current, status: 'active', step: nextStep });
  }

  back(): void {
    const current = this.state();
    this.storedState.set({ ...current, status: 'active', step: Math.max(current.step - 1, 0) });
  }

  complete(): void {
    const current = this.state();
    this.storedState.set({ ...current, status: 'completed' });
  }
}
