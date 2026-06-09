# Rodando o projeto na sua hospedagem + banco próprio

Este guia explica como **sair do Lovable Cloud** e usar:
- **sua própria hospedagem** (Hostinger, cPanel, Locaweb, Vercel, etc.) para o site
- **seu próprio Supabase** (gratuito em https://supabase.com) para o banco

E ainda continuar usando o **Lovable só para fazer alterações no código** — você dá `git push`, o GitHub Actions faz build e envia para sua hospedagem automaticamente.

---

## 🗺️ Visão geral do fluxo

```
[Você pede mudança no Lovable]
        ↓
[Lovable altera código + faz push pro GitHub]
        ↓
[GitHub Actions roda build]
        ↓
[FTP envia /dist pra sua hospedagem]   →  site no ar no seu domínio
        ↓
[Site conversa com SEU Supabase]        →  banco no ar na sua conta
```

Você nunca mais usa Lovable Cloud em produção. O Lovable Cloud do projeto vira só sandbox de desenvolvimento (opcional).

---

## 1️⃣ Criar SEU projeto Supabase

1. Acesse https://supabase.com → **New project**
2. Nome qualquer, escolha região (São Paulo é a mais rápida no Brasil), defina senha do banco
3. Aguarde uns 2 min até ficar **ACTIVE_HEALTHY**

Anote em **Settings → API**:
- **Project URL** (`https://xxxxx.supabase.co`)
- **anon / publishable key** (chave pública, vai no frontend)
- **service_role key** (chave secreta, **só pra edge function**)

---

## 2️⃣ Migrar o banco (tabelas, policies, triggers, functions)

Todas as estruturas do banco estão versionadas em `supabase/migrations/`. Você só roda elas no seu Supabase.

### Opção A — Painel do Supabase (mais simples)
1. No seu projeto → **SQL Editor → New query**
2. Abra cada arquivo `.sql` em `supabase/migrations/`, **em ordem** (o nome começa com a data)
3. Cole no editor e clique **Run**
4. Faça isso para todos os arquivos (são ~30, leva ~10 min)

### Opção B — CLI do Supabase (avançado, mais rápido)
```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_REF_NOVO
supabase db push
```

---

## 3️⃣ Criar os buckets de storage

No painel do **seu** Supabase → **Storage → New bucket**. Crie 3 buckets, todos **privados** (Public OFF):

| Nome | Público? |
|---|---|
| `document-templates` | Não |
| `generated-documents` | Não |
| `signatures` | Não |

---

## 4️⃣ Deploy da Edge Function `admin-create-user`

Essa função é a única coisa de backend que o projeto usa (criação de usuários via painel admin).

```bash
# instale a CLI uma vez
npm install -g supabase

# faça login e linke seu projeto
supabase login
supabase link --project-ref SEU_REF_NOVO

# faz deploy da função
supabase functions deploy admin-create-user --no-verify-jwt
```

A função usa automaticamente os secrets `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` que o Supabase já injeta — você não precisa configurar nada.

---

## 5️⃣ (Opcional) Migrar os DADOS atuais do Lovable Cloud

Se você já tem dados cadastrados aqui no Lovable e quer levar:

1. Lovable: **Cloud → Database → Tables** → selecione cada tabela → botão **Export** (gera CSV)
2. Seu Supabase: **Table Editor → cada tabela → Insert → Import from CSV**

Importe na ordem: `profiles` → `warehouses` → `categories` → `staff` → `products` → `service_orders` → `transactions` → (demais).

> **Atenção**: os usuários (`auth.users`) **não exportam por CSV**. Eles precisam ser recriados manualmente no novo Supabase em **Authentication → Users → Add user**, ou via a edge function `admin-create-user`.

---

## 6️⃣ Subir o código para o GitHub

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

> Se já estiver conectado ao Lovable via GitHub, o repositório já existe — pule esse passo.

---

## 7️⃣ Configurar os Secrets no GitHub

No repositório → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL do **seu** Supabase (passo 1) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key do **seu** Supabase (passo 1) |
| `FTP_SERVER` | endereço FTP da hospedagem (ex: `ftp.seusite.com.br`) |
| `FTP_USERNAME` | usuário FTP |
| `FTP_PASSWORD` | senha FTP |
| `FTP_SERVER_DIR` | pasta destino (Hostinger/cPanel: `/public_html/`) |

> Cada `git push` na branch `main` dispara o workflow `.github/workflows/deploy.yml` que faz build e sobe pra hospedagem.

---

## 8️⃣ Continuar usando o Lovable só pra editar

A partir daqui o ciclo é:

1. Você pede uma alteração aqui no chat do Lovable
2. Lovable edita o código e dá **push automático** pro GitHub (precisa estar com GitHub conectado em **Project → Settings → GitHub**)
3. GitHub Actions faz build e sobe pra sua hospedagem
4. Em ~2 min o site atualizado está no seu domínio

### ⚠️ O que **NÃO** funciona mais fora do Lovable

- **Lovable AI** (`LOVABLE_API_KEY`): só roda dentro da infra do Lovable. Se algum dia usarmos recursos de IA, vamos precisar de chave OpenAI/Google sua.
- **Lovable Cloud do projeto**: você pode ignorar — o site em produção lê do **seu** Supabase, não do Cloud.
- **Mudanças de banco feitas pelo Lovable Cloud**: ao mudar tabelas aqui, você precisa replicar a migration no seu Supabase rodando o `.sql` novo gerado em `supabase/migrations/`.

---

## ✅ Checklist final

- [ ] Supabase próprio criado e **ACTIVE_HEALTHY**
- [ ] Todas as migrations de `supabase/migrations/` rodaram sem erro
- [ ] Buckets `document-templates`, `generated-documents`, `signatures` criados
- [ ] Edge function `admin-create-user` com deploy feito
- [ ] (opcional) Dados migrados via CSV
- [ ] (opcional) Usuários recriados em Auth
- [ ] Código no GitHub
- [ ] 6 secrets configurados no GitHub
- [ ] Primeiro `git push` na `main` rodou verde em **Actions**
- [ ] Site abre no seu domínio e faz login com sucesso

---

## 🆘 Problemas comuns

**Tela branca no site** → `.htaccess` não foi enviado pelo FTP. No FileZilla/cPanel, habilite "mostrar arquivos ocultos" e confirme que `dist/.htaccess` chegou em `public_html/`.

**"Failed to fetch" ou erro de CORS** → o `VITE_SUPABASE_URL` ou `VITE_SUPABASE_PUBLISHABLE_KEY` no GitHub Secrets está errado. Confira em **Settings → API** no seu Supabase.

**Login não funciona** → o usuário não existe no novo Supabase. Crie em **Authentication → Users → Add user**.

**Atualizar página dá 404** → falta `.htaccess` (Apache) ou `web.config` (IIS). Ambos vêm no `dist/` automaticamente — confira se foram enviados.

**Edge function retorna 401** → faltou `--no-verify-jwt` no deploy. Rode `supabase functions deploy admin-create-user --no-verify-jwt` de novo.
