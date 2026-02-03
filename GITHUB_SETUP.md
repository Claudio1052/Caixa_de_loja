# 🚀 Guia Rápido - Deploy no GitHub

## Passo a Passo

### 1. Crie um novo repositório no GitHub

Acesse: https://github.com/new

- **Nome:** `pdv-magico-pro`
- **Descrição:** Sistema Inteligente de Vendas
- **Público** ou **Privado** (sua escolha)
- ✅ Marque "Add a README file"

Clique em **Create repository**

---

### 2. Configure o Supabase

1. Acesse: https://supabase.com
2. Crie um novo projeto
3. Vá em **SQL Editor** → **New query**
4. Cole todo o conteúdo do arquivo `supabase_schema.sql`
5. Clique em **Run**

**Copie suas credenciais:**
- Project URL: `https://SEU-PROJETO.supabase.co`
- Anon Key: (em Project Settings → API)

---

### 3. Atualize as credenciais no código

Edite `src/lib/supabase.ts`:

```typescript
const supabaseUrl = 'https://SEU-PROJETO.supabase.co';
const supabaseAnonKey = 'SUA-ANON-KEY-AQUI';
```

---

### 4. Envie o código para o GitHub

```bash
# No terminal, na pasta do projeto
git init
git add .
git commit -m "Initial commit - PDV Mágico Pro"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/pdv-magico-pro.git
git push -u origin main
```

---

### 5. Ative o GitHub Pages

1. No repositório, vá em **Settings** → **Pages**
2. Em **Source**, selecione **GitHub Actions**
3. O workflow já está configurado em `.github/workflows/deploy.yml`

---

### 6. Acesse seu site

Após o deploy (leva ~2 minutos), acesse:

```
https://SEU-USUARIO.github.io/pdv-magico-pro/
```

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `supabase_schema.sql` | Schema do banco de dados |
| `src/lib/supabase.ts` | Configuração do Supabase |
| `vite.config.ts` | Configuração do Vite |
| `.github/workflows/deploy.yml` | Workflow de deploy |

---

## 🔄 Atualizações

Cada push na branch `main` dispara um novo deploy automaticamente!

---

## ❓ Problemas Comuns

### "Repository not found"
- Verifique se o nome do repositório está correto
- Confirme que você tem permissão de escrita

### "Build failed"
- Verifique se o `package.json` está correto
- Confirme que todas as dependências estão instaladas

### "Page not found" (404)
- Espere 2-5 minutos após o primeiro deploy
- Verifique se o GitHub Pages está ativado em Settings

---

## 📞 Suporte

Abra uma issue no repositório em caso de problemas.
