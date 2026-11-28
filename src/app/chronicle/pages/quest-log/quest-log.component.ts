import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { QuestListComponent } from '@guild/components/quest-list/quest-list.component';
import { DataService } from '@guild/services/data.service';
import { UiTextService } from '@guild/services/uiText.service';

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
  readonly partyQuests = computed(() =>
    this.data.quests().filter((quest) => quest.scope === 'party' && quest.audience === 'party'),
  );
}
