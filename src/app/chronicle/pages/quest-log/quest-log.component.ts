import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { QuestListComponent } from '@guild/components/quest-list/quest-list.component';
import { ACTIVE_QUEST_STATES, projectQuest } from '@guild/models/quest.model';
import { DataService } from '@guild/services/data.service';
import { UiTextService } from '@guild/services/uiText.service';

type QuestFilter = 'active' | 'archive' | 'all';

@Component({
  selector: 'app-quest-log',
  standalone: true,
  imports: [LanguageToggleComponent, QuestListComponent],
  templateUrl: './quest-log.component.html',
  styleUrl: './quest-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestLogComponent {
  readonly uiText = inject(UiTextService);
  private readonly data = inject(DataService);
  readonly filter = signal<QuestFilter>('active');
  readonly partyQuests = computed(() =>
    this.data.quests().filter((quest) => quest.scope === 'party' && quest.audience === 'party'),
  );
  readonly counts = computed(() => {
    const all = this.partyQuests();
    const active = all.filter((quest) => {
      const state = projectQuest(quest)?.current.state;
      return state !== undefined && ACTIVE_QUEST_STATES.has(state);
    }).length;
    return { active, archive: all.length - active, all: all.length };
  });
  readonly quests = computed(() =>
    this.partyQuests().filter((quest) => {
      const state = projectQuest(quest)?.current.state;
      if (this.filter() === 'all') return true;
      const active = state !== undefined && ACTIVE_QUEST_STATES.has(state);
      return this.filter() === 'active' ? active : !active;
    }),
  );
}
