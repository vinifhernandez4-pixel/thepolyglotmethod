import { createClient } from '@supabase/supabase-js';

// Substitua estas variáveis pelas suas credenciais do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função para verificar se o Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';
};
