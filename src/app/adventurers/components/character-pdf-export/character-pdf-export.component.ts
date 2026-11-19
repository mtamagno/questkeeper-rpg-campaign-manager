import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { UiTextService } from '@guild/services/uiText.service';
import type { CampaignPdfVariant } from '../../services/campaignCharacterSheetPdf.service';

export interface PdfVariantOption {
  readonly id: CampaignPdfVariant;
  readonly icon: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly metaKey: string;
}

export const CHARACTER_PDF_VARIANTS: ReadonlyArray<PdfVariantOption> = [
  {
    id: 'complete',
    icon: 'âœ¦',
    titleKey: 'characterPdf.variants.complete.title',
    descriptionKey: 'characterPdf.variants.complete.description',
    metaKey: 'characterPdf.variants.complete.meta',
  },
  {
    id: 'print',
    icon: 'â–¤',
    titleKey: 'characterPdf.variants.print.title',
    descriptionKey: 'characterPdf.variants.print.description',
    metaKey: 'characterPdf.variants.print.meta',
  },
  {
    id: 'share',
    icon: 'â—‡',
    titleKey: 'characterPdf.variants.share.title',
    descriptionKey: 'characterPdf.variants.share.description',
    metaKey: 'characterPdf.variants.share.meta',
  },
  {
    id: 'game-night',
    icon: 'âš”',
    titleKey: 'characterPdf.variants.gameNight.title',
    descriptionKey: 'characterPdf.variants.gameNight.description',
    metaKey: 'characterPdf.variants.gameNight.meta',
  },
];

@Component({
  selector: 'app-character-pdf-export',
  standalone: true,
  templateUrl: './character-pdf-export.component.html',
  styleUrl: './character-pdf-export.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterPdfExportComponent {
  readonly uiText = inject(UiTextService);
  readonly selectedVariant = input.required<CampaignPdfVariant>();
  readonly selectedTitle = input.required<string>();
  readonly isGenerating = input(false);
  readonly variantSelected = output<CampaignPdfVariant>();
  readonly generateRequested = output<CampaignPdfVariant>();
  readonly closed = output<void>();
  readonly variants = CHARACTER_PDF_VARIANTS;
}
