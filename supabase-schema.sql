-- ============================================
-- SUPABASE SCHEMA FOR THE POLYGLOT METHOD STUDIO
-- ============================================
-- Execute este código no SQL Editor do Supabase

-- ============================================
-- 1. TABELA: users (Usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  wechat TEXT,
  selectedLanguageId UUID,
  selectedBookId UUID,
  groupId UUID,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política: usuários podem ver apenas seus próprios dados
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 2. TABELA: languages (Idiomas)
-- ============================================
CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nameEn TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'https://api.dicebear.com/7.x/initials/svg?seed=LANG',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view languages" ON languages
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage languages" ON languages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 3. TABELA: books (Livros)
-- ============================================
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  languageId UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  avatar TEXT NOT NULL DEFAULT 'https://api.dicebear.com/7.x/initials/svg?seed=BOOK',
  "order" INTEGER NOT NULL DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view books" ON books
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage books" ON books
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 4. TABELA: units (Unidades)
-- ============================================
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookId UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  sessions JSONB NOT NULL DEFAULT '[]',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view units" ON units
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage units" ON units
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 5. TABELA: sessions (Sessões/Aulas)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unitId UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📚',
  htmlContent TEXT NOT NULL DEFAULT '',
  ankiCards JSONB NOT NULL DEFAULT '[]',
  "order" INTEGER NOT NULL DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sessions" ON sessions
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage sessions" ON sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 6. TABELA: groups (Grupos de Alunos)
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bookId UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  languageId UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  studentIds UUID[] NOT NULL DEFAULT '{}',
  unlockedUnitIds UUID[] NOT NULL DEFAULT '{}',
  unitOrder UUID[] NOT NULL DEFAULT '{}',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view groups" ON groups
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage groups" ON groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 7. TABELA: user_anki_cards (Cards Anki dos Usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS user_anki_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cardId TEXT NOT NULL,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sessionId UUID NOT NULL,
  unitId UUID NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  example TEXT,
  pronunciation TEXT,
  -- FSRS fields
  stability NUMERIC NOT NULL DEFAULT 0,
  difficulty NUMERIC NOT NULL DEFAULT 5,
  -- Legacy fields
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  easeFactor NUMERIC NOT NULL DEFAULT 2.5,
  nextReviewDate TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  lastReviewDate TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered'))
);

ALTER TABLE user_anki_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards" ON user_anki_cards
  FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can manage own cards" ON user_anki_cards
  FOR ALL USING (auth.uid() = userId);

-- ============================================
-- 8. TABELA: user_progress (Progresso dos Usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unitId UUID NOT NULL,
  sessionId UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completedAt TIMESTAMP WITH TIME ZONE,
  ankiCardsAdded BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = userId);

-- ============================================
-- 9. TABELA: user_stats (Estatísticas dos Usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  totalStudyTime INTEGER NOT NULL DEFAULT 0,
  streakDays INTEGER NOT NULL DEFAULT 0,
  lastStudyDate TIMESTAMP WITH TIME ZONE,
  totalWordsLearned INTEGER NOT NULL DEFAULT 0,
  totalUnitsCompleted INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can manage own stats" ON user_stats
  FOR ALL USING (auth.uid() = userId);

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Criar idioma Espanhol
INSERT INTO languages (id, name, nameEn, avatar) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Espanhol', 'Spanish', 'https://api.dicebear.com/7.x/initials/svg?seed=ES&backgroundColor=e74c3c')
ON CONFLICT DO NOTHING;

-- Criar usuário admin padrão (senha: admin123)
-- NOTA: Em produção, use uma senha mais segura!
INSERT INTO users (id, name, email, password, role) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Administrador', 'admin@polyglot.com', 'admin123', 'admin')
ON CONFLICT DO NOTHING;
