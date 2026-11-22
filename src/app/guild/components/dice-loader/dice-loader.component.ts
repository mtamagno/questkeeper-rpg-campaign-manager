/**
 * Shared loading indicator displaying a stylized spinning d20.
 * Plays the dice-roll SFX once on init by default; opt-out with
 * `[playSound]="false"` for silent or high-frequency contexts.
 *
 * Reduced-motion fallback: the spin is replaced by a gentle gold
 * pulse-glow (no rotation), preserving the visual cue without motion.
 */

import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  computed,
  inject,
  input,
  type Signal,
} from '@angular/core';

import { AudioService } from '@guild/services/audio.service';
import { UiTextService } from '@guild/services/uiText.service';
import { SFX } from '@guild/constants/sfx.constant';

@Component({
  selector: 'app-dice-loader',
  standalone: true,
  imports: [],
  templateUrl: './dice-loader.component.html',
  styleUrl: './dice-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    'aria-live': 'polite',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class DiceLoaderComponent implements OnInit {
  private readonly audio = inject(AudioService);
  private readonly uiText = inject(UiTextService);

  /** Pixel size of the dice icon (square). */
  readonly size = input<number>(64);

  /** Optional caption rendered below the dice (e.g. "Loading…"). */
  readonly label = input<string>('');

  /**
   * Whether to play the dice-roll SFX once on initialization.
   * Default `true` — opt-out by binding `[playSound]="false"` for
   * silent or high-frequency loaders.
   */
  readonly playSound = input<boolean>(true);

  /**
   * Accessible label for the host element. Uses the explicit `label`
   * input when present, otherwise a localized fallback.
   */
  readonly ariaLabel: Signal<string> = computed((): string => {
    const explicit = this.label();
    if (explicit.length > 0) {
      return explicit;
    }
    return this.uiText.text('common.loading');
  });

  ngOnInit(): void {
    if (this.playSound()) {
      this.audio.play(SFX.DICE_ROLL, { ignoreThrottle: true });
    }
  }
}
