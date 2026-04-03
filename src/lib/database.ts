// ============================================
// DATABASE - VERSÃO COMPLETA (Supabase + Auth)
// ============================================
import { supabase, isSupabaseConfigured } from './supabase';
import type { 
  User, Language, Book, Unit, Session, AnkiCard, 
  UserAnkiCard, Group, UserProgress, UserStats 
} from '@/types';

const DB_KEYS = {
  users: 'polyglot_users',
  languages: 'polyglot_languages',
  books: 'polyglot_books',
  units: 'polyglot_units',
  sessions: 'polyglot_sessions',
  groups: 'polyglot_groups',
  ankiCards: 'polyglot_anki_cards',
  progress: 'polyglot_progress',
  stats: 'polyglot_stats',
  currentUser: 'polyglot_current_user',
};

class Database {
  private static useLocalStorage(): boolean {
    return !isSupabaseConfigured();
  }

  static async init(): Promise<void> {
    if (this.useLocalStorage()) {
      const users = JSON.parse(localStorage.getItem(DB_KEYS.users) || '[]');
      if (users.length === 0) {
        await this.seedDemoData();
      }
    }
  }

  static async seedDemoData(): Promise<void> {
    const lang = { id: crypto.randomUUID(), name: 'Espanhol', nameEn: 'Spanish', avatar: '', createdAt: new Date().toISOString() };
    localStorage.setItem(DB_KEYS.languages, JSON.stringify([lang]));
    const user = { id: crypto.randomUUID(), name: 'Admin', email: 'admin@polyglot.com', password: '123', role: 'admin', createdAt: new Date().toISOString() };
    localStorage.setItem(DB_KEYS.users, JSON.stringify([user]));
  }

