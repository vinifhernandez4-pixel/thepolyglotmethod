// ============================================
// DATABASE - ASSÍNCRONO (Supabase)
// ============================================
// Este arquivo usa Supabase para armazenar dados online
// Todos os métodos são assíncronos (retornam Promise)

import { supabase, isSupabaseConfigured } from './supabase';
import type { 
  User, Language, Book, Unit, Session, AnkiCard, 
  UserAnkiCard, Group, UserProgress, UserStats 
} from '@/types';

// ============================================
// LOCALSTORAGE FALLBACK (quando Supabase não está configurado)
// ============================================
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

// ============================================
// DATABASE CLASS
// ============================================
class Database {
  private static useLocalStorage(): boolean {
    return !isSupabaseConfigured();
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  static async init(): Promise<void> {
    if (this.useLocalStorage()) {
      const users = this.getUsersSync();
      if (users.length === 0) {
        this.seedDemoDataSync();
      }
    }
  }

  static async seedDemoData(): Promise<void> {
    if (this.useLocalStorage()) {
      this.seedDemoDataSync();
      return;
    }
    
    const languages = await this.getLanguages();
    if (languages.length === 0) {
      await this.createLanguage({
        name: 'Espanhol',
        nameEn: 'Spanish',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=ES&backgroundColor=e74c3c',
      });
    }

    const users = await this.getUsers();
    if (users.length === 0) {
      await this.createUser({
        name: 'Administrador',
        email: 'admin@polyglot.com',
        password: 'admin123',
        role: 'admin',
      });
    }
  }

  // LocalStorage Fallbacks (Sync)
  private static getUsersSync(): User[] {
    return JSON.parse(localStorage.getItem(DB_KEYS.users) || '[]');
  }

  private static seedDemoDataSync(): void {
    this.createLanguageSync({
      name: 'Espanhol',
      nameEn: 'Spanish',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=ES&backgroundColor=e74c3c',
    });

    this.createUserSync({
      name: 'Administrador',
      email: 'admin@polyglot.com',
      password: 'admin123',
      role: 'admin',
    });
  }

  private static createLanguageSync(language: Omit<Language, 'id' | 'createdAt'>): Language {
    const languages = JSON.parse(localStorage.getItem(DB_KEYS.languages) || '[]');
    const newLang = { ...language, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    languages.push(newLang);
    localStorage.setItem(DB_KEYS.languages, JSON.stringify(languages));
    return newLang;
  }

  private static createUserSync(user: Omit<User, 'id' | 'createdAt'>): User {
    const users = JSON.parse(localStorage.getItem(DB_KEYS.users) || '[]');
    const newUser = { ...user, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem(DB_KEYS.users, JSON.stringify(users));
    return newUser;
  }

  // ============================================
  // USERS
  // ============================================
  static async getUsers(): Promise<User[]> {
    if (this.useLocalStorage()) return this.getUsersSync();
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data || [];
  }

  static async getUserById(id: string): Promise<User | null> {
    if (this.useLocalStorage()) return this.getUsersSync().find(u => u.id === id) || null;
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    if (this.useLocalStorage()) return this.getUsersSync().find(u => u.email === email) || null;
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) return null;
    return data;
  }

  static async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (this.useLocalStorage()) return this.createUserSync(user);
    const newUser = { ...user, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('users').insert(newUser).select().single();
    if (error) throw error;
    return data;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (this.useLocalStorage()) {
      const users = JSON.parse(localStorage.getItem(DB_KEYS.users) || '[]');
      const index = users.findIndex((u: User) => u.id === id);
      if (index === -1) return null;
      users[index] = { ...users[index], ...updates };
      localStorage.setItem(DB_KEYS.users, JSON.stringify(users));
      return users[index];
    }
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteUser(id: string): Promise<void> {
    if (this.useLocalStorage()) {
      const users = JSON.parse(localStorage.getItem(DB_KEYS.users) || '[]');
      const filtered = users.filter((u: User) => u.id !== id);
      localStorage.setItem(DB_KEYS.users, JSON.stringify(filtered));
      return;
    }
    await supabase.from('users').delete().eq('id', id);
  }

  static async getCurrentUser(): Promise<User | null> {
    if (this.useLocalStorage()) {
      const userJson = localStorage.getItem(DB_KEYS.currentUser);
      return userJson ? JSON.parse(userJson) : null;
    }
    const { data } = await supabase.auth.getUser();
    if (data.user) return await this.getUserById(data.user.id);
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
  // LANGUAGES
  // ============================================
  static async getLanguages(): Promise<Language[]> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.languages) || '[]');
    const { data, error } = await supabase.from('languages').select('*').order('name');
    if (error) throw error;
    return data || [];
  }

  static async getLanguageById(id: string): Promise<Language | null> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.languages) || '[]').find((l: Language) => l.id === id) || null;
    const { data, error } = await supabase.from('languages').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  static async createLanguage(language: Omit<Language, 'id' | 'createdAt'>): Promise<Language> {
    if (this.useLocalStorage()) return this.createLanguageSync(language);
    const newLang = { ...language, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('languages').insert(newLang).select().single();
    if (error) throw error;
    return data;
  }

  static async updateLanguage(id: string, updates: Partial<Language>): Promise<Language | null> {
    if (this.useLocalStorage()) {
      const languages = JSON.parse(localStorage.getItem(DB_KEYS.languages) || '[]');
      const index = languages.findIndex((l: Language) => l.id === id);
      if (index === -1) return null;
      languages[index] = { ...languages[index], ...updates };
      localStorage.setItem(DB_KEYS.languages, JSON.stringify(languages));
      return languages[index];
    }
    const { data, error } = await supabase.from('languages').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteLanguage(id: string): Promise<void> {
    if (this.useLocalStorage()) {
      const languages = JSON.parse(localStorage.getItem(DB_KEYS.languages) || '[]');
      const filtered = languages.filter((l: Language) => l.id !== id);
      localStorage.setItem(DB_KEYS.languages, JSON.stringify(filtered));
      return;
    }
    await supabase.from('languages').delete().eq('id', id);
  }

  // ============================================
  // BOOKS
  // ============================================
  static async getBooks(): Promise<Book[]> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.books) || '[]');
    const { data, error } = await supabase.from('books').select('*').order('order');
    if (error) throw error;
    return data || [];
  }

  static async getBooksByLanguage(languageId: string): Promise<Book[]> {
    if (this.useLocalStorage()) {
      const books = JSON.parse(localStorage.getItem(DB_KEYS.books) || '[]');
      return books.filter((b: Book) => b.languageId === languageId).sort((a: Book, b: Book) => a.order - b.order);
    }
    const { data, error } = await supabase.from('books').select('*').eq('languageId', languageId).order('order');
    if (error) throw error;
    return data || [];
  }

  static async getBookById(id: string): Promise<Book | null> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.books) || '[]').find((b: Book) => b.id === id) || null;
    const { data, error } = await supabase.from('books').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  static async createBook(book: Omit<Book, 'id' | 'createdAt'>): Promise<Book> {
    if (this.useLocalStorage()) {
      const books = JSON.parse(localStorage.getItem(DB_KEYS.books) || '[]');
      const newBook = { ...book, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      books.push(newBook);
      localStorage.setItem(DB_KEYS.books, JSON.stringify(books));
      return newBook;
    }
    const newBook = { ...book, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('books').insert(newBook).select().single();
    if (error) throw error;
    return data;
  }

  static async updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
    if (this.useLocalStorage()) {
      const books = JSON.parse(localStorage.getItem(DB_KEYS.books) || '[]');
      const index = books.findIndex((b: Book) => b.id === id);
      if (index === -1) return null;
      books[index] = { ...books[index], ...updates };
      localStorage.setItem(DB_KEYS.books, JSON.stringify(books));
      return books[index];
    }
    const { data, error } = await supabase.from('books').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteBook(id: string): Promise<void> {
    if (this.useLocalStorage()) {
      const books = JSON.parse(localStorage.getItem(DB_KEYS.books) || '[]');
      const filtered = books.filter((b: Book) => b.id !== id);
      localStorage.setItem(DB_KEYS.books, JSON.stringify(filtered));
      return;
    }
    await supabase.from('books').delete().eq('id', id);
  }

  // ============================================
  // UNITS
  // ============================================
  static async getUnits(): Promise<Unit[]> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.units) || '[]');
    const { data, error } = await supabase.from('units').select('*').order('order');
    if (error) throw error;
    return data || [];
  }

  static async getUnitsByBook(bookId: string): Promise<Unit[]> {
    if (this.useLocalStorage()) {
      const units = JSON.parse(localStorage.getItem(DB_KEYS.units) || '[]');
      return units.filter((u: Unit) => u.bookId === bookId).sort((a: Unit, b: Unit) => a.order - b.order);
    }
    const { data, error } = await supabase.from('units').select('*').eq('bookId', bookId).order('order');
    if (error) throw error;
    return data || [];
  }

  static async getUnitById(id: string): Promise<Unit | null> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.units) || '[]').find((u: Unit) => u.id === id) || null;
    const { data, error } = await supabase.from('units').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  static async createUnit(unit: Omit<Unit, 'id' | 'createdAt'>): Promise<Unit> {
    if (this.useLocalStorage()) {
      const units = JSON.parse(localStorage.getItem(DB_KEYS.units) || '[]');
      const newUnit = { ...unit, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      units.push(newUnit);
      localStorage.setItem(DB_KEYS.units, JSON.stringify(units));
      return newUnit;
    }
    const newUnit = { ...unit, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('units').insert(newUnit).select().single();
    if (error) throw error;
    return data;
  }

  static async updateUnit(id: string, updates: Partial<Unit>): Promise<Unit | null> {
    if (this.useLocalStorage()) {
      const units = JSON.parse(localStorage.getItem(DB_KEYS.units) || '[]');
      const index = units.findIndex((u: Unit) => u.id === id);
      if (index === -1) return null;
      units[index] = { ...units[index], ...updates };
      localStorage.setItem(DB_KEYS.units, JSON.stringify(units));
      return units[index];
    }
    const { data, error } = await supabase.from('units').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteUnit(id: string): Promise<void> {
    if (this.useLocalStorage()) {
      const units = JSON.parse(localStorage.getItem(DB_KEYS.units) || '[]');
      const filtered = units.filter((u: Unit) => u.id !== id);
      localStorage.setItem(DB_KEYS.units, JSON.stringify(filtered));
      return;
    }
    await supabase.from('units').delete().eq('id', id);
  }

  // ============================================
  // SESSIONS (Onde fica o HTML)
  // ============================================
  static async getSessions(): Promise<Session[]> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.sessions) || '[]');
    const { data, error } = await supabase.from('sessions').select('*').order('order');
    if (error) throw error;
    return data || [];
  }

  static async getSessionsByUnit(unitId: string): Promise<Session[]> {
    if (this.useLocalStorage()) {
      const sessions = JSON.parse(localStorage.getItem(DB_KEYS.sessions) || '[]');
      return sessions.filter((s: Session) => s.unitId === unitId).sort((a: Session, b: Session) => a.order - b.order);
    }
    const { data, error } = await supabase.from('sessions').select('*').eq('unitId', unitId).order('order');
    if (error) throw error;
    return data || [];
  }

  static async getSessionById(id: string): Promise<Session | null> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.sessions) || '[]').find((s: Session) => s.id === id) || null;
    const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  static async createSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    if (this.useLocalStorage()) {
      const sessions = JSON.parse(localStorage.getItem(DB_KEYS.sessions) || '[]');
      const newSession = { ...session, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      sessions.push(newSession);
      localStorage.setItem(DB_KEYS.sessions, JSON.stringify(sessions));
      return newSession;
    }
    // Correção: Uso de aspas para garantir mapeamento correto no insert
    const { data, error } = await supabase.from('sessions').insert({
      "unitId": session.unitId,
      "name": session.name,
      "emoji": session.emoji,
      "htmlContent": session.htmlContent,
      "ankiCards": session.ankiCards,
      "order": session.order
    }).select().single();
    if (error) throw error;
    return data;
  }

  static async updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
    if (this.useLocalStorage()) {
      const sessions = JSON.parse(localStorage.getItem(DB_KEYS.sessions) || '[]');
      const index = sessions.findIndex((s: Session) => s.id === id);
      if (index === -1) return null;
      sessions[index] = { ...sessions[index], ...updates };
      localStorage.setItem(DB_KEYS.sessions, JSON.stringify(sessions));
      return sessions[index];
    }
    
    // CORREÇÃO CRÍTICA: Mapeamento de campos com aspas para evitar erro 406
    const mappedUpdates: any = {};
    if (updates.name !== undefined) mappedUpdates["name"] = updates.name;
    if (updates.emoji !== undefined) mappedUpdates["emoji"] = updates.emoji;
    if (updates.htmlContent !== undefined) mappedUpdates["htmlContent"] = updates.htmlContent;
    if (updates.ankiCards !== undefined) mappedUpdates["ankiCards"] = updates.ankiCards;
    if (updates.order !== undefined) mappedUpdates["order"] = updates.order;

    const { data, error } = await supabase
      .from('sessions')
      .update(mappedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update Session Error:', error);
      throw error;
    }
    return data;
  }

  static async deleteSession(id: string): Promise<void> {
    if (this.useLocalStorage()) {
      const sessions = JSON.parse(localStorage.getItem(DB_KEYS.sessions) || '[]');
      const filtered = sessions.filter((s: Session) => s.id !== id);
      localStorage.setItem(DB_KEYS.sessions, JSON.stringify(filtered));
      return;
    }
    await supabase.from('sessions').delete().eq('id', id);
  }

  static async addSessionToUnit(unitId: string, session: Omit<Session, 'id' | 'createdAt' | 'unitId'>): Promise<Session> {
    const newSession = await this.createSession({ ...session, unitId });
    const unit = await this.getUnitById(unitId);
    if (unit) {
      const sessions = unit.sessions || [];
      sessions.push(newSession);
      await this.updateUnit(unitId, { sessions });
    }
    return newSession;
  }

  // ============================================
  // GROUPS
  // ============================================
  static async getGroups(): Promise<Group[]> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.groups) || '[]');
    const { data, error } = await supabase.from('groups').select('*');
    if (error) throw error;
    return data || [];
  }

  static async getGroupsByBook(bookId: string): Promise<Group[]> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.groups) || '[]').filter((g: Group) => g.bookId === bookId);
    const { data, error } = await supabase.from('groups').select('*').eq('bookId', bookId);
    if (error) throw error;
    return data || [];
  }

  static async getGroupById(id: string): Promise<Group | null> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.groups) || '[]').find((g: Group) => g.id === id) || null;
    const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  static async createGroup(group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
    if (this.useLocalStorage()) {
      const groups = JSON.parse(localStorage.getItem(DB_KEYS.groups) || '[]');
      const now = new Date().toISOString();
      const newGroup = { ...group, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      groups.push(newGroup);
      localStorage.setItem(DB_KEYS.groups, JSON.stringify(groups));
      return newGroup;
    }
    const { data, error } = await supabase.from('groups').insert({
      "name": group.name,
      "bookId": group.bookId,
      "languageId": group.languageId,
      "studentIds": group.studentIds || [],
      "unlockedUnitIds": group.unlockedUnitIds || []
    }).select().single();
    if (error) throw error;
    return data;
  }

  static async updateGroup(id: string, updates: Partial<Group>): Promise<Group | null> {
    if (this.useLocalStorage()) {
      const groups = JSON.parse(localStorage.getItem(DB_KEYS.groups) || '[]');
      const index = groups.findIndex((g: Group) => g.id === id);
      if (index === -1) return null;
      groups[index] = { ...groups[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(DB_KEYS.groups, JSON.stringify(groups));
      return groups[index];
    }

    const mapped: any = { "updatedAt": new Date().toISOString() };
    if (updates.name !== undefined) mapped["name"] = updates.name;
    if (updates.bookId !== undefined) mapped["bookId"] = updates.bookId;
    if (updates.studentIds !== undefined) mapped["studentIds"] = updates.studentIds;
    if (updates.unlockedUnitIds !== undefined) mapped["unlockedUnitIds"] = updates.unlockedUnitIds;

    const { data, error } = await supabase.from('groups').update(mapped).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteGroup(id: string): Promise<void> {
    if (this.useLocalStorage()) {
      const groups = JSON.parse(localStorage.getItem(DB_KEYS.groups) || '[]');
      const filtered = groups.filter((g: Group) => g.id !== id);
      localStorage.setItem(DB_KEYS.groups, JSON.stringify(filtered));
      return;
    }
    await supabase.from('groups').delete().eq('id', id);
  }

  static async unlockUnitForGroup(groupId: string, unitId: string): Promise<void> {
    const group = await this.getGroupById(groupId);
    if (!group) return;
    if (!group.unlockedUnitIds.includes(unitId)) {
      await this.updateGroup(groupId, { unlockedUnitIds: [...group.unlockedUnitIds, unitId] });
    }
  }

  static async lockUnitForGroup(groupId: string, unitId: string): Promise<void> {
    const group = await this.getGroupById(groupId);
    if (!group) return;
    await this.updateGroup(groupId, { unlockedUnitIds: group.unlockedUnitIds.filter(id => id !== unitId) });
  }

  // ============================================
  // USER ANKI CARDS
  // ============================================
  static async getUserAnkiCards(userId: string): Promise<UserAnkiCard[]> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.ankiCards) || '[]').filter((c: UserAnkiCard) => c.userId === userId);
    const { data, error } = await supabase.from('user_anki_cards').select('*').eq('userId', userId);
    if (error) throw error;
    return data || [];
  }

  static async getDueCards(userId: string): Promise<UserAnkiCard[]> {
    const now = new Date().toISOString();
    if (this.useLocalStorage()) {
      return JSON.parse(localStorage.getItem(DB_KEYS.ankiCards) || '[]').filter((c: UserAnkiCard) => 
        c.userId === userId && c.nextReviewDate <= now && c.status !== 'mastered'
      );
    }
    const { data, error } = await supabase.from('user_anki_cards')
      .select('*')
      .eq('userId', userId)
      .lte('nextReviewDate', now)
      .neq('status', 'mastered');
    if (error) throw error;
    return data || [];
  }

  static async createUserAnkiCard(card: Omit<UserAnkiCard, 'id'>): Promise<UserAnkiCard> {
    if (this.useLocalStorage()) {
      const cards = JSON.parse(localStorage.getItem(DB_KEYS.ankiCards) || '[]');
      const newCard = { ...card, id: crypto.randomUUID() };
      cards.push(newCard);
      localStorage.setItem(DB_KEYS.ankiCards, JSON.stringify(cards));
      return newCard;
    }
    const { data, error } = await supabase.from('user_anki_cards').insert({
      ...card,
      "userId": card.userId,
      "sessionId": card.sessionId,
      "unitId": card.unitId
    }).select().single();
    if (error) throw error;
    return data;
  }

  static async updateUserAnkiCard(id: string, updates: Partial<UserAnkiCard>): Promise<UserAnkiCard | null> {
    if (this.useLocalStorage()) {
      const cards = JSON.parse(localStorage.getItem(DB_KEYS.ankiCards) || '[]');
      const index = cards.findIndex((c: UserAnkiCard) => c.id === id);
      if (index === -1) return null;
      cards[index] = { ...cards[index], ...updates };
      localStorage.setItem(DB_KEYS.ankiCards, JSON.stringify(cards));
      return cards[index];
    }
    const { data, error } = await supabase.from('user_anki_cards').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async addAnkiCardsToUser(userId: string, unitId: string, sessionId: string, cards: AnkiCard[]): Promise<UserAnkiCard[]> {
    const existingCards = await this.getUserAnkiCards(userId);
    const newCards: UserAnkiCard[] = [];
    for (const card of cards) {
      const exists = existingCards.some(c => c.cardId === card.id && c.sessionId === sessionId);
      if (!exists) {
        const newCard = await this.createUserAnkiCard({
          cardId: card.id || crypto.randomUUID(),
          userId,
          sessionId,
          unitId,
          front: card.front,
          back: card.back,
          example: card.example,
          pronunciation: card.pronunciation,
          stability: 3.173,
          difficulty: 5,
          interval: 0,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
          status: 'new',
        });
        newCards.push(newCard);
      }
    }
    return newCards;
  }

  // ============================================
  // USER PROGRESS
  // ============================================
  static async getUserProgress(userId: string): Promise<UserProgress[]> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.progress) || '[]').filter((p: UserProgress) => p.userId === userId);
    const { data, error } = await supabase.from('user_progress').select('*').eq('userId', userId);
    if (error) throw error;
    return data || [];
  }

  static async getProgressBySession(userId: string, sessionId: string): Promise<UserProgress | null> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.progress) || '[]').find((p: UserProgress) => p.userId === userId && p.sessionId === sessionId) || null;
    const { data, error } = await supabase.from('user_progress')
      .select('*')
      .eq('userId', userId)
      .eq('sessionId', sessionId)
      .maybeSingle();
    if (error) return null;
    return data;
  }

  static async createUserProgress(progress: Omit<UserProgress, 'id'>): Promise<UserProgress> {
    if (this.useLocalStorage()) {
      const allProgress = JSON.parse(localStorage.getItem(DB_KEYS.progress) || '[]');
      const newProgress = { ...progress, id: crypto.randomUUID() };
      allProgress.push(newProgress);
      localStorage.setItem(DB_KEYS.progress, JSON.stringify(allProgress));
      return newProgress;
    }
    const { data, error } = await supabase.from('user_progress').insert({
      "userId": progress.userId,
      "unitId": progress.unitId,
      "sessionId": progress.sessionId,
      "completed": progress.completed,
      "ankiCardsAdded": progress.ankiCardsAdded,
      "completedAt": progress.completedAt
    }).select().single();
    if (error) throw error;
    return data;
  }

  static async updateUserProgress(id: string, updates: Partial<UserProgress>): Promise<UserProgress | null> {
    if (this.useLocalStorage()) {
      const progress = JSON.parse(localStorage.getItem(DB_KEYS.progress) || '[]');
      const index = progress.findIndex((p: UserProgress) => p.id === id);
      if (index === -1) return null;
      progress[index] = { ...progress[index], ...updates };
      localStorage.setItem(DB_KEYS.progress, JSON.stringify(progress));
      return progress[index];
    }
    const { data, error } = await supabase.from('user_progress').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async completeSession(userId: string, sessionId: string, unitId: string): Promise<void> {
    const existing = await this.getProgressBySession(userId, sessionId);
    if (existing) {
      await this.updateUserProgress(existing.id, { 
        completed: true, 
        completedAt: new Date().toISOString() 
      });
    } else {
      await this.createUserProgress({
        userId,
        unitId,
        sessionId,
        completed: true,
        completedAt: new Date().toISOString(),
        ankiCardsAdded: false,
      });
    }
  }

  // ============================================
  // USER STATS
  // ============================================
  static async getUserStats(userId: string): Promise<UserStats | null> {
    if (this.useLocalStorage()) return JSON.parse(localStorage.getItem(DB_KEYS.stats) || '[]').find((s: UserStats) => s.userId === userId) || null;
    const { data, error } = await supabase.from('user_stats').select('*').eq('userId', userId).maybeSingle();
    if (error) return null;
    return data;
  }

  static async createUserStats(stats: UserStats): Promise<UserStats> {
    if (this.useLocalStorage()) {
      const allStats = JSON.parse(localStorage.getItem(DB_KEYS.stats) || '[]');
      allStats.push(stats);
      localStorage.setItem(DB_KEYS.stats, JSON.stringify(allStats));
      return stats;
    }
    const { data, error } = await supabase.from('user_stats').insert({
      "userId": stats.userId,
      "totalStudyTime": stats.totalStudyTime,
      "streakDays": stats.streakDays,
      "totalWordsLearned": stats.totalWordsLearned,
      "totalUnitsCompleted": stats.totalUnitsCompleted,
      "lastStudyDate": stats.lastStudyDate
    }).select().single();
    if (error) throw error;
    return data;
  }

  static async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats | null> {
    if (this.useLocalStorage()) {
      const stats = JSON.parse(localStorage.getItem(DB_KEYS.stats) || '[]');
      const index = stats.findIndex((s: UserStats) => s.userId === userId);
      if (index === -1) return this.createUserStats({ userId, ...updates } as UserStats);
      stats[index] = { ...stats[index], ...updates };
      localStorage.setItem(DB_KEYS.stats, JSON.stringify(stats));
      return stats[index];
    }
    const { data, error } = await supabase.from('user_stats').update(updates).eq('userId', userId).select().single();
    if (error) throw error;
    return data;
  }

  static async recordStudySession(userId: string, duration: number): Promise<void> {
    const stats = await this.getUserStats(userId);
    const today = new Date().toISOString().split('T')[0];
    
    if (stats) {
      const lastStudyDate = stats.lastStudyDate?.split('T')[0];
      let streakDays = stats.streakDays;
      if (lastStudyDate) {
        const lastDate = new Date(lastStudyDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) streakDays++;
        else if (diffDays > 1) streakDays = 1;
      } else streakDays = 1;
      
      await this.updateUserStats(userId, {
        totalStudyTime: (stats.totalStudyTime || 0) + duration,
        streakDays,
        lastStudyDate: new Date().toISOString(),
      });
    } else {
      await this.createUserStats({
        userId,
        totalStudyTime: duration,
        streakDays: 1,
        lastStudyDate: new Date().toISOString(),
        totalWordsLearned: 0,
        totalUnitsCompleted: 0,
      });
    }
  }
}

export default Database;
