import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AppUser } from '../../core/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h2>Пользователи</h2>

      <div class="block">
        <table>
          <thead>
            <tr><th>Логин</th><th>Роль</th><th>Создан</th><th></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users()">
              <td>{{ u.username }}</td>
              <td>
                <select [ngModel]="u.role" (ngModelChange)="changeRole(u, $event)">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td>{{ u.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
              <td style="display:flex;gap:6px;justify-content:flex-end">
                <button class="secondary" (click)="resetPassword(u)">Сменить пароль</button>
                <button class="danger" (click)="remove(u)">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Создать пользователя</h3>
      <div class="block create-form">
        <input placeholder="логин" [(ngModel)]="newUsername">
        <input placeholder="пароль" type="password" [(ngModel)]="newPassword">
        <select [(ngModel)]="newRole">
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button (click)="create()">Создать</button>
        <span class="error" *ngIf="createError()">{{ createError() }}</span>
      </div>

      <h2>Резервное копирование БД</h2>
      <div class="block backup">
        <button (click)="downloadBackup()">Скачать бэкап (.sql)</button>
        <div class="upload">
          <input type="file" #fileInput accept=".sql" (change)="onFile($event)">
          <label><input type="checkbox" [(ngModel)]="wipeBeforeImport"> Очистить БД перед загрузкой</label>
          <button (click)="uploadBackup(fileInput)" [disabled]="!importFile">Загрузить и восстановить</button>
        </div>
        <div class="hint">
          Внимание: при загрузке с включённой опцией «очистить» все текущие данные будут удалены.
        </div>
        <div class="error" *ngIf="backupError()">{{ backupError() }}</div>
        <div class="ok" *ngIf="backupOk()">{{ backupOk() }}</div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 20px; overflow: auto; height: 100%; }
    h2 { margin-top: 0; color: var(--accent); }
    h3 { margin-top: 24px; }
    .block { background: var(--panel); border: 1px solid var(--border); border-radius: 6px; padding: 12px; }
    .create-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .backup { display: flex; flex-direction: column; gap: 10px; }
    .upload { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .hint { font-size: 12px; color: var(--muted); }
    .error { color: var(--danger); font-size: 12px; }
    .ok { color: #6ec97a; font-size: 12px; }
  `]
})
export class AdminUsersComponent implements OnInit {
  users = signal<AppUser[]>([]);

  newUsername = '';
  newPassword = '';
  newRole: 'USER' | 'ADMIN' = 'USER';
  createError = signal<string | null>(null);

  importFile: File | null = null;
  wipeBeforeImport = true;
  backupError = signal<string | null>(null);
  backupOk = signal<string | null>(null);

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() { this.api.users().subscribe(u => this.users.set(u)); }

  changeRole(u: AppUser, role: string) {
    this.api.updateUser(u.id, { role }).subscribe(() => this.load());
  }

  resetPassword(u: AppUser) {
    const pwd = prompt(`Новый пароль для ${u.username}:`);
    if (!pwd) return;
    this.api.changePassword(u.id, pwd).subscribe(() => alert('Пароль изменён'));
  }

  remove(u: AppUser) {
    if (!confirm(`Удалить пользователя ${u.username}?`)) return;
    this.api.deleteUser(u.id).subscribe({
      next: () => this.load(),
      error: e => alert(e?.error?.error || 'Ошибка удаления')
    });
  }

  create() {
    this.createError.set(null);
    if (!this.newUsername || !this.newPassword) {
      this.createError.set('Логин и пароль обязательны');
      return;
    }
    this.api.createUser({ username: this.newUsername, password: this.newPassword, role: this.newRole })
      .subscribe({
        next: () => {
          this.newUsername = ''; this.newPassword = ''; this.newRole = 'USER';
          this.load();
        },
        error: e => this.createError.set(e?.error?.error || 'Ошибка создания')
      });
  }

  downloadBackup() {
    this.backupError.set(null);
    this.backupOk.set(null);
    this.api.exportBackup().subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `band-info-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: e => this.backupError.set('Не удалось скачать бэкап: ' + (e?.message || ''))
    });
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.importFile = input.files?.[0] || null;
  }

  uploadBackup(fileInput: HTMLInputElement) {
    if (!this.importFile) return;
    if (!confirm(this.wipeBeforeImport
      ? 'БД будет полностью очищена и заменена данными из файла. Продолжить?'
      : 'Будет выполнен RUNSCRIPT поверх текущей БД. Продолжить?')) return;
    this.backupError.set(null);
    this.backupOk.set(null);
    this.api.importBackup(this.importFile, this.wipeBeforeImport).subscribe({
      next: () => {
        this.backupOk.set('Бэкап успешно загружен.');
        this.importFile = null;
        fileInput.value = '';
      },
      error: e => this.backupError.set('Ошибка загрузки: ' + (e?.error?.error || e?.message || ''))
    });
  }
}
