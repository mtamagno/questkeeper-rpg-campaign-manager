import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

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
  readonly characterId = input.required<string>();
  readonly isItalian = input(false);
  readonly activeSection = input.required<CharacterSheetWorkspace>();
  readonly inventoryCount = input(0);
  readonly libraryCount = input(0);
  readonly recordedLevelCount = input(1);
  readonly selectedLevel = input.required<number>();
  readonly currentLevel = input.required<number>();
  readonly currentRequested = output<void>();
  readonly sectionRequested = output<CharacterSheetWorkspace>();

  readonly workspaces = computed<ReadonlyArray<CharacterSheetWorkspaceOption>>(() => {
    const italian = this.isItalian();
    return [
      {
        id: 'overview',
        icon: '\u2694',
        label: italian ? 'Al tavolo' : 'At the table',
        description: italian
          ? 'Identità, difese, monete e risorse pronte da usare.'
          : 'Identity, defences, coins, and ready-to-use resources.',
      },
      {
        id: 'training',
        icon: '\u25c6',
        label: italian ? 'Statistiche' : 'Stats',
        description: italian
          ? 'Caratteristiche, tiri salvezza, abilità e lingue.'
          : 'Abilities, saving throws, skills, and languages.',
      },
      {
        id: 'inventory',
        icon: '\u25c8',
        label: italian ? 'Equipaggiamento' : 'Equipment',
        description: italian
          ? 'Tutto ciò che porta, usa o tiene in sintonia.'
          : 'Everything carried, equipped, or attuned.',
        count: this.inventoryCount(),
      },
      {
        id: 'spells',
        icon: '\u2726',
        label: italian ? 'Regole' : 'Rules',
        description: italian
          ? 'Privilegi, incantesimi e riferimenti personali.'
          : 'Features, spells, and personal references.',
        count: this.libraryCount(),
      },
      {
        id: 'progression',
        icon: '\u231b',
        label: italian ? 'Progressione' : 'Progression',
        description: italian
          ? 'Livelli registrati, confronti e cambiamenti.'
          : 'Recorded levels, comparisons, and changes.',
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
