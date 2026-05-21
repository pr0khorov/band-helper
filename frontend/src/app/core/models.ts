export interface Song {
  id?: number;
  title: string;
  author?: string;
  bpm?: number | null;
  tonality?: string;
  body?: string;
  updatedAt?: string;
}

export interface Setlist {
  id?: number;
  name: string;
  body?: string;
  updatedAt?: string;
}

export interface Idea {
  id?: number;
  name: string;
  body?: string;
  updatedAt?: string;
}

export interface Rehearsal {
  id?: number;
  date: string; // ISO yyyy-MM-dd
  startTime?: string | null; // HH:mm:ss
  endTime?: string | null;
  goals?: string;
}

export interface AppUser {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
}
