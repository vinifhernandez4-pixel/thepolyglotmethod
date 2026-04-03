# 🚀 Guia Completo de Deploy - The Polyglot Method Studio

Este guia vai te ensinar passo a passo como colocar sua plataforma online usando **Supabase** (banco de dados), **GitHub** (código) e **Vercel** (hospedagem).

---

## 📁 Estrutura do Projeto

Após extrair o arquivo, você terá esta estrutura:

```
app/
├── src/
│   ├── components/          # Componentes UI (botões, cards, etc)
│   ├── contexts/            # Contextos React (Auth, Language)
│   ├── lib/                 # Funções principais
│   │   ├── database.ts      # ← BANCO DE DADOS (Supabase)
│   │   ├── supabase.ts      # ← Configuração do Supabase
│   │   └── fsrs.ts          # Algoritmo Anki
│   ├── pages/               # Páginas do app
│   │   ├── Login.tsx        # Tela de login
│   │   ├── StudentDashboard.tsx  # Painel do aluno
│   │   ├── AdminPanel.tsx   # Painel do admin
│   │   ├── SessionView.tsx  # Visualização de aula
│   │   └── AnkiReview.tsx   # Revisão de cards
│   ├── types/               # Tipos TypeScript
│   └── App.tsx              # App principal
├── public/
│   └── logofinal.png        # Logo da aplicação
├── supabase-schema.sql      # ← SCRIPT DO BANCO DE DADOS
├── package.json             # Dependências
├── vite.config.ts           # Configuração Vite
├── vercel.json              # Configuração Vercel
├── .env.example             # ← EXEMPLO DE VARIÁVEIS
└── index.html
```

---

## 🗄️ PARTE 1: Configurar o Supabase (Banco de Dados)

### 1.1 Criar conta e projeto

1. Acesse: https://supabase.com
2. Clique em **"Start your project"** ou faça login
3. Clique em **"New project"**
4. Preencha:
   - **Organization:** Crie uma nova ou use existente
   - **Project name:** `polyglot-method-studio`
   - **Database Password:** Crie uma senha forte (GUARDE ELA!)
   - **Region:** Escolha a mais próxima (ex: `South America` se estiver no Brasil)
5. Clique em **"Create new project"**
6. Aguarde 1-2 minutos até o projeto ficar pronto

### 1.2 Pegar as credenciais

1. No painel do Supabase, clique em **"Project Settings"** (engrenagem no menu lateral)
2. Clique em **"API"** no submenu
3. Você verá duas informações importantes:
   - **Project URL:** (ex: `https://abcdefgh12345678.supabase.co`)
   - **anon public:** (ex: `eyJhbGciOiJIUzI1NiIs...`)
4. **COPIE E GUARDE** esses dois valores! Você vai precisar deles depois.

### 1.3 Criar as tabelas do banco

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**
3. **Copie TODO o conteúdo** do arquivo `supabase-schema.sql` que veio no pacote
4. **Cole** no editor SQL
5. Clique em **"Run"** (botão verde no canto inferior direito)
6. Aguarde a execução (deve aparecer "Success" em verde)

### 1.4 Verificar se as tabelas foram criadas

1. No menu lateral, clique em **"Table Editor"**
2. Você deve ver estas tabelas:
   - `users`
   - `languages`
   - `books`
   - `units`
   - `sessions`
   - `groups`
   - `user_progress`
   - `user_anki_cards`
   - `user_stats`

✅ **Pronto! Banco de dados configurado!**

---

## 🐙 PARTE 2: Configurar o GitHub (Código)

### 2.1 Criar conta (se não tiver)

1. Acesse: https://github.com
2. Clique em **"Sign up"** e crie sua conta

### 2.2 Criar novo repositório

