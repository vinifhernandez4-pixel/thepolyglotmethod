# 🚀 GUIA DE DEPLOY - THE POLYGLOT METHOD STUDIO

## 📋 ÍNDICE
1. [Visão Geral](#visão-geral)
2. [Passo 1: Criar Conta no Supabase](#passo-1-criar-conta-no-supabase)
3. [Passo 2: Configurar Banco de Dados](#passo-2-configurar-banco-de-dados)
4. [Passo 3: Criar Conta no GitHub](#passo-3-criar-conta-no-github)
5. [Passo 4: Subir Código no GitHub](#passo-4-subir-código-no-github)
6. [Passo 5: Deploy no Vercel](#passo-5-deploy-no-vercel)
7. [Solução de Problemas](#solução-de-problemas)

---

## 📖 VISÃO GERAL

Este guia vai te ajudar a colocar seu site **The Polyglot Method Studio** online com:
- **Banco de dados**: Supabase (gratuito)
- **Hospedagem do código**: GitHub (gratuito)
- **Hospedagem do site**: Vercel (gratuito)

**Tempo estimado**: 30-45 minutos

---

## 🔧 PASSO 1: CRIAR CONTA NO SUPABASE

### 1.1 Acesse o site do Supabase
1. Vá para: **https://supabase.com**
2. Clique em **"Start your project"** ou **"Sign Up"**
3. Escolha criar conta com **GitHub** (mais fácil)
4. Siga as instruções de verificação de email

### 1.2 Criar um novo projeto
1. Depois de logar, clique em **"New Project"**
2. Preencha os campos:
   - **Organization**: Deixe o padrão ou crie uma nova
   - **Project name**: `polyglot-studio` (ou qualquer nome)
   - **Database Password**: Crie uma senha forte e **GUARDE EM LUGAR SEGURO**
   - **Region**: Escolha **"East Asia (Singapore)"** (mais próximo da China)
3. Clique em **"Create new project"**
4. Aguarde 1-2 minutos até o projeto ser criado

### 1.3 Pegar as credenciais do Supabase
1. No painel do projeto, clique no ícone de **engrenagem** (Settings) no menu lateral
2. Clique em **"API"**
3. Você verá duas informações importantes:
   - **URL**: `https://xxxxxxxx.supabase.co` (copie isso)
   - **anon public**: `eyJhbG...` (copie isso também)
4. **Guarde essas informações** - vamos usar no Passo 5

---

## 🗄️ PASSO 2: CONFIGURAR BANCO DE DADOS

### 2.1 Abrir o SQL Editor
1. No painel do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**

### 2.2 Criar as tabelas
1. Abra o arquivo **`supabase-schema.sql`** que veio no ZIP
2. **Copie TODO o conteúdo** do arquivo (Ctrl+A, Ctrl+C)
3. Volte ao SQL Editor do Supabase
4. **Cole o código** (Ctrl+V)
5. Clique no botão **"Run"** (botão verde no canto superior direito)
6. Aguarde a mensagem **"Success. No rows returned"**

✅ **Pronto!** Seu banco de dados está criado!

---

## 💻 PASSO 3: CRIAR CONTA NO GITHUB

### 3.1 Criar conta
1. Vá para: **https://github.com**
2. Clique em **"Sign up"**
3. Preencha:
   - Email
   - Senha
   - Username (ex: `polyglot-admin`)
4. Verifique seu email

---

## 📁 PASSO 4: SUBIR CÓDIGO NO GITHUB

### 4.1 Criar um novo repositório
1. No GitHub, clique no **+** (canto superior direito)
2. Clique em **"New repository"**
3. Preencha:
   - **Repository name**: `polyglot-studio`
   - **Description**: (opcional) Sistema de ensino de idiomas
   - **Public** ou **Private** (sua escolha)
   - ✅ **NÃO marque** "Add a README file"
   - ✅ **NÃO marque** "Add .gitignore"
   - ✅ **NÃO marque** "Choose a license"
4. Clique em **"Create repository"**

### 4.2 Fazer upload dos arquivos
1. Na página do repositório criado, clique em **"uploading an existing file"**
2. Você verá uma área para arrastar arquivos
3. **Extraia o ZIP** que você recebeu
4. **Selecione TODOS os arquivos e pastas** da pasta extraída:
   - 📁 `src/`
   - 📁 `public/`
   - 📄 `index.html`
   - 📄 `package.json`
   - 📄 `tsconfig.json`
   - 📄 `vite.config.ts`
   - 📄 `tailwind.config.js`
   - 📄 `components.json`
   - 📄 `eslint.config.js`
   - 📄 `.env.example`
   - 📄 `supabase-schema.sql`
   - 📄 `README-DEPLOY.md`
5. **Arraste** todos esses arquivos para a área do GitHub
6. Aguarde o upload (pode levar alguns minutos)
7. No campo **"Commit changes"**, escreva: `Initial commit`
8. Clique em **"Commit changes"**

✅ **Pronto!** Seu código está no GitHub!

---

## 🌐 PASSO 5: DEPLOY NO VERCEL

### 5.1 Criar conta no Vercel
1. Vá para: **https://vercel.com**
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"**
4. Autorize o Vercel a acessar seu GitHub

### 5.2 Importar o projeto
1. No dashboard do Vercel, clique em **"Add New..."** → **"Project"**
2. Você verá seus repositórios do GitHub
3. Encontre e clique em **"polyglot-studio"**
4. Clique em **"Import"**

### 5.3 Configurar o deploy
1. Na página de configuração:
   - **Framework Preset**: Selecione **"Vite"**
   - **Root Directory**: Deixe `./` (padrão)
   - ✅ **NÃO mude** outras opções

2. **IMPORTANTE** - Adicionar variáveis de ambiente:
   - Clique em **"Environment Variables"** para expandir
   - Adicione duas variáveis:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Cole a URL do Supabase (Passo 1.3) |
   | `VITE_SUPABASE_ANON_KEY` | Cole a chave anon do Supabase (Passo 1.3) |

3. Clique em **"Deploy"**
4. Aguarde 2-3 minutos até o deploy terminar

### 5.4 Ver seu site online!
1. Quando terminar, você verá uma mensagem **"Congratulations!"**
2. Clique no link que aparece (ex: `https://polyglot-studio.vercel.app`)
3. **Seu site está online!** 🎉

---

## 🔐 CRIAR CONTA DE ADMIN

### Acesse seu site
1. Vá para o link do seu site (ex: `https://polyglot-studio.vercel.app`)
2. Na página de login, clique em **"注册"** (Registrar)
3. Crie uma conta com:
   - **Nome**: `Administrador`
   - **Email**: `admin@polyglot.com`
   - **Senha**: (sua senha)
   - **角色**: `管理员` (Admin)
4. Clique em **"注册"**

⚠️ **IMPORTANTE**: A primeira conta criada deve ser de ADMIN para você gerenciar o sistema!

---

## 📝 ESTRUTURA DOS ARQUIVOS

```
polyglot-studio/
├── 📁 src/                    # Código fonte
│   ├── 📁 components/         # Componentes UI
│   ├── 📁 contexts/           # Contextos React
│   ├── 📁 lib/                # Funções de banco de dados
│   │   ├── supabase.ts        # Configuração do Supabase
│   │   ├── database-online.ts # Funções online
│   │   ├── database.ts        # Banco de dados principal
│   │   └── fsrs.ts            # Algoritmo Anki
│   ├── 📁 pages/              # Páginas do site
│   └── 📁 types/              # Tipos TypeScript
├── 📁 public/                 # Arquivos estáticos
├── 📄 index.html              # Página inicial
├── 📄 package.json            # Dependências
├── 📄 vite.config.ts          # Configuração Vite
├── 📄 tailwind.config.js      # Configuração Tailwind
├── 📄 .env.example            # Exemplo de variáveis
├── 📄 supabase-schema.sql     # SQL para criar tabelas
└── 📄 README-DEPLOY.md        # Este arquivo
```

---

## 🛠️ SOLUÇÃO DE PROBLEMAS

### Problema: "Supabase não configurado"
**Solução**: Verifique se as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas no Vercel.

### Problema: "Erro ao criar conta"
**Solução**: Verifique se o SQL foi executado corretamente no Passo 2.

### Problema: Site não carrega
**Solução**: 
1. No Vercel, vá em **"Deployments"**
2. Clique no deploy mais recente
3. Veja os logs de erro em **"Build Logs"**

### Problema: Dados não salvam
**Solução**: Verifique as políticas de segurança (RLS) no Supabase:
1. No Supabase, vá em **"Table Editor"**
2. Clique em uma tabela
3. Clique em **"Policies"**
4. Verifique se as políticas estão criadas

---

## 📞 SUPORTE

Se tiver problemas:
1. Verifique se seguiu todos os passos na ordem correta
2. Confira se copiou as credenciais do Supabase corretamente
3. Certifique-se de que o SQL foi executado sem erros

---

## ✅ CHECKLIST FINAL

- [ ] Criei conta no Supabase
- [ ] Criei projeto no Supabase
- [ ] Copiei URL e anon key do Supabase
- [ ] Executei o SQL no Supabase
- [ ] Criei conta no GitHub
- [ ] Criei repositório no GitHub
- [ ] Fiz upload dos arquivos
- [ ] Criei conta no Vercel
- [ ] Importei projeto do GitHub
- [ ] Adicionei variáveis de ambiente
- [ ] Fiz deploy
- [ ] Testei o site

---

**🎉 PARABÉNS! Seu site está online!**
