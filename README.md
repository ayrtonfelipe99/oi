# SAAS Almoxarifado — versão portável

App **100% estático** (SPA com Vite + React + TanStack Router). Roda em qualquer
hospedagem compartilhada (Hostinger, cPanel, Locaweb, KingHost, etc.) — só serve
HTML/CSS/JS, sem precisar de Node.js no servidor.

O banco de dados continua sendo Supabase, mas agora **um projeto Supabase próprio
seu**, não mais o Lovable Cloud.

---

## 1. Criar seu Supabase

1. Crie conta grátis em https://supabase.com
2. Crie um novo projeto (escolha a região mais perto do Brasil — `sa-east-1` São Paulo)
3. Aguarde provisionar (~2 min)

### Importar o schema e os dados

No Lovable, abra **Backend → Database** e exporte cada tabela como SQL/CSV. No
novo Supabase:

1. Vá em **SQL Editor** → cole o SQL de criação das tabelas → Run
2. Em **Table Editor**, importe os CSVs
3. Em **Storage**, recrie os buckets: `document-templates`, `generated-documents`, `signatures`

### Liberar acesso sem login (uso interno)

Como o app não tem autenticação, você precisa permitir que a chave `anon` leia/escreva
nas tabelas. Em **Authentication → Policies**, para cada tabela usada, crie uma policy
permissiva (ou desabilite RLS):

```sql
-- exemplo para cada tabela (repita)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff    DISABLE ROW LEVEL SECURITY;
-- ... etc
```

> ⚠️ Como não há login, **qualquer pessoa com a URL do site consegue acessar tudo**.
> Isso é aceitável para uso interno em rede local. Para internet pública, considere
> proteger por `.htpasswd` no Apache ou voltar a habilitar auth.

### Copiar as chaves

No Supabase: **Settings → API** — copie:

- **Project URL** → vai em `VITE_SUPABASE_URL`
- **anon public key** → vai em `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 2. Configurar o projeto localmente

Requer **Node.js 20+** instalado.

```bash
# 1. Instalar dependências
npm install

# 2. Criar .env com seus dados
cp .env.example .env
# edite o .env e cole sua URL e anon key

# 3. Rodar local (http://localhost:8080)
npm run dev
```

---

## 3. Gerar build para upload

```bash
npm run build
```

Isso gera a pasta `dist/` com todos os arquivos estáticos prontos.

---

## 4. Subir para a hospedagem compartilhada

### Via File Manager (cPanel / Hostinger)

1. Entre no painel da hospedagem
2. Abra o **File Manager** → pasta `public_html/`
3. Apague o conteúdo atual (se existir)
4. Faça upload de **tudo que está dentro de `dist/`** (não a pasta `dist` em si, mas o **conteúdo**)
5. Importante: o arquivo `.htaccess` precisa estar em `public_html/.htaccess` —
   ele vai junto no build dentro de `dist/` (vem de `public/.htaccess`)

### Via FTP (FileZilla)

1. Conecte com seu host/usuário/senha de FTP
2. Vá em `/public_html/`
3. Arraste todo o conteúdo de `dist/` para lá

### Hospedagem Windows (IIS)

Use o `web.config` gerado dentro de `dist/` no lugar do `.htaccess`.

---

## 5. Atualizar o site no futuro

Toda vez que alterar o código:

```bash
npm run build
# depois suba de novo o conteúdo de dist/
```

---

## Estrutura

```
src/
├── routes/              # Rotas (TanStack Router file-based)
├── components/          # Componentes
├── features/            # Features (movements, etc.)
├── integrations/
│   └── supabase/
│       ├── client.ts    # Cliente Supabase (lê do .env)
│       └── types.ts     # Tipos do banco (regenerar com supabase CLI)
├── main.tsx             # Entry point
└── router.tsx           # Config do router

public/
├── .htaccess            # SPA fallback Apache
└── web.config           # SPA fallback IIS
```

## Regenerar tipos do Supabase (opcional)

```bash
npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/integrations/supabase/types.ts
```