1. Clique no **"+"** no canto superior direito
2. Clique em **"New repository"**
3. Preencha:
   - **Repository name:** `polyglot-method-studio`
   - **Description:** (opcional) "Plataforma de ensino de idiomas"
   - **Public** ou **Private** (como preferir)
   - **NÃO** marque "Add a README file"
   - **NÃO** marque "Add .gitignore"
4. Clique em **"Create repository"**

### 2.3 Subir o código para o GitHub

#### Opção A: Via interface web (mais fácil)

1. Na página do seu repositório recém-criado, procure por **"uploading an existing file"**
2. Clique nesse link
3. Você verá uma área para arrastar arquivos
4. **ATENÇÃO:** Você precisa subir os arquivos da pasta `app/`, não a pasta `app/` em si
5. Arraste TODO O CONTEÚDO da pasta `app/` para essa área
6. Espere todos os arquivos carregarem
7. Em "Commit changes":
   - **Commit message:** `Initial commit`
8. Clique em **"Commit changes"**

#### Opção B: Via linha de comando (para quem sabe Git)

```bash
# Entrar na pasta app
cd app

# Inicializar Git
git init

# Adicionar todos os arquivos
git add .

# Criar commit
git commit -m "Initial commit"

# Adicionar repositório remoto (substitua SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/polyglot-method-studio.git

# Enviar para GitHub
git push -u origin main
```

### 2.4 Verificar se subiu corretamente

1. Atualize a página do GitHub
2. Você deve ver todos os arquivos listados
3. Clique em `src/` → `lib/` → `database.ts` para verificar se o arquivo está lá

✅ **Pronto! Código no GitHub!**

---

## ▲ PARTE 3: Configurar o Vercel (Hospedagem)

### 3.1 Criar conta

1. Acesse: https://vercel.com
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"** (mais fácil)
4. Autorize o Vercel a acessar sua conta GitHub

### 3.2 Importar projeto do GitHub

1. No dashboard do Vercel, clique em **"Add New..."** → **"Project"**
2. Você verá seus repositórios do GitHub
3. Encontre e clique em **"polyglot-method-studio"**
4. Clique em **"Import"**

### 3.3 Configurar o deploy

Na página de configuração:

1. **Project Name:** `polyglot-method-studio` (ou como quiser)
2. **Framework Preset:** Selecione **"Vite"**
3. **Root Directory:** Deixe em branco (ou `./` se pedir)

### 3.4 Configurar variáveis de ambiente (MUITO IMPORTANTE!)

Clique em **"Environment Variables"** e adicione:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Substitua:**
- `https://SEU-PROJETO.supabase.co` pela URL do seu projeto Supabase
- `sua-chave-anon-aqui` pela chave anon do Supabase

Clique em **"Add"** para cada variável.

### 3.5 Fazer o deploy

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos (você verá o progresso)
3. Quando aparecer **"Congratulations!"** em verde, clique em **"Go to Dashboard"**

### 3.6 Pegar o link do site

1. No dashboard do projeto, você verá um domínio tipo:
   - `https://polyglot-method-studio.vercel.app`
2. **COPIE ESSE LINK!** É o endereço que seus alunos vão usar.

✅ **Pronto! Site online!**

---

## 🎯 PARTE 4: Primeiros Passos Após o Deploy

### 4.1 Acessar o site

1. Abra o link do Vercel no navegador
2. Você verá a tela de login

### 4.2 Fazer login como Admin

Use as credenciais padrão:
- **Email:** `admin@polyglot.com`
- **Senha:** `admin123`

> ⚠️ **IMPORTANTE:** Após fazer login, vá em "Configurações" e **mude a senha do admin**!

### 4.3 Configurar o primeiro idioma

1. No painel admin, clique na aba **"Languages"**
2. Clique em **"Add Language"**
3. Preencha:
   - **语言名称 (中文):** Espanhol
   - **语言名称 (英文):** Spanish
   - **头像URL:** (deixe em branco, vai gerar automático)
4. Clique em **"Save"**

### 4.4 Criar um livro

