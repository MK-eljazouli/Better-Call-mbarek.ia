export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

export enum View {
  CHAT = 'CHAT',
  DASHBOARD = 'DASHBOARD',
}

export interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  icon: 'users' | 'file' | 'clock' | 'trending' | 'check';
  color: string;
}

export interface TopicData {
  name: string;
  value: number;
  fill: string;
}

export interface LanguageData {
  name: string;
  value: number;
  fill: string;
}