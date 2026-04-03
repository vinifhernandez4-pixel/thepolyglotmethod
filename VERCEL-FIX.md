# 🔧 COMO CONSERTAR O ERRO NO VERCEL

## ❌ Erro: `sh: line 1: vite: command not found`

Este erro acontece porque o Vercel não instalou as dependências do projeto.

---

## ✅ SOLUÇÃO RÁPIDA

### Opção 1: Configurar no Dashboard do Vercel (Recomendado)

1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto `polyglot-studio`
3. Clique na aba **"Settings"** (Configurações)
4. No menu lateral, clique em **"Build & Development Settings"**
5. Configure assim:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | `Vite` |
| **Build Command** | `npm install && npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

6. Clique em **"Save"**
7. Volte para **"Deployments"**
8. Clique nos **três pontinhos** do deploy mais recente
9. Clique em **"Redeploy"**

---

### Opção 2: Adicionar arquivo vercel.json

Se você já tem o arquivo `vercel.json` no seu projeto, certifique-se de que ele está assim:

```json
{
  "version": 2,
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

1. Adicione esse arquivo na raiz do projeto
2. Faça commit e push para o GitHub
3. O Vercel vai detectar automaticamente

---

### Opção 3: Recriar o Projeto no Vercel

Se nada funcionar, delete e recrie:

1. No Vercel, vá em **Settings** → **General** → **Delete Project**
2. No GitHub, certifique-se de que o `package.json` está na raiz
3. No Vercel, clique **"Add New..."** → **"Project"**
4. Importe o projeto novamente
5. Na tela de configuração, escolha:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`

---

## ⚠️ VERIFICAÇÕES IMPORTANTES

### Verifique se no GitHub:
- [ ] `package.json` está na **raiz** do repositório
- [ ] `vite` está em `devDependencies`
- [ ] `vercel.json` existe (opcional, mas ajuda)

### Estrutura correta no GitHub:
```
polyglot-studio/           ← raiz do repositório
├── package.json           ← DEVE estar aqui!
├── vercel.json            ← arquivo de config
├── vite.config.ts
├── index.html
├── src/
├── public/
└── ...
```

---

## 🆘 SE NADA FUNCIONAR

1. Delete o projeto no Vercel
2. No seu computador, verifique se a pasta tem:
   - `package.json` com `"vite": "^7.2.4"` em `devDependencies`
3. Suba TODOS os arquivos novamente para o GitHub
4. Crie novo projeto no Vercel
5. Escolha **"Vite"** como framework na configuração

---

## 📞 ERRO PERSISTE?

Verifique os logs completos do build no Vercel:
1. Vá em **Deployments**
2. Clique no deploy que falhou
3. Clique em **"Build Logs"**
4. Procure por erros em vermelho
