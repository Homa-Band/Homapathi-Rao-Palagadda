export enum Language {
  TELUGU = 'Telugu',
  ENGLISH = 'English'
}

export interface Song {
  id: string;
  title: string;
  lyrics: string;
  audioUrl: string | null;
  coverImage: string;
  createdAt: Date;
  duration: string;
  style: string;
  language: Language;
  status: 'generating' | 'completed' | 'failed';
}

export interface Voice {
  id: string;
  name: string;
  type: 'premade' | 'cloned';
  previewUrl?: string;
}

export interface UserState {
  generatedSongs: Song[];
  clonedVoices: Voice[];
  credits: number;
}