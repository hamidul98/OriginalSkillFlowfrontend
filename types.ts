
export enum ProgressLevel {
  NotStarted = 'Not Started Yet',
  OnGoing = 'On Going',
  Complete = 'Complete',
  Hold = 'Hold'
}

export interface Entry {
  id: string;
  date: string;
  topic: string;
  subject: string;
  module?: string; // New field for grouping
  progress: ProgressLevel;
  videoUrl?: string;
  websiteUrl?: string;
  otherUrl?: string;
  docsUrl?: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  entries: Entry[];
  createdAt: string;
  themeColor: string; // Hex code or tailwind class reference
}

export interface AppState {
  skills: Skill[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'editor';
  joinedAt: string;
}

export interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  createdAt: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  performedBy: string; // Email or "System"
  timestamp: string;
}

export type Theme = 'light' | 'dark';
