import { supabase, isSupabaseConfigured } from './supabase';
import type { 
  User, Language, Book, Unit, Session, 
  UserAnkiCard, Group, UserProgress, UserStats 
} from '@/types';

// ==================== USERS ====================
export async function getUsers(): Promise<User[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
}

export async function getUserById(id: string): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
  if (error) return null;
  return data;
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const newUser = {
    ...user,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('users').insert(newUser).select().single();
  if (error) throw error;
  return data;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from('users').delete().eq('id', id);
}

// ==================== LANGUAGES ====================
export async function getLanguages(): Promise<Language[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('languages').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function getLanguageById(id: string): Promise<Language | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('languages').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createLanguage(language: Omit<Language, 'id' | 'createdAt'>): Promise<Language | null> {
  if (!isSupabaseConfigured()) return null;
  const newLanguage = {
    ...language,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('languages').insert(newLanguage).select().single();
  if (error) throw error;
  return data;
}

export async function updateLanguage(id: string, updates: Partial<Language>): Promise<Language | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('languages').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLanguage(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from('languages').delete().eq('id', id);
}

// ==================== BOOKS ====================
export async function getBooks(): Promise<Book[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('books').select('*').order('order');
  if (error) throw error;
  return data || [];
}

export async function getBooksByLanguage(languageId: string): Promise<Book[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('books').select('*').eq('languageId', languageId).order('order');
  if (error) throw error;
  return data || [];
}

export async function getBookById(id: string): Promise<Book | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('books').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createBook(book: Omit<Book, 'id' | 'createdAt'>): Promise<Book | null> {
  if (!isSupabaseConfigured()) return null;
  const newBook = {
    ...book,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('books').insert(newBook).select().single();
  if (error) throw error;
  return data;
}

export async function updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('books').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBook(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from('books').delete().eq('id', id);
}

// ==================== UNITS ====================
export async function getUnits(): Promise<Unit[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('units').select('*').order('order');
  if (error) throw error;
  return data || [];
}

export async function getUnitsByBook(bookId: string): Promise<Unit[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('units').select('*').eq('bookId', bookId).order('order');
  if (error) throw error;
  return data || [];
}

export async function getUnitById(id: string): Promise<Unit | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('units').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createUnit(unit: Omit<Unit, 'id' | 'createdAt'>): Promise<Unit | null> {
  if (!isSupabaseConfigured()) return null;
  const newUnit = {
    ...unit,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('units').insert(newUnit).select().single();
  if (error) throw error;
  return data;
}

export async function updateUnit(id: string, updates: Partial<Unit>): Promise<Unit | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('units').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteUnit(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from('units').delete().eq('id', id);
}

// ==================== SESSIONS ====================
export async function getSessions(): Promise<Session[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('sessions').select('*').order('order');
  if (error) throw error;
  return data || [];
}

export async function getSessionsByUnit(unitId: string): Promise<Session[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('sessions').select('*').eq('unitId', unitId).order('order');
  if (error) throw error;
  return data || [];
}

export async function getSessionById(id: string): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  const newSession = {
    ...session,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('sessions').insert(newSession).select().single();
  if (error) throw error;
  return data;
}

export async function updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('sessions').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from('sessions').delete().eq('id', id);
}

// ==================== GROUPS ====================
export async function getGroups(): Promise<Group[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('groups').select('*');
  if (error) throw error;
  return data || [];
}

export async function getGroupsByBook(bookId: string): Promise<Group[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('groups').select('*').eq('bookId', bookId);
  if (error) throw error;
  return data || [];
}

export async function getGroupById(id: string): Promise<Group | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createGroup(group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group | null> {
  if (!isSupabaseConfigured()) return null;
  const now = new Date().toISOString();
  const newGroup = {
    ...group,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  const { data, error } = await supabase.from('groups').insert(newGroup).select().single();
  if (error) throw error;
  return data;
}

export async function updateGroup(id: string, updates: Partial<Group>): Promise<Group | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('groups').update({
    ...updates,
    updatedAt: new Date().toISOString(),
  }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGroup(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from('groups').delete().eq('id', id);
}

// ==================== USER ANKI CARDS ====================
export async function getUserAnkiCards(userId: string): Promise<UserAnkiCard[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('user_anki_cards').select('*').eq('userId', userId);
  if (error) throw error;
  return data || [];
}

export async function getDueCards(userId: string): Promise<UserAnkiCard[]> {
  if (!isSupabaseConfigured()) return [];
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('user_anki_cards')
    .select('*')
    .eq('userId', userId)
    .lte('nextReviewDate', now)
    .neq('status', 'mastered');
  if (error) throw error;
  return data || [];
}

export async function getNewCards(userId: string): Promise<UserAnkiCard[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('user_anki_cards')
    .select('*')
    .eq('userId', userId)
    .eq('status', 'new');
  if (error) throw error;
  return data || [];
}

export async function createUserAnkiCard(card: Omit<UserAnkiCard, 'id'>): Promise<UserAnkiCard | null> {
  if (!isSupabaseConfigured()) return null;
  const newCard = {
    ...card,
    id: crypto.randomUUID(),
  };
  const { data, error } = await supabase.from('user_anki_cards').insert(newCard).select().single();
  if (error) throw error;
  return data;
}

export async function updateUserAnkiCard(id: string, updates: Partial<UserAnkiCard>): Promise<UserAnkiCard | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('user_anki_cards').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteUserAnkiCard(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from('user_anki_cards').delete().eq('id', id);
}

// ==================== USER PROGRESS ====================
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('user_progress').select('*').eq('userId', userId);
  if (error) throw error;
  return data || [];
}

export async function getProgressBySession(userId: string, sessionId: string): Promise<UserProgress | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('user_progress')
    .select('*')
    .eq('userId', userId)
    .eq('sessionId', sessionId)
    .single();
  if (error) return null;
  return data;
}

export async function createUserProgress(progress: Omit<UserProgress, 'id'>): Promise<UserProgress | null> {
  if (!isSupabaseConfigured()) return null;
  const newProgress = {
    ...progress,
    id: crypto.randomUUID(),
  };
  const { data, error } = await supabase.from('user_progress').insert(newProgress).select().single();
  if (error) throw error;
  return data;
}

export async function updateUserProgress(id: string, updates: Partial<UserProgress>): Promise<UserProgress | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('user_progress').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ==================== USER STATS ====================
export async function getUserStats(userId: string): Promise<UserStats | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('user_stats').select('*').eq('userId', userId).single();
  if (error) return null;
  return data;
}

export async function createUserStats(stats: Omit<UserStats, 'id'>): Promise<UserStats | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('user_stats').insert(stats).select().single();
  if (error) throw error;
  return data;
}

export async function updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('user_stats').update(updates).eq('userId', userId).select().single();
  if (error) throw error;
  return data;
}

// ==================== AUTH ====================
export async function signUp(email: string, password: string, name: string, role: 'admin' | 'student' = 'student') {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase não configurado' };
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (authError) {
    return { success: false, message: authError.message };
  }
  
  if (authData.user) {
    // Create user profile (id is auto-generated)
    await createUser({
      email,
      name,
      password: '', // Password is handled by Supabase Auth
      role,
    });
  }
  
  return { success: true, message: 'Conta criada com sucesso!' };
}

export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase não configurado' };
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  // Get user profile
  const user = await getUserById(data.user.id);
  
  return { success: true, user };
}

export async function signOut() {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    return await getUserById(data.user.id);
  }
  return null;
}
