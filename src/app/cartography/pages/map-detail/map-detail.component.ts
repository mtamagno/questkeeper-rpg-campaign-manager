/**
 * Map detail page — full location view with image gallery and discoveries.
 */

import { Component, ChangeDetectionStrategy, inject, computed, type Signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { DataService } from '@guild/services/data.service';
import { type GameMap } from '@guild/models/map.model';
import { ImageGalleryComponent } from '@guild/components/image-gallery/image-gallery.component';
import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { DiceLoaderComponent } from '@guild/components/dice-loader/dice-loader.component';
import { CampaignService } from '@guild/services/campaign.service';
import { UiTextService } from '@guild/services/uiText.service';

/**
 * Displays a single location's full detail: description, map images, discoveries list.
 */
@Component({
  selector: 'app-map-detail',
  standalone: true,
  imports: [
    RouterLink,
    ImageGalleryComponent,
    BilingualTextPipe,
    LanguageToggleComponent,
    DiceLoaderComponent,
  ],
  templateUrl: './map-detail.component.html',
  styleUrl: './map-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(DataService);
  private readonly campaignService = inject(CampaignService);
  readonly uiText = inject(UiTextService);

  readonly campaignId = this.campaignService.activeCampaignId;

  /** Map ID from route params. */
  private readonly mapId: Signal<string | undefined> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? undefined)),
  );

  /** The loaded map data. */
  readonly location: Signal<GameMap | undefined> = computed(() => {
    const id = this.mapId();
    if (id === undefined) {
      return undefined;
    }
    return this.dataService.getMapById(id)();
  });

  /** Whether data is still loading. */
  readonly isLoading: Signal<boolean> = this.dataService.isLoading;

  private readonly locationIndex = computed(() => {
    const id = this.mapId();
    return id === undefined ? -1 : this.dataService.maps().findIndex((entry) => entry.id === id);
  });

  readonly previousLocation = computed(() => {
    const index = this.locationIndex();
    return index > 0 ? this.dataService.maps()[index - 1] : undefined;
  });

  readonly nextLocation = computed(() => {
    const index = this.locationIndex();
    const locations = this.dataService.maps();
    return index >= 0 && index < locations.length - 1 ? locations[index + 1] : undefined;
  });
}
