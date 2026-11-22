import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { DiceLoaderComponent } from '@guild/components/dice-loader/dice-loader.component';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { CampaignService } from '@guild/services/campaign.service';
import { DataService } from '@guild/services/data.service';
import { JourneyMemoryService } from '@guild/services/journeyMemory.service';
import { UiTextService } from '@guild/services/uiText.service';

@Component({
  selector: 'app-shared-memory-detail',
  standalone: true,
  imports: [RouterLink, BilingualTextPipe, DiceLoaderComponent, LanguageToggleComponent],
  templateUrl: './shared-memory-detail.component.html',
  styleUrl: './shared-memory-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedMemoryDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(DataService);
  private readonly campaign = inject(CampaignService);
  private readonly campaignLocale = inject(CampaignLocaleService);
  private readonly journeyMemory = inject(JourneyMemoryService);
  readonly uiText = inject(UiTextService);

  readonly campaignId = this.campaign.activeCampaignId;
  readonly isLoading = this.data.isLoading;
  private readonly memoryId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('memoryId') ?? '')),
    { initialValue: '' },
  );
  readonly memory = computed(() => this.data.getSharedMemoryById(this.memoryId())());
  readonly participants = computed(() => {
    const memory = this.memory();
    if (!memory) return [];
    return memory.participantIds.flatMap((id) => {
      const character = this.data.getCharacterById(id)();
      return character ? [character] : [];
    });
  });
  readonly viewpoints = computed(() => {
    const memory = this.memory();
    if (!memory) return [];
    return memory.viewpoints.flatMap((viewpoint) => {
      const character = this.data.getCharacterById(viewpoint.entityId)();
      return character ? [{ character, account: viewpoint.account }] : [];
    });
  });
  readonly differences = computed(() =>
    (this.memory()?.differences ?? []).map((difference) => ({
      topic: difference.topic,
      accounts: difference.accounts.flatMap((account) => {
        const character = this.data.getCharacterById(account.entityId)();
        return character ? [{ character, account: account.account }] : [];
      }),
    })),
  );
  readonly relationshipRoute = computed(() => {
    const ids = this.memory()?.participantIds ?? [];
    return ['/', this.campaignId() ?? '', 'relationships', ids[0] ?? '', ids[1] ?? ''];
  });
  readonly isFavourite = computed(() => {
    this.journeyMemory.favoritePages();
    return this.journeyMemory.isFavoriteUrl(this.memoryUrl());
  });

  private memoryUrl(): string {
    return `/${this.campaignId() ?? ''}/memories/${this.memoryId()}`;
  }

  toggleFavourite(): void {
    const campaignId = this.campaignId();
    const memory = this.memory();
    if (campaignId === undefined || memory === undefined) return;
    this.journeyMemory.toggleFavorite({
      campaignId,
      url: this.memoryUrl(),
      title: this.campaignLocale.resolve(memory.title),
      visitedAt: Date.now(),
    });
  }
}
