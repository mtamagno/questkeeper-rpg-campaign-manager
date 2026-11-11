/**
 * Maps overview page — grid of location cards linking to detail pages.
 */

import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
  type Signal,
} from '@angular/core';

import { DataService } from '@guild/services/data.service';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { UiTextService } from '@guild/services/uiText.service';
import { DiceLoaderComponent } from '@guild/components/dice-loader/dice-loader.component';
import { type GameMap } from '@guild/models/map.model';
import { MapCardComponent } from '../../components/map-card/map-card.component';

/**
 * Displays all visited locations as a responsive card grid.
 * Each card links to the map detail page.
 */
@Component({
  selector: 'app-maps-overview',
  standalone: true,
  imports: [MapCardComponent, DiceLoaderComponent],
  templateUrl: './maps-overview.component.html',
  styleUrl: './maps-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsOverviewComponent {
  private readonly dataService = inject(DataService);
  private readonly campaignLocale = inject(CampaignLocaleService);
  readonly uiText = inject(UiTextService);

  readonly query = signal('');
  readonly status = signal<'all' | GameMap['explorationStatus']>('all');

  /** Whether data is still loading. */
  readonly isLoading: Signal<boolean> = this.dataService.isLoading;

  /** All map locations. */
  readonly maps: Signal<ReadonlyArray<GameMap>> = this.dataService.maps;

  readonly visibleMaps = computed(() => {
    const query = normalizeSearchValue(this.query());
    const status = this.status();
    return this.maps().filter((location) => {
      if (status !== 'all' && location.explorationStatus !== status) return false;
      if (query.length === 0) return true;
      return [location.name, location.region, location.description].some((value) =>
        normalizeSearchValue(this.campaignLocale.resolve(value)).includes(query),
      );
    });
  });

  updateQuery(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) this.query.set(input.value);
  }

  setStatus(status: 'all' | GameMap['explorationStatus']): void {
    this.status.set(status);
  }

  clearFilters(): void {
    this.query.set('');
    this.status.set('all');
  }
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}
