import { supabase, isSupabaseConfigured } from './supabase';
import type { 
  User, Language, Book, Unit, Session, AnkiCard, 
  UserAnkiCard, Group, UserProgress, UserStats 
} from '@/types';

class Database {
  private static useLocalStorage(): boolean {
    return !isSupabaseConfigured();
  }

  static async init(): Promise<void> {
    if (this.useLocalStorage()) {
      const users = JSON.parse(localStorage.getItem('polyglot_users') || '[]');
      if (users.length === 0) await this.seedDemoData();
    }
  }

  static async seedDemoData(): Promise<void> {
    const lang = { id: crypto.randomUUID(), name: 'Espanhol', nameEn: 'Spanish', avatar: '', createdAt: new Date().toISOString() };
    localStorage.setItem('polyglot_languages', JSON.stringify([lang]));
    const user = { id: crypto.randomUUID(), name: 'Admin', email: 'admin@polyglot.com', password: '123', role: 'admin', createdAt: new Date().toISOString() };
    localStorage.setItem('polyglot_users', JSON.stringify([user]));
  }

  // --- AUTH & USERS ---
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return await this.getUserById(user.id);
    return null;
  }

  static async setCurrentUser(user: User | null): Promise<void> {
    if (!user) await supabase.auth.signOut();
  }

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

  // --- LANGUAGES ---
  static async getLanguages(): Promise<Language[]> {
    const { data } = await supabase.from('languages').select('*').order('name');
    return data || [];
  }

  static async getLanguageById(id: string): Promise<Language | null> {
    const { data } = await supabase.from('languages').select('*').eq('id', id).maybeSingle();
    return data;
  }

  static async createLanguage(l: any): Promise<Language> {
    const { data, error } = await supabase.from('languages').insert({
      name: l.name,
      nameen: l.nameEn || l.nameen || '',
      avatar: l.avatar || ''
    }).select().single();
    if (error) throw error;
    return data;
  }

  static async updateLanguage(id: string, u: any): Promise<Language> {
    const { data, error } = await supabase.from('languages').update({
      name: u.name,
      nameen: u.nameEn || u.nameen || '',
      avatar: u.avatar || ''
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteLanguage(id: string): Promise<void> {
    await supabase.from('languages').delete().eq('id', id);
  }

  // --- BOOKS ---
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

  static async createBook(b: any): Promise<Book> {
    const { data, error } = await supabase.from('books').insert(b).select().single();
    if (error) throw error;
    return data;
  }

  static async updateBook(id: string, u: any): Promise<Book> {
    const { data, error } = await supabase.from('books').update(u).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteBook(id: string): Promise<void> {
    await supabase.from('books').delete().eq('id', id);
  }

  // --- UNITS & SESSIONS ---
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

  static async createUnit(u: any): Promise<Unit> {
    const { data, error } = await supabase.from('units').insert(u).select().single();
    if (error) throw error;
    return data;
  }

  static async updateUnit(id: string, u: any): Promise<Unit> {
    const { data, error } = await supabase.from('units').update(u).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteUnit(id: string): Promise<void> {
    await supabase.from('units').delete().eq('id', id);
  }

  static async updateSession(id: string, updates: any): Promise<Session | null> {
    const { data, error } = await supabase.from('sessions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async addSessionToUnit(unitId: string, session: any): Promise<Session> {
    const { data, error } = await supabase.from('sessions').insert({
      unitId, ...session
    }).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteSession(id: string): Promise<void> {
    await supabase.from('sessions').delete().eq('id', id);
  }

  // --- GROUPS (CORREÇÃO UUID ERROR) ---
  static async getGroups(): Promise<Group[]> {
    const { data } = await supabase.from('groups').select('*');
    return data || [];
  }

  static async getGroupById(id: string): Promise<Group | null> {
    const { data } = await supabase.from('groups').select('*').eq('id', id).maybeSingle();
    return data;
  }

  static async createGroup(g: any): Promise<Group> {
    // CORREÇÃO: Não enviamos strings vazias para colunas UUID
    const payload: any = { name: g.name };
    if (g.bookId && g.bookId !== "") payload.bookId = g.bookId;
    if (g.languageId && g.languageId !== "") payload.languageId = g.languageId;
    
    payload.studentIds = g.studentIds || [];
    payload.unlockedUnitIds = g.unlockedUnitIds || [];

    const { data, error } = await supabase.from('groups').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  static async updateGroup(id: string, u: any): Promise<Group> {
    const { data, error } = await supabase.from('groups').update(u).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteGroup(id: string): Promise<void> {
    await supabase.from('groups').delete().eq('id', id);
  }

  static async addStudentToGroup(groupId: string, studentId: string): Promise<void> {
    const group = await this.getGroupById(groupId);
    if (!group) return;
    const studentIds = [...new Set([...group.studentIds, studentId])];
    await this.updateGroup(groupId, { studentIds });
    await this.updateUser(studentId, { groupId });
  }

  static async removeStudentFromGroup(groupId: string, studentId: string): Promise<void> {
    const group = await this.getGroupById(groupId);
    if (!group) return;
    const studentIds = group.studentIds.filter(id => id !== studentId);
    await this.updateGroup(groupId, { studentIds });
    await this.updateUser(studentId, { groupId: "" });
  }

  static async unlockUnitForGroup(groupId: string, unitId: string): Promise<void> {
    const group = await this.getGroupById(groupId);
    if (group) {
      const unlockedUnitIds = [...new Set([...group.unlockedUnitIds, unitId])];
      await this.updateGroup(groupId, { unlockedUnitIds });
    }
  }

  static async lockUnitForGroup(groupId: string, unitId: string): Promise<void> {
    const group = await this.getGroupById(groupId);
    if (group) {
      const unlockedUnitIds = group.unlockedUnitIds.filter(id => id !== unitId);
      await this.updateGroup(groupId, { unlockedUnitIds });
    }
  }

  // --- PROGRESS & ANKI ---
  static async getUserAnkiCards(userId: string): Promise<UserAnkiCard[]> { return (await supabase.from('user_anki_cards').select('*').eq('userId', userId)).data || []; }
  static async getDueCards(userId: string): Promise<UserAnkiCard[]> { return (await supabase.from('user_anki_cards').select('*').eq('userId', userId).lte('nextReviewDate', new Date().toISOString()).neq('status', 'mastered')).data || []; }
  static async getNewCards(userId: string): Promise<UserAnkiCard[]> { return (await supabase.from('user_anki_cards').select('*').eq('userId', userId).eq('status', 'new')).data || []; }
  static async updateAnkiCard(id: string, u: any) { return (await supabase.from('user_anki_cards').update(u).eq('id', id).select().single()).data; }
  static async createUserAnkiCard(c: any) { return (await supabase.from('user_anki_cards').insert(c).select().single()).data; }
  static async getUserProgress(userId: string): Promise<UserProgress[]> { return (await supabase.from('user_progress').select('*').eq('userId', userId)).data || []; }
  static async isSessionCompleted(userId: string, sessionId: string): Promise<boolean> {
    const { data } = await supabase.from('user_progress').select('*').eq('userId', userId).eq('sessionId', sessionId).maybeSingle();
    return data?.completed ?? false;
  }
  static async completeSession(userId: string, unitId: string, sessionId: string): Promise<void> {
    const { data: existing } = await supabase.from('user_progress').select('*').eq('userId', userId).eq('sessionId', sessionId).maybeSingle();
    if (existing) await supabase.from('user_progress').update({ completed: true, completedAt: new Date().toISOString() }).eq('id', (existing as any).id);
    else await supabase.from('user_progress').insert({ userId, unitId, sessionId, completed: true, completedAt: new Date().toISOString(), ankiCardsAdded: false });
  }
  static async getUserStats(userId: string): Promise<UserStats | null> { return (await supabase.from('user_stats').select('*').eq('userId', userId).maybeSingle()).data; }
  static async updateUserStats(userId: string, updates: any) {
    const stats = await this.getUserStats(userId);
    if (stats) await supabase.from('user_stats').update(updates).eq('userId', userId);
    else await supabase.from('user_stats').insert({ userId, ...updates });
  }
  static async recordStudySession(userId: string, duration: number) {
    const stats = await this.getUserStats(userId);
    await this.updateUserStats(userId, { totalStudyTime: (stats?.totalStudyTime || 0) + duration, lastStudyDate: new Date().toISOString() });
  }
  static async addAnkiCardsToUser(userId: string, unitId: string, sessionId: string, cards: AnkiCard[]) {
    for (const card of cards) {
      await this.createUserAnkiCard({ cardId: card.id || crypto.randomUUID(), userId, sessionId, unitId, front: card.front, back: card.back, example: card.example, pronunciation: card.pronunciation, nextReviewDate: new Date().toISOString(), status: 'new' });
    }
  }
}

export default Database;