1. Vá na aba **"Books"**
2. Clique em **"Add Book"**
3. Preencha:
   - **教材名称:** Espanhol A1
   - **所属语言:** Selecione "Espanhol"
4. Clique em **"Save"**

### 4.5 Criar uma unidade

1. Vá na aba **"Units"**
2. Clique em **"Add Unit"**
3. Preencha:
   - **所属教材:** Selecione "Espanhol A1"
   - **单元名称:** Lição 1: Olá!
   - **描述:** (opcional)
4. Clique em **"Save"**

> Isso criará automaticamente 4 sessões: Preview, Review, Grammar e Audio

### 4.6 Criar uma turma

1. Vá na aba **"Groups"**
2. Clique em **"Add Group"**
3. Preencha:
   - **班级名称:** Turma Espanhol A1 - Manhã
   - **使用教材:** Selecione "Espanhol A1"
4. Clique em **"Save"**

### 4.7 Liberar unidades para a turma

1. Na lista de turmas, clique nos botões das unidades para **destrancar** (ficarão verdes)
2. Unidades destravadas = alunos podem ver e estudar

---

## 👤 PARTE 5: Cadastrar Alunos

### Opção 1: Aluno se cadastra sozinho

1. O aluno acessa o link do site
2. Clica em **"Register"**
3. Preenche:
   - Nome
   - Email
   - Senha
   - WeChat (opcional)
   - Idioma que quer aprender
   - Livro
4. Clica em **"Register"**

### Opção 2: Admin adiciona aluno à turma

1. No painel admin, vá em **"Groups"**
2. Encontre a turma
3. Clique em **"添加学生"** (Adicionar aluno)
4. Selecione o aluno na lista
5. Pronto! O aluno agora faz parte da turma

---

## 📚 PARTE 6: Adicionar Conteúdo às Aulas

### 6.1 Editar uma sessão

1. No painel admin, vá em **"Units"**
2. Encontre a unidade
3. Clique no botão **olho** (👁️) para ver as sessões
4. Clique em **"编辑"** (Editar) na sessão que quer editar

### 6.2 Adicionar conteúdo HTML

Você tem duas opções:

#### Opção A: Colar HTML direto

1. No campo **"HTML 内容"**, cole seu código HTML
2. Clique em **"Save"**

#### Opção B: Fazer upload de arquivo

1. Clique em **"上传文件"**
2. Selecione um arquivo `.html` do seu computador
3. O conteúdo será carregado automaticamente
4. Clique em **"Save"**

### 6.3 Adicionar cards Anki

No mesmo editor de sessão:

1. No campo **"Anki 卡片"**, você pode:
   
   **Opção 1 - JSON:**
   ```json
   [
     {
       "id": "card-1",
       "front": "Hola",
       "back": "Olá",
       "pronunciation": "[ˈo.la]",
       "example": "¡Hola! ¿Cómo estás?"
     },
     {
       "id": "card-2",
       "front": "Gracias",
       "back": "Obrigado",
       "pronunciation": "[ˈɡɾa.θjas]",
       "example": "Muchas gracias"
     }
   ]
   ```
   
   **Opção 2 - Formato simples (uma por linha):**
   ```
   Hola|Olá|[ˈo.la]|¡Hola! ¿Cómo estás?
   Gracias|Obrigado|[ˈɡɾa.θjas]|Muchas gracias
   ```

2. Clique em **"Save"**

### 6.4 Upload em massa (várias aulas de uma vez)

1. Na tela de sessões da unidade, clique em **"批量上传"**
2. Selecione múltiplos arquivos `.html`
3. O sistema criará/atualizará sessões automaticamente baseado nos nomes dos arquivos
4. Se tiver arquivos `_anki.json`, eles serão importados como cards

---

## 🔧 PARTE 7: Solução de Problemas (Troubleshooting)

### Problema: "vite: command not found" no Vercel

