import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, CalendarModule, CalendarView } from 'angular-calendar';
import { addMonths, parseISO, format } from 'date-fns';
import { ru } from 'date-fns/locale';
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
        <span class="toolbar-spacer"></span>
        <button class="btn-create" (click)="openCreate()">+ Новая репетиция</button>
      </div>

      <div
        class="nearest-banner"
        *ngIf="nearestRehearsal() as next; else noNearest"
        (click)="openRehearsal(next)">
        <div class="nearest-label">Ближайшая репетиция</div>
        <div class="nearest-date">{{ formatRehearsalDate(next) }}</div>
        <div class="nearest-time" *ngIf="formatRehearsalTime(next)">{{ formatRehearsalTime(next) }}</div>
        <div class="nearest-goals" *ngIf="next.goals?.trim()">{{ next.goals }}</div>
        <div class="nearest-goals muted" *ngIf="!next.goals?.trim()">Цели не указаны</div>
      </div>
      <ng-template #noNearest>
        <div class="nearest-banner empty">Запланированных репетиций нет</div>
      </ng-template>

      <ng-template #cellTpl let-day="day">
        <div
          class="day-cell-fill"
          [class.has-event]="day.events.length > 0"
          (click)="onDayClick(day)">
          <div class="cal-cell-top">
            <span class="cal-day-number">{{ day.date | date:'d' }}</span>
          </div>
          <div class="events-inside" *ngIf="day.events.length">
            <div
              class="event-line"
              *ngFor="let e of day.events"
              (click)="openEdit(e); $event.stopPropagation()">
              <span class="event-line-desktop">{{ e.title }}</span>
              <span class="event-line-mobile">
                <span class="event-time-line">{{ eventTimeStart(e) }}</span>
                <span class="event-time-line">{{ eventTimeEnd(e) }}</span>
              </span>
            </div>
          </div>
        </div>
      </ng-template>

      <div class="calendar-wrap">
        <mwl-calendar-month-view
          [viewDate]="viewDate"
          [events]="events()"
          [weekStartsOn]="1"
          [weekendDays]="[0, 6]"
          [cellTemplate]="cellTpl">
        </mwl-calendar-month-view>
      </div>

      <div class="modal-backdrop" *ngIf="editing()" (click)="cancel()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ draft.id ? 'Редактировать репетицию' : 'Новая репетиция' }}</h3>
          <label>Дата
            <input type="date" [(ngModel)]="draft.date">
          </label>
          <div class="time-row">
            <label>Начало
              <input type="time" [(ngModel)]="draft.startTime">
            </label>
            <label>Конец
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
    .page { padding: 16px 20px; display: flex; flex-direction: column; height: 100%; overflow: auto; min-width: 0; }
    .toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .toolbar-spacer { flex: 1; min-width: 8px; }
    .nearest-banner {
      margin-bottom: 12px;
      padding: 12px 14px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent);
      border-radius: 6px;
      cursor: pointer;
    }
    .nearest-banner:hover:not(.empty) { background: var(--panel-alt); }
    .nearest-banner.empty {
      cursor: default;
      color: var(--muted);
      font-size: 13px;
      border-left-color: var(--border);
    }
    .nearest-label {
      font-size: 11px;
      color: var(--muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .nearest-date { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
    .nearest-time { color: var(--accent); font-size: 13px; margin-bottom: 6px; }
    .nearest-goals {
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .nearest-goals.muted { color: var(--muted); font-style: italic; }
    .calendar-wrap { flex: 1; min-width: 0; width: 100%; }
    .title { font-weight: 500; min-width: 160px; text-transform: capitalize; flex: 1; text-align: center; }
    .time-row { display: flex; gap: 8px; }
    .time-row label { flex: 1; min-width: 0; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: flex-end; justify-content: center; z-index: 100;
      padding: 0;
    }
    .modal {
      background: var(--panel); border: 1px solid var(--border); border-radius: 12px 12px 0 0;
      padding: 20px; width: 100%; max-width: 480px; max-height: 90vh; max-height: 90dvh;
      overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
    }
    .modal h3 { margin: 0 0 8px; color: var(--accent); }
    .modal label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); }
    .modal label input, .modal label textarea { width: 100%; }
    .actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .actions button { flex: 1; min-width: 100px; }

    @media (min-width: 769px) {
      .modal-backdrop { align-items: center; padding: 16px; }
      .modal { border-radius: 8px; width: 420px; max-height: none; }
      .title { flex: none; text-align: left; }
    }

    /* --- day cell custom template --- */
    .day-cell-fill {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      min-width: 0;
      min-height: 88px;
      cursor: pointer;
      overflow: hidden;
    }
    .day-cell-fill.has-event {
      cursor: pointer;
      background: linear-gradient(135deg, #1a3147 0%, #1e3a52 100%);
      box-shadow: inset 0 0 0 1px #2a5a7a;
    }
    .cal-cell-top {
      display: flex;
      justify-content: flex-end;
      padding: 4px 6px 2px;
    }
    .cal-day-number {
      font-size: 14px;
      font-weight: 700;
      opacity: 0.85;
    }
    .events-inside {
      flex: 1;
      min-width: 0;
      padding: 0 4px 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }
    .event-line {
      font-size: 11px;
      line-height: 1.3;
      color: #b8d8ff;
      background: rgba(77, 163, 255, 0.25);
      border-radius: 3px;
      padding: 2px 4px;
      min-width: 0;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }
    .event-line:hover {
      background: rgba(77, 163, 255, 0.45);
    }
    .event-line-mobile { display: none; }
    .event-line-desktop { display: block; overflow: hidden; text-overflow: ellipsis; }

    /* --- angular-calendar global overrides --- */
    ::ng-deep .calendar-wrap .cal-month-view {
      width: 100%;
      max-width: 100%;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 4px;
    }
    ::ng-deep .cal-month-view .cal-days,
    ::ng-deep .cal-month-view .cal-cell-row {
      width: 100%;
      min-width: 0;
    }
    ::ng-deep .cal-month-view .cal-cell {
      float: none;
      flex: 1 1 0;
      min-width: 0;
      overflow: hidden;
    }
    ::ng-deep .cal-month-view .cal-day-cell {
      min-height: 90px;
      min-width: 0;
      overflow: hidden;
    }
    ::ng-deep .cal-month-view .cal-cell-top {
      min-height: 0;
      flex: none;
    }
    ::ng-deep .cal-month-view .cal-header .cal-cell { color: var(--muted); }
    ::ng-deep .cal-month-view .cal-day-cell.cal-today { background: #2a3a4a; }
    ::ng-deep .cal-month-view .cal-day-cell { cursor: pointer; }

    @media (max-width: 768px) {
      .page { padding: 12px; }
      .title { min-width: 0; font-size: 14px; }
      .toolbar .secondary:not(:first-child):not(:nth-child(2)) { padding: 8px 10px; }
      .btn-create { width: 100%; order: 10; }
      .toolbar-spacer { display: none; }
      .day-cell-fill { min-height: 48px; }
      .day-cell-fill.has-event { min-height: 76px; }
      ::ng-deep .cal-month-view .cal-day-cell { min-height: 50px; }
      ::ng-deep .cal-month-view .cal-day-cell:has(.has-event) { min-height: 78px; }
      ::ng-deep .cal-month-view .cal-header .cal-cell { font-size: 11px; padding: 4px 0; }
      .cal-day-number { font-size: 12px; }
      .cal-cell-top { padding: 2px 4px 0; }
      .events-inside { padding: 0 3px 3px; gap: 3px; }
      .event-line {
        font-weight: 600;
        padding: 3px 4px;
        background: rgba(77, 163, 255, 0.4);
        border-left: 3px solid var(--accent);
        border-radius: 3px;
      }
      .event-line-desktop { display: none; }
      .event-line-mobile {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        text-align: center;
      }
      .event-time-line {
        display: block;
        font-size: 11px;
        line-height: 1.2;
        white-space: nowrap;
      }
      .day-cell-fill.has-event .cal-day-number {
        color: #b8d8ff;
        opacity: 1;
      }
    }

    @media (max-width: 900px) and (min-width: 769px) {
      .day-cell-fill { min-height: 72px; }
      ::ng-deep .cal-month-view .cal-day-cell { min-height: 74px; }
      .cal-day-number { font-size: 12px; }
      .event-line { font-size: 10px; padding: 1px 3px; }
    }
    ::ng-deep .cal-month-view .cal-day-badge {
      background: var(--accent) !important;
      color: #fff !important;
      font-weight: 700;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
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

  nearestRehearsal = computed(() => {
    const now = new Date();
    const todayKey = format(now, 'yyyy-MM-dd');
    return this.rehearsals()
      .filter(r => this.isUpcoming(r, now, todayKey))
      .sort((a, b) => {
        const byDate = a.date.localeCompare(b.date);
        if (byDate !== 0) return byDate;
        return (a.startTime || '').localeCompare(b.startTime || '');
      })[0] ?? null;
  });

  editing = signal(false);
  draft: Rehearsal = { date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', goals: '' };

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.rehearsals().subscribe(r => this.rehearsals.set(r));
  }

  private isUpcoming(r: Rehearsal, now: Date, todayKey: string): boolean {
    if (r.date > todayKey) return true;
    if (r.date < todayKey) return false;
    if (r.endTime) return parseISO(`${r.date}T${r.endTime}`) >= now;
    if (r.startTime) return parseISO(`${r.date}T${r.startTime}`) >= now;
    return true;
  }

  formatRehearsalDate(r: Rehearsal): string {
    return format(parseISO(r.date), 'EEEE, d MMMM yyyy', { locale: ru });
  }

  formatRehearsalTime(r: Rehearsal): string | null {
    const parts = [r.startTime, r.endTime]
      .filter(Boolean)
      .map(t => t!.substring(0, 5));
    return parts.length ? parts.join(' – ') : null;
  }

  openRehearsal(r: Rehearsal) {
    this.draft = {
      id: r.id,
      date: r.date,
      startTime: r.startTime ? r.startTime.substring(0, 5) : '',
      endTime: r.endTime ? r.endTime.substring(0, 5) : '',
      goals: r.goals || ''
    };
    this.editing.set(true);
  }

  eventTitle(r: Rehearsal): string {
    const t = [r.startTime, r.endTime].filter(Boolean).map(x => x!.substring(0, 5));
    const time = t.length ? t.join('–') + ' ' : '';
    const goals = (r.goals || '').split('\n')[0].slice(0, 40);
    return time + (goals || 'Репетиция');
  }

  prev() { this.viewDate = addMonths(this.viewDate, -1); }
  next() { this.viewDate = addMonths(this.viewDate, 1); }

  onDayClick(day: { date: Date; events: CalendarEvent[] }) {
    if (day.events.length) {
      this.openEdit(day.events[0]);
      return;
    }
    this.openCreateOnDate(day.date);
  }

  eventTimeStart(event: CalendarEvent): string {
    const r = event.meta as Rehearsal;
    if (r.startTime) return r.startTime.substring(0, 5);
    if (r.endTime) return '—';
    return 'Репетиция';
  }

  eventTimeEnd(event: CalendarEvent): string {
    const r = event.meta as Rehearsal;
    if (r.endTime) return r.endTime.substring(0, 5);
    if (r.startTime) return '—';
    return '';
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
