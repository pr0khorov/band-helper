import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Setlist } from '../../core/models';

@Component({
  selector: 'app-setlists',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../shared/split-page.css'],
  template: `
    <div class="split-page">
      <section class="main-pane">
        <ng-container *ngIf="selected() as s; else emptyTpl">
          <div class="toolbar">
            <button *ngIf="!editing()" (click)="startEdit()">Редактировать</button>
            <button *ngIf="editing()" (click)="save()">Сохранить</button>
            <button *ngIf="editing()" class="secondary" (click)="cancelEdit()">Отмена</button>
            <span class="spacer"></span>
            <button class="danger" (click)="remove(s)">Удалить</button>
          </div>
          <div class="fields">
            <label style="flex:1">Название
              <input [(ngModel)]="draft.name" [disabled]="!editing()">
            </label>
          </div>
          <textarea *ngIf="editing()" class="body-editor" [(ngModel)]="draft.body"></textarea>
          <pre *ngIf="!editing()" class="body-view">{{ s.body }}</pre>
        </ng-container>
        <ng-template #emptyTpl>
          <div class="empty">Выберите сет-лист или создайте новый →</div>
        </ng-template>
      </section>

      <aside class="list-pane">
        <div class="list-header">
          <button (click)="newItem()" style="flex:1">+ Новый сет-лист</button>
        </div>
        <div class="list">
          <div *ngFor="let item of items()" class="item"
               [class.active]="selected()?.id === item.id"
               (click)="select(item)">
            {{ item.name || '(без названия)' }}
          </div>
          <div *ngIf="!items().length" class="item" style="cursor:default;color:var(--muted)">Пусто</div>
        </div>
      </aside>
    </div>
  `
})
export class SetlistsComponent implements OnInit {
  items = signal<Setlist[]>([]);
  selected = signal<Setlist | null>(null);
  editing = signal(false);
  draft: Setlist = { name: '' };

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load(selectId?: number) {
    this.api.setlists().subscribe(list => {
      this.items.set(list);
      if (selectId != null) {
        const found = list.find(x => x.id === selectId);
        if (found) this.select(found);
      } else if (this.selected()) {
        const cur = list.find(x => x.id === this.selected()?.id);
        this.selected.set(cur ?? null);
      }
    });
  }

  select(s: Setlist) {
    if (this.editing() && !confirm('Отменить несохранённые изменения?')) return;
    this.selected.set(s);
    this.editing.set(false);
    this.draft = { ...s };
  }

  newItem() {
    this.api.createSetlist({ name: 'Новый сет-лист', body: '' }).subscribe(c => {
      this.load(c.id);
      setTimeout(() => this.startEdit(), 100);
    });
  }

  startEdit() {
    if (!this.selected()) return;
    this.draft = { ...this.selected()! };
    this.editing.set(true);
  }
  cancelEdit() {
    this.draft = { ...(this.selected() ?? { name: '' }) };
    this.editing.set(false);
  }
  save() {
    const s = this.selected();
    if (!s?.id) return;
    this.api.updateSetlist(s.id, this.draft).subscribe(u => {
      this.selected.set(u);
      this.editing.set(false);
      this.load();
    });
  }
  remove(s: Setlist) {
    if (!s.id) return;
    if (!confirm(`Удалить «${s.name}»?`)) return;
    this.api.deleteSetlist(s.id).subscribe(() => {
      this.selected.set(null);
      this.editing.set(false);
      this.load();
    });
  }
}