**Solução:** Já está configurado no `vercel.json`, mas se persistir:
1. No Vercel, vá em Settings → General
2. Em "Build Command", coloque: `npm install && npm run build`
3. Clique em "Save"
4. Faça novo deploy

### Problema: "Supabase não configurado" aparece no site

**Solução:**
1. Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas no Vercel
2. Verifique se não há espaços extras no início/fim das variáveis
3. Faça novo deploy

### Problema: Tabelas não existem no Supabase

**Solução:**
1. Volte ao SQL Editor do Supabase
2. Execute o script `supabase-schema.sql` novamente
3. Verifique se apareceu "Success"

### Problema: Site carrega mas não salva dados

**Solução:**
1. No Supabase, vá em **Authentication** → **Policies**
2. Verifique se as tabelas têm as políticas RLS (Row Level Security)
3. Se não tiver, execute esta SQL para cada tabela:
   ```sql
   ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow all" ON nome_da_tabela FOR ALL USING (true) WITH CHECK (true);
   ```

### Problema: Erro de CORS

**Solução:**
1. No Supabase, vá em **API** → **URL Configuration**
2. Em "Website URL", coloque a URL do seu site Vercel
3. Salve

---

## 📱 PARTE 8: URLs Importantes

Após configurar tudo, você terá:

| Plataforma | URL | Para que serve |
|------------|-----|----------------|
| **Seu Site** | `https://polyglot-method-studio.vercel.app` | Acesso dos alunos |
| **Supabase** | `https://app.supabase.com/project/SEU-PROJETO` | Gerenciar banco de dados |
| **GitHub** | `https://github.com/SEU-USUARIO/polyglot-method-studio` | Código fonte |
| **Vercel** | `https://vercel.com/SEU-USUARIO/polyglot-method-studio` | Configurar hospedagem |

---

## 🔐 PARTE 9: Segurança (IMPORTANTE!)

### 9.1 Mudar senha do admin

1. Faça login como admin
2. Vá em configurações (se houver) ou peça para um dev mudar no banco
3. **NUNCA** use a senha padrão `admin123` em produção!

### 9.2 Proteger o Supabase

1. No Supabase, vá em **Settings** → **API**
2. Em "JWT Settings", você pode regenerar a chave se necessário
3. **NUNCA** compartilhe sua `service_role key`!

### 9.3 Backup do banco

1. No Supabase, vá em **Database** → **Backups**
2. O Supabase faz backup automático diariamente
3. Você pode fazer backup manual quando quiser

---

## 💡 Dicas Extras

### Atualizar o site

Sempre que fizer alterações no código:
1. Suba as alterações para o GitHub
2. O Vercel faz deploy automático!
3. Aguarde 1-2 minutos e atualize o site

### Customizar domínio

1. No Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio próprio (ex: `escola.seudominio.com`)
3. Siga as instruções de DNS

### Monitorar uso

1. No Supabase, vá em **Reports** para ver estatísticas
2. No Vercel, vá em **Analytics** para ver acessos

---

## 📞 Suporte

Se tiver problemas:

1. **Supabase Docs:** https://supabase.com/docs
2. **Vercel Docs:** https://vercel.com/docs
3. **GitHub Docs:** https://docs.github.com

---

## ✅ Checklist Final

Antes de divulgar para os alunos, verifique:

- [ ] Supabase configurado com todas as tabelas
- [ ] Credenciais do Supabase no Vercel
- [ ] Site acessível online
- [ ] Login do admin funciona
- [ ] Pelo menos 1 idioma criado
- [ ] Pelo menos 1 livro criado
- [ ] Pelo menos 1 unidade criada
- [ ] Pelo menos 1 turma criada
- [ ] Unidades liberadas para a turma
- [ ] Senha do admin alterada
- [ ] Teste de cadastro de aluno funcionando
- [ ] Teste de login de aluno funcionando

---

**🎉 Parabéns! Sua plataforma está online e pronta para uso!**
