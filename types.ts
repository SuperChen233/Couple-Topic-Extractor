export interface Topic {
  id: number;
  content: string;
}

export enum Tab {
  EXTRACT = 'EXTRACT',
  INDEX = 'INDEX',
  SETTINGS = 'SETTINGS',
}

export interface AppState {
  topics: Topic[];
  seenTopicIds: number[];
  clickCount: number;
  sourceUrl: string;
  isLoading: boolean;
  error: string | null;
  currentTopic: Topic | null;
}