  // ============================================
  // AUTH & CURRENT USER
  // ============================================
  static async getCurrentUser(): Promise<User | null> {
    if (this.useLocalStorage()) {
      const userJson = localStorage.getItem(DB_KEYS.currentUser);
      return userJson ? JSON.parse(userJson) : null;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return await this.getUserById(user.id);
    return null;
  }

  static async setCurrentUser(user: User | null): Promise<void> {
    if (this.useLocalStorage()) {
      if (user) localStorage.setItem(DB_KEYS.currentUser, JSON.stringify(user));
      else localStorage.removeItem(DB_KEYS.currentUser);
      return;
    }
    if (!user) await supabase.auth.signOut();
  }

  // ============================================
  // USERS
  // ============================================
  static async getUsers(): Promise<User[]> {
    const { data } = await supabase.from('users').select('*');
    return data || [];
  }

  static async getUserById(id: string): Promise<User | null> {
    const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    return data;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    return data;
  }

  static async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser = { ...user, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('users').insert(newUser).select().single();
    if (error) throw error;
    return data;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteUser(id: string): Promise<void> {
    await supabase.from('users').delete().eq('id', id);
  }

  // ============================================
  // LANGUAGES & BOOKS
  // ============================================
  static async getLanguages(): Promise<Language[]> {
    const { data } = await supabase.from('languages').select('*').order('name');
    return data || [];
  }

  static async getLanguageById(id: string): Promise<Language | null> {
    const { data } = await supabase.from('languages').select('*').eq('id', id).maybeSingle();
    return data;
  }

  static async createLanguage(language: Omit<Language, 'id' | 'createdAt'>): Promise<Language> {
    const { data, error } = await supabase.from('languages').insert(language).select().single();
    if (error) throw error;
    return data;
  }

  static async updateLanguage(id: string, updates: Partial<Language>): Promise<Language | null> {
    const { data, error } = await supabase.from('languages').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteLanguage(id: string): Promise<void> {
    await supabase.from('languages').delete().eq('id', id);
  }

  static async getBooks(): Promise<Book[]> {
    const { data } = await supabase.from('books').select('*').order('order');
    return data || [];
  }

  static async getBooksByLanguage(languageId: string): Promise<Book[]> {
    const { data } = await supabase.from('books').select('*').eq('languageId', languageId).order('order');
    return data || [];
  }

  static async getBookById(id: string): Promise<Book | null> {
    const { data } = await supabase.from('books').select('*').eq('id', id).maybeSingle();
    return data;
  }

  static async createBook(book: Omit<Book, 'id' | 'createdAt'>): Promise<Book> {
    const { data, error } = await supabase.from('books').insert(book).select().single();
    if (error) throw error;
    return data;
  }

  static async updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
    const { data, error } = await supabase.from('books').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteBook(id: string): Promise<void> {
    await supabase.from('books').delete().eq('id', id);
  }

  // ============================================
  // UNITS & SESSIONS (Salvamento de HTML corrigido)
  // ============================================
  static async getUnits(): Promise<Unit[]> {
    const { data } = await supabase.from('units').select('*, sessions(*)').order('order');
    return data || [];
  }

  static async getUnitsByBook(bookId: string): Promise<Unit[]> {
    const { data } = await supabase.from('units').select('*, sessions(*)').eq('bookId', bookId).order('order');
    return data || [];
  }

  static async getUnitById(id: string): Promise<Unit | null> {
    const { data } = await supabase.from('units').select('*, sessions(*)').eq('id', id).maybeSingle();
    return data;
  }

  static async createUnit(unit: Omit<Unit, 'id' | 'createdAt'>): Promise<Unit> {
    const { data, error } = await supabase.from('units').insert({ name: unit.name, bookId: unit.bookId, description: unit.description, order: unit.order }).select().single();
    if (error) throw error;
    return data;
  }

  static async updateUnit(id: string, updates: Partial<Unit>): Promise<Unit | null> {
    const { data, error } = await supabase.from('units').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteUnit(id: string): Promise<void> {
    await supabase.from('units').delete().eq('id', id);
  }

  static async updateSession(id: string, updates: any): Promise<Session | null> {
    const mappedUpdates: any = {};
    if (updates.name !== undefined) mappedUpdates["name"] = updates.name;
    if (updates.emoji !== undefined) mappedUpdates["emoji"] = updates.emoji;
    if (updates.htmlContent !== undefined) mappedUpdates["htmlContent"] = updates.htmlContent;
    if (updates.ankiCards !== undefined) mappedUpdates["ankiCards"] = updates.ankiCards;
    if (updates.order !== undefined) mappedUpdates["order"] = updates.order;

    const { data, error } = await supabase.from('sessions').update(mappedUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async addSessionToUnit(unitId: string, session: any): Promise<Session> {
    const { data, error } = await supabase.from('sessions').insert({
      "unitId": unitId,
      "name": session.name,
      "emoji": session.emoji,
      "htmlContent": session.htmlContent || '',
      "ankiCards": session.ankiCards || [],
      "order": session.order
    }).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteSession(id: string): Promise<void> {
    await supabase.from('sessions').delete().eq('id', id);
  }

  // ============================================
  // GROUPS
  // ============================================
  static async getGroups(): Promise<Group[]> {
    const { data } = await supabase.from('groups').select('*');
    return data || [];
  }

  static async getGroupById(id: string): Promise<Group | null> {
    const { data } = await supabase.from('groups').select('*').eq('id', id).maybeSingle();
    return data;
  }

  static async createGroup(group: any): Promise<Group> {
    const { data, error } = await supabase.from('groups').insert(group).select().single();
    if (error) throw error;
    return data;
  }

  static async updateGroup(id: string, updates: Partial<Group>): Promise<Group | null> {
    const { data, error } = await supabase.from('groups').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteGroup(id: string): Promise<void> {
    await supabase.from('groups').delete().eq('id', id);
  }

  static async unlockUnitForGroup(groupId: string, unitId: string): Promise<void> {
    const group = await this.getGroupById(groupId);
    if (group) {
      const ids = new Set(group.unlockedUnitIds);
      ids.add(unitId);
      await this.updateGroup(groupId, { unlockedUnitIds: Array.from(ids) });
    }
  }

  static async lockUnitForGroup(groupId: string, unitId: string): Promise<void> {
    const group = await this.getGroupById(groupId);
    if (group) {
      const ids = group.unlockedUnitIds.filter(id => id !== unitId);
      await this.updateGroup(groupId, { unlockedUnitIds: ids });
    }
  }

  // ============================================
  // ANKI & PROGRESS
  // ============================================
  static async getUserAnkiCards(userId: string): Promise<UserAnkiCard[]> {
    const { data } = await supabase.from('user_anki_cards').select('*').eq('userId', userId);
    return data || [];
  }

  static async getDueCards(userId: string): Promise<UserAnkiCard[]> {
    const now = new Date().toISOString();
    const { data } = await supabase.from('user_anki_cards').select('*').eq('userId', userId).lte('nextReviewDate', now).neq('status', 'mastered');
    return data || [];
  }

  static async getNewCards(userId: string): Promise<UserAnkiCard[]> {
    const { data } = await supabase.from('user_anki_cards').select('*').eq('userId', userId).eq('status', 'new');
    return data || [];
  }

  static async updateUserAnkiCard(id: string, updates: Partial<UserAnkiCard>): Promise<UserAnkiCard | null> {
    const { data, error } = await supabase.from('user_anki_cards').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async updateAnkiCard(id: string, updates: Partial<UserAnkiCard>): Promise<UserAnkiCard | null> {
    return this.updateUserAnkiCard(id, updates);
  }

  static async createUserAnkiCard(card: Omit<UserAnkiCard, 'id'>): Promise<UserAnkiCard> {
    const { data, error } = await supabase.from('user_anki_cards').insert(card).select().single();
    if (error) throw error;
    return data;
  }

  static async addAnkiCardsToUser(userId: string, unitId: string, sessionId: string, cards: AnkiCard[]): Promise<UserAnkiCard[]> {
    const existingCards = await this.getUserAnkiCards(userId);
    const newCards: UserAnkiCard[] = [];
    for (const card of cards) {
      const exists = existingCards.some(c => c.cardId === card.id && c.sessionId === sessionId);
      if (!exists) {
        const nc = await this.createUserAnkiCard({
          cardId: card.id || crypto.randomUUID(), userId, sessionId, unitId,
          front: card.front, back: card.back, example: card.example, pronunciation: card.pronunciation,
          stability: 3.173, difficulty: 5, interval: 0, repetitions: 0, easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(), status: 'new'
        });
        newCards.push(nc);
      }
    }
    return newCards;
  }

  static async getUserProgress(userId: string): Promise<UserProgress[]> {
    const { data } = await supabase.from('user_progress').select('*').eq('userId', userId);
    return data || [];
  }

  static async getProgressBySession(userId: string, sessionId: string): Promise<UserProgress | null> {
    const { data } = await supabase.from('user_progress').select('*').eq('userId', userId).eq('sessionId', sessionId).maybeSingle();
    return data;
  }

  static async isSessionCompleted(userId: string, sessionId: string): Promise<boolean> {
    const progress = await this.getProgressBySession(userId, sessionId);
    return progress?.completed ?? false;
  }

  static async completeSession(userId: string, sessionId: string, unitId: string): Promise<void> {
    const existing = await this.getProgressBySession(userId, sessionId);
    if (existing) {
      await supabase.from('user_progress').update({ completed: true, completedAt: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('user_progress').insert({ userId, unitId, sessionId, completed: true, completedAt: new Date().toISOString(), ankiCardsAdded: false });
    }
  }

  // ============================================
  // STATS
  // ============================================
  static async getUserStats(userId: string): Promise<UserStats | null> {
    const { data } = await supabase.from('user_stats').select('*').eq('userId', userId).maybeSingle();
    return data;
  }

  static async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<void> {
    const stats = await this.getUserStats(userId);
    if (stats) {
      await supabase.from('user_stats').update(updates).eq('userId', userId);
    } else {
      const newStats = { userId, ...updates, totalStudyTime: updates.totalStudyTime || 0, streakDays: updates.streakDays || 0, totalWordsLearned: 0, totalUnitsCompleted: 0 };
      await supabase.from('user_stats').insert(newStats);
    }
  }

  static async recordStudySession(userId: string, duration: number): Promise<void> {
    const stats = await this.getUserStats(userId);
    const time = (stats?.totalStudyTime || 0) + duration;
    await this.updateUserStats(userId, { totalStudyTime: time, lastStudyDate: new Date().toISOString() });
  }
}

export default Database;
