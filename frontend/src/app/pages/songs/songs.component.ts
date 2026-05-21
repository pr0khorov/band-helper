import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Song } from '../../core/models';

@Component({
  selector: 'app-songs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../shared/split-page.css'],
  template: `
    <div class="split-page" [class.has-selection]="!!selected()">
      <section class="main-pane">
        <ng-container *ngIf="selected() as s; else emptyTpl">
          <div class="toolbar">
            <button type="button" class="mobile-back secondary" (click)="clearSelection()">← Список</button>
            <button *ngIf="!editing()" (click)="startEdit()">Редактировать</button>
            <button *ngIf="editing()" (click)="save()">Сохранить</button>
            <button *ngIf="editing()" class="secondary" (click)="cancelEdit()">Отмена</button>
            <span class="spacer"></span>
            <button class="danger" (click)="remove(s)">Удалить</button>
          </div>

          <div class="fields">
            <label>Название
              <input [(ngModel)]="draft.title" [disabled]="!editing()">
            </label>
            <label>Автор
              <input [(ngModel)]="draft.author" [disabled]="!editing()">
            </label>
            <label>BPM
              <input type="number" [(ngModel)]="draft.bpm" [disabled]="!editing()">
            </label>
            <label>Тональность
              <input [(ngModel)]="draft.tonality" [disabled]="!editing()">
            </label>
          </div>

          <div class="body-area">
            <textarea
              *ngIf="editing()"
              class="body-editor"
              [(ngModel)]="draft.body"
              placeholder="Текст и аккорды (моноширинный шрифт)"></textarea>
            <pre *ngIf="!editing()" class="body-view">{{ s.body }}</pre>
          </div>
        </ng-container>
        <ng-template #emptyTpl>
          <div class="empty">
            <span class="empty-hint-desktop">Выберите песню или создайте новую →</span>
            <span class="empty-hint-mobile">Выберите песню из списка</span>
          </div>
        </ng-template>
      </section>

      <aside class="list-pane">
        <div class="list-header">
          <button (click)="newSong()" style="flex:1">+ Новая песня</button>
        </div>
        <div class="list">
          <div *ngFor="let item of items()" class="item"
               [class.active]="selected()?.id === item.id"
               (click)="select(item)">
            <div>{{ item.title || '(без названия)' }}</div>
            <div class="meta">{{ item.author }} <span *ngIf="item.tonality">· {{ item.tonality }}</span></div>
          </div>
          <div *ngIf="!items().length" class="item" style="cursor:default;color:var(--muted)">Пусто</div>
        </div>
      </aside>
    </div>
  `
})
export class SongsComponent implements OnInit {
  items = signal<Song[]>([]);
  selected = signal<Song | null>(null);
  editing = signal(false);
  draft: Song = { title: '' };

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load(selectId?: number) {
    this.api.songs().subscribe(list => {
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

  select(s: Song) {
    if (this.editing() && !confirm('Отменить несохранённые изменения?')) return;
    this.selected.set(s);
    this.editing.set(false);
    this.draft = { ...s };
  }

  clearSelection() {
    if (this.editing() && !confirm('Отменить несохранённые изменения?')) return;
    this.selected.set(null);
    this.editing.set(false);
  }

  newSong() {
    const fresh: Song = { title: 'Новая песня', author: '', bpm: null, tonality: '', body: '' };
    this.api.createSong(fresh).subscribe(created => {
      this.load(created.id);
      setTimeout(() => this.startEdit(), 100);
    });
  }

  startEdit() {
    if (!this.selected()) return;
    this.draft = { ...this.selected()! };
    this.editing.set(true);
  }

  cancelEdit() {
    this.draft = { ...(this.selected() ?? { title: '' }) };
    this.editing.set(false);
  }

  save() {
    const s = this.selected();
    if (!s?.id) return;
    this.api.updateSong(s.id, this.draft).subscribe(updated => {
      this.selected.set(updated);
      this.editing.set(false);
      this.load();
    });
  }

  remove(s: Song) {
    if (!s.id) return;
    if (!confirm(`Удалить «${s.title}»?`)) return;
    this.api.deleteSong(s.id).subscribe(() => {
      this.selected.set(null);
      this.editing.set(false);
      this.load();
    });
  }
}
