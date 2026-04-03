// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'student';
  wechat?: string;
  selectedLanguageId?: string;
  selectedBookId?: string;
  groupId?: string;
  createdAt: string;
}

// Language Types
export interface Language {
  id: string;
  name: string;
  nameEn: string;
  avatar: string;
  createdAt: string;
}

// Book Types
export interface Book {
  id: string;
  name: string;
  languageId: string;
  avatar: string;
  order: number;
  createdAt: string;
}

// Session Types
export interface Session {
  id: string;
  unitId: string;
  name: string;
  emoji: string;
  htmlContent: string;
  ankiCards: AnkiCard[];
  order: number;
  createdAt: string;
}

// Anki Card Types
export interface AnkiCard {
  id: string;
  front: string;
  back: string;
  example?: string;
  pronunciation?: string;
}

export interface UserAnkiCard {
  id: string;
  cardId: string;
  userId: string;
  sessionId: string;
  unitId: string;
  front: string;
  back: string;
  example?: string;
  pronunciation?: string;
  // FSRS fields (new algorithm)
  stability: number;      // S: days until R drops from 100% to 90%
  difficulty: number;     // D: 1-10, how hard the card is
  // Legacy fields (kept for compatibility)
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string;
  lastReviewDate?: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

// Unit Types
export interface Unit {
  id: string;
  bookId: string;
  name: string;
  description?: string;
  order: number;
  sessions: Session[];
  createdAt: string;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  bookId: string;
  languageId: string;
  studentIds: string[];
  unlockedUnitIds: string[];
  unitOrder?: string[]; // Custom order of units for this group
  createdAt: string;
  updatedAt: string;
}

// Progress Types
export interface UserProgress {
  id: string;
  userId: string;
  unitId: string;
  sessionId: string;
  completed: boolean;
  completedAt?: string;
  ankiCardsAdded: boolean;
}

// Stats Types
export interface UserStats {
  userId: string;
  totalStudyTime: number;
  streakDays: number;
  lastStudyDate?: string;
  totalWordsLearned: number;
  totalUnitsCompleted: number;
}

// App State
export interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

// Language Option for i18n
export type LanguageCode = 'zh' | 'en' | 'es' | 'pt' | 'fr';

export interface Translation {
  [key: string]: string | Translation;
}
