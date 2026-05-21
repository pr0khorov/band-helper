import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, CalendarModule, CalendarView, CalendarMonthViewBeforeRenderEvent } from 'angular-calendar';
import { addMonths, parseISO, format } from 'date-fns';
import { ApiService } from '../../core/api.service';
import { Rehearsal } from '../../core/models';

@Component({
  selector: 'app-rehearsals',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarModule],
  template: `
    <div class="page">
      <div class="toolbar">
        <button class="secondary" (click)="prev()">‹</button>
        <div class="title">{{ viewDate | date:'LLLL yyyy' }}</div>
        <button class="secondary" (click)="next()">›</button>
        <button class="secondary" (click)="today()">Сегодня</button>
        <span style="flex:1"></span>
        <button (click)="openCreate()">+ Новая репетиция</button>
      </div>

      <mwl-calendar-month-view
        [viewDate]="viewDate"
        [events]="events()"
        (beforeViewRender)="beforeViewRender($event)"
        (dayClicked)="onDayClick($event.day.date)"
        (eventClicked)="openEdit($any($event).event)">
      </mwl-calendar-month-view>

      <div class="modal-backdrop" *ngIf="editing()" (click)="cancel()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ draft.id ? 'Редактировать репетицию' : 'Новая репетиция' }}</h3>
          <label>Дата
            <input type="date" [(ngModel)]="draft.date">
          </label>
          <div style="display:flex;gap:8px">
            <label style="flex:1">Начало
              <input type="time" [(ngModel)]="draft.startTime">
            </label>
            <label style="flex:1">Конец
              <input type="time" [(ngModel)]="draft.endTime">
            </label>
          </div>
          <label>Цели репетиции
            <textarea [(ngModel)]="draft.goals" rows="6"></textarea>
          </label>
          <div class="actions">
            <button class="danger" *ngIf="draft.id" (click)="remove()">Удалить</button>
            <span style="flex:1"></span>
            <button class="secondary" (click)="cancel()">Отмена</button>
            <button (click)="save()">Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 16px 20px; display: flex; flex-direction: column; height: 100%; overflow: auto; }
    .toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
    .title { font-weight: 500; min-width: 160px; text-transform: capitalize; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 100;
    }
    .modal {
      background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
      padding: 20px; width: 420px; display: flex; flex-direction: column; gap: 10px;
    }
    .modal h3 { margin: 0 0 8px; color: var(--accent); }
    .modal label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); }
    .actions { display: flex; gap: 8px; margin-top: 8px; }
    /* angular-calendar dark tweaks — events must be very visible */
    ::ng-deep .cal-month-view { background: var(--panel); border: 1px solid var(--border); border-radius: 4px; }
    ::ng-deep .cal-month-view .cal-cell-top { color: var(--text); }
    ::ng-deep .cal-month-view .cal-day-cell { min-height: 90px; position: relative; }
    ::ng-deep .cal-month-view .cal-header .cal-cell { color: var(--muted); }
    ::ng-deep .cal-month-view .cal-day-cell.cal-today { background: #2a3a4a; }
    /* day cells with events — bright left border */
    ::ng-deep .cal-month-view .cal-day-cell.has-events { background: #1e2a33; }
    /* event badge dot — bigger, brighter */
    ::ng-deep .cal-month-view .cal-event {
      width: 8px !important;
      height: 8px !important;
      border-radius: 50%;
      display: inline-block;
      margin-right: 4px;
    }
    /* event list inside a day cell */
    ::ng-deep .cal-month-view .cal-events {
      margin: 2px 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }
    /* individual event title in month view */
    ::ng-deep .cal-month-view .cal-event-title {
      font-size: 11px;
      font-weight: 600;
      color: #7cbfff;
      line-height: 1.3;
    }
    /* day number badge */
    ::ng-deep .cal-month-view .cal-day-badge {
      background: var(--accent) !important;
      color: #fff !important;
      font-weight: 700;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
    }
    /* today cell number */
    ::ng-deep .cal-month-view .cal-day-cell.cal-today .cal-cell-top {
      background: transparent;
    }
    ::ng-deep .cal-month-view .cal-day-number {
      font-size: 14px;
      font-weight: 600;
      opacity: 0.85;
    }
  `]
})
export class RehearsalsComponent implements OnInit {
  viewDate = new Date();
  view: CalendarView = CalendarView.Month;

  rehearsals = signal<Rehearsal[]>([]);
  events = computed<CalendarEvent[]>(() =>
    this.rehearsals().map(r => ({
      id: r.id,
      title: this.eventTitle(r),
      start: parseISO(r.date),
      meta: r,
      color: { primary: '#4da3ff', secondary: '#4da3ff44' }
    } as CalendarEvent))
  );

  beforeViewRender(event: CalendarMonthViewBeforeRenderEvent) {
    const eventDates = new Set(this.events().map(e =>
      format(e.start, 'yyyy-MM-dd')
    ));
    for (const day of event.body) {
      if (eventDates.has(format(day.date, 'yyyy-MM-dd'))) {
        day.cssClass = 'has-events';
      }
    }
  }

  editing = signal(false);
  draft: Rehearsal = { date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', goals: '' };

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.rehearsals().subscribe(r => this.rehearsals.set(r));
  }

  eventTitle(r: Rehearsal): string {
    const t = [r.startTime, r.endTime].filter(Boolean).map(x => x!.substring(0, 5));
    const time = t.length ? t.join('–') + ' ' : '';
    const goals = (r.goals || '').split('\n')[0].slice(0, 40);
    return time + (goals || 'Репетиция');
  }

  prev() { this.viewDate = addMonths(this.viewDate, -1); }
  next() { this.viewDate = addMonths(this.viewDate, 1); }
  today() { this.viewDate = new Date(); }

  onDayClick(date: Date) {
    this.openCreateOnDate(date);
  }

  openCreate() { this.openCreateOnDate(new Date()); }

  openCreateOnDate(date: Date) {
    this.draft = { date: format(date, 'yyyy-MM-dd'), startTime: '', endTime: '', goals: '' };
    this.editing.set(true);
  }

  openEdit(event: CalendarEvent) {
    const r = event.meta as Rehearsal;
    this.draft = {
      id: r.id,
      date: r.date,
      startTime: r.startTime ? r.startTime.substring(0, 5) : '',
      endTime: r.endTime ? r.endTime.substring(0, 5) : '',
      goals: r.goals || ''
    };
    this.editing.set(true);
  }

  cancel() { this.editing.set(false); }

  save() {
    const payload: Rehearsal = {
      date: this.draft.date,
      startTime: this.draft.startTime ? this.draft.startTime + ':00' : null,
      endTime: this.draft.endTime ? this.draft.endTime + ':00' : null,
      goals: this.draft.goals
    };
    const req$ = this.draft.id
      ? this.api.updateRehearsal(this.draft.id, payload)
      : this.api.createRehearsal(payload);
    req$.subscribe(() => { this.editing.set(false); this.load(); });
  }

  remove() {
    if (!this.draft.id) return;
    if (!confirm('Удалить репетицию?')) return;
    this.api.deleteRehearsal(this.draft.id).subscribe(() => {
      this.editing.set(false); this.load();
    });
  }
}
