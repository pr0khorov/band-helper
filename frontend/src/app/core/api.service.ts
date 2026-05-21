import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppUser, Idea, Rehearsal, Setlist, Song } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Songs
  songs(): Observable<Song[]> { return this.http.get<Song[]>('/api/songs'); }
  song(id: number): Observable<Song> { return this.http.get<Song>(`/api/songs/${id}`); }
  createSong(s: Song): Observable<Song> { return this.http.post<Song>('/api/songs', s); }
  updateSong(id: number, s: Song): Observable<Song> { return this.http.put<Song>(`/api/songs/${id}`, s); }
  deleteSong(id: number): Observable<void> { return this.http.delete<void>(`/api/songs/${id}`); }

  // Setlists
  setlists(): Observable<Setlist[]> { return this.http.get<Setlist[]>('/api/setlists'); }
  setlist(id: number): Observable<Setlist> { return this.http.get<Setlist>(`/api/setlists/${id}`); }
  createSetlist(s: Setlist): Observable<Setlist> { return this.http.post<Setlist>('/api/setlists', s); }
  updateSetlist(id: number, s: Setlist): Observable<Setlist> { return this.http.put<Setlist>(`/api/setlists/${id}`, s); }
  deleteSetlist(id: number): Observable<void> { return this.http.delete<void>(`/api/setlists/${id}`); }

  // Ideas
  ideas(): Observable<Idea[]> { return this.http.get<Idea[]>('/api/ideas'); }
  idea(id: number): Observable<Idea> { return this.http.get<Idea>(`/api/ideas/${id}`); }
  createIdea(i: Idea): Observable<Idea> { return this.http.post<Idea>('/api/ideas', i); }
  updateIdea(id: number, i: Idea): Observable<Idea> { return this.http.put<Idea>(`/api/ideas/${id}`, i); }
  deleteIdea(id: number): Observable<void> { return this.http.delete<void>(`/api/ideas/${id}`); }

  // Rehearsals
  rehearsals(): Observable<Rehearsal[]> { return this.http.get<Rehearsal[]>('/api/rehearsals'); }
  createRehearsal(r: Rehearsal): Observable<Rehearsal> { return this.http.post<Rehearsal>('/api/rehearsals', r); }
  updateRehearsal(id: number, r: Rehearsal): Observable<Rehearsal> { return this.http.put<Rehearsal>(`/api/rehearsals/${id}`, r); }
  deleteRehearsal(id: number): Observable<void> { return this.http.delete<void>(`/api/rehearsals/${id}`); }

  // Users (admin)
  users(): Observable<AppUser[]> { return this.http.get<AppUser[]>('/api/users'); }
  createUser(req: { username: string; password: string; role: string }): Observable<AppUser> {
    return this.http.post<AppUser>('/api/users', req);
  }
  updateUser(id: number, req: { role: string }): Observable<AppUser> {
    return this.http.put<AppUser>(`/api/users/${id}`, req);
  }
  changePassword(id: number, password: string): Observable<void> {
    return this.http.post<void>(`/api/users/${id}/password`, { password });
  }
  deleteUser(id: number): Observable<void> { return this.http.delete<void>(`/api/users/${id}`); }

  // Backup
  exportBackup(): Observable<Blob> {
    return this.http.get('/api/backup/export', { responseType: 'blob' });
  }
  importBackup(file: File, wipe: boolean): Observable<unknown> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`/api/backup/import?wipe=${wipe}`, fd);
  }
}
