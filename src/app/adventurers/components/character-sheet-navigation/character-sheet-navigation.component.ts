import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { UiTextService } from '@guild/services/uiText.service';

export const CHARACTER_SHEET_WORKSPACES = [
  'overview',
  'training',
  'inventory',
  'spells',
  'progression',
] as const;

export type CharacterSheetWorkspace = (typeof CHARACTER_SHEET_WORKSPACES)[number];

interface CharacterSheetWorkspaceOption {
  readonly id: CharacterSheetWorkspace;
  readonly icon: string;
  readonly label: string;
  readonly description: string;
  readonly count?: number;
}

@Component({
  selector: 'app-character-sheet-navigation',
  standalone: true,
  templateUrl: './character-sheet-navigation.component.html',
  styleUrl: './character-sheet-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetNavigationComponent {
  readonly uiText = inject(UiTextService);
  readonly characterId = input.required<string>();
  readonly activeSection = input.required<CharacterSheetWorkspace>();
  readonly inventoryCount = input(0);
  readonly libraryCount = input(0);
  readonly recordedLevelCount = input(1);
  readonly selectedLevel = input.required<number>();
  readonly currentLevel = input.required<number>();
  readonly currentRequested = output<void>();
  readonly sectionRequested = output<CharacterSheetWorkspace>();

  readonly workspaces = computed<ReadonlyArray<CharacterSheetWorkspaceOption>>(() => {
    return [
      {
        id: 'overview',
        icon: '\u2694',
        label: this.uiText.text('characterUi.sheetNavigation.overview'),
        description: this.uiText.text('characterUi.sheetNavigation.overviewDescription'),
      },
      {
        id: 'training',
        icon: '\u25c6',
        label: this.uiText.text('characterUi.sheetNavigation.stats'),
        description: this.uiText.text('characterUi.sheetNavigation.statsDescription'),
      },
      {
        id: 'inventory',
        icon: '\u25c8',
        label: this.uiText.text('characterUi.sheetNavigation.equipment'),
        description: this.uiText.text('characterUi.sheetNavigation.equipmentDescription'),
        count: this.inventoryCount(),
      },
      {
        id: 'spells',
        icon: '\u2726',
        label: this.uiText.text('characterUi.sheetNavigation.rules'),
        description: this.uiText.text('characterUi.sheetNavigation.rulesDescription'),
        count: this.libraryCount(),
      },
      {
        id: 'progression',
        icon: '\u231b',
        label: this.uiText.text('characterUi.sheetNavigation.progression'),
        description: this.uiText.text('characterUi.sheetNavigation.progressionDescription'),
        count: this.recordedLevelCount(),
      },
    ];
  });

  readonly activeDescription = computed(
    () => this.workspaces().find(({ id }) => id === this.activeSection())?.description ?? '',
  );

  tabId(workspace: CharacterSheetWorkspace): string {
    return `character-sheet-view-tab-${workspace}-${this.characterId()}`;
  }

  panelId(workspace: CharacterSheetWorkspace): string {
    return `character-sheet-panel-${workspace}-${this.characterId()}`;
  }

  select(workspace: CharacterSheetWorkspace): void {
    this.sectionRequested.emit(workspace);
  }

  onKeydown(event: KeyboardEvent, workspace: CharacterSheetWorkspace): void {
    const supportedKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!supportedKeys.includes(event.key)) return;

    event.preventDefault();
    const currentIndex = CHARACTER_SHEET_WORKSPACES.indexOf(workspace);
    let nextIndex = currentIndex;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = CHARACTER_SHEET_WORKSPACES.length - 1;
    if (event.key === 'ArrowLeft') {
      nextIndex =
        (currentIndex - 1 + CHARACTER_SHEET_WORKSPACES.length) % CHARACTER_SHEET_WORKSPACES.length;
    }
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % CHARACTER_SHEET_WORKSPACES.length;
    }

    const next = CHARACTER_SHEET_WORKSPACES[nextIndex] ?? workspace;
    this.sectionRequested.emit(next);
    const tablist = (event.currentTarget as HTMLElement).closest('[role="tablist"]');
    tablist?.querySelector<HTMLElement>(`#${this.tabId(next)}`)?.focus();
  }
}
