import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { ImageLightboxComponent } from '@guild/components/image-lightbox/image-lightbox.component';
import {
  type CharacterKeepsake,
  type CharacterKeepsakeKind,
  type CharacterStoryReference,
} from '@guild/models/character.model';
import { CampaignService } from '@guild/services/campaign.service';
import { UiTextService } from '@guild/services/uiText.service';

@Component({
  selector: 'app-character-keepsakes',
  standalone: true,
  imports: [BilingualTextPipe, ImageLightboxComponent, RouterLink],
  templateUrl: './character-keepsakes.component.html',
  styleUrl: './character-keepsakes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterKeepsakesComponent {
  readonly uiText = inject(UiTextService);
  private readonly campaignService = inject(CampaignService);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly keepsakes = input.required<ReadonlyArray<CharacterKeepsake>>();
  readonly selectedIndex = signal<number | undefined>(undefined);
  readonly images = computed(() => this.keepsakes().map((keepsake) => keepsake.image));

  open(index: number): void {
    this.selectedIndex.set(index);
  }

  close(): void {
    this.selectedIndex.set(undefined);
  }

  kindLabel(kind: CharacterKeepsakeKind): string {
    return this.uiText.text(`characterJournal.keepsakes.kinds.${kind}`);
  }

  sourceRoute(source: CharacterStoryReference): ReadonlyArray<string> {
    const campaignId = this.campaignService.activeCampaignId();
    if (
      campaignId !== undefined &&
      source.id !== undefined &&
      (source.kind === 'diary' || source.kind === 'chronicle')
    ) {
      return ['/', campaignId, 'campaign', 'story', source.id];
    }
    return [];
  }

  sourceFragment(source: CharacterStoryReference): string | undefined {
    const fragments: Partial<Record<CharacterStoryReference['kind'], string>> = {
      chapter: 'personal-chapters',
      notebook: 'notebook',
      quote: 'quotes',
    };
    return fragments[source.kind];
  }

  sourceTab(source: CharacterStoryReference): string | undefined {
    if (source.kind === 'chapter' || source.kind === 'quote') return 'story';
    if (source.kind === 'notebook') return 'journal';
    return undefined;
  }

  printArchive(): void {
    const view = this.document.defaultView;
    if (view === null) return;
    const body = this.document.body;
    const printRoot = this.host.nativeElement.cloneNode(true) as HTMLElement;
    printRoot.classList.add('questkeeper-print-root');
    body.append(printRoot);
    const cleanup = (): void => {
      body.classList.remove('questkeeper-print-keepsakes');
      printRoot.remove();
    };
    body.classList.add('questkeeper-print-keepsakes');
    view.addEventListener('afterprint', cleanup, { once: true });
    view.print();
    view.setTimeout(cleanup, 30_000);
  }
}
