# Como subir o site para a hospedagem

Você tem **dois caminhos** — use o que preferir, ou os dois.

---

## 🅰️ Caminho 1: Deploy automático pelo GitHub (recomendado)

Toda vez que você fizer `git push` na branch `main`, o GitHub Actions:
1. Instala as dependências
2. Roda `npm run build`
3. Envia a pasta `dist/` por FTP pra sua hospedagem

### Passo a passo (configura uma vez só)

#### 1. Subir o projeto pro GitHub

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

#### 2. Configurar os Secrets no GitHub

No repositório → **Settings → Secrets and variables → Actions → New repository secret**.

Crie estes 5 secrets:

| Nome | O que colocar | Onde achar |
|------|---------------|------------|
| `FTP_SERVER` | endereço FTP, ex: `ftp.seusite.com.br` | painel da hospedagem |
| `FTP_USERNAME` | usuário FTP | painel da hospedagem |
| `FTP_PASSWORD` | senha FTP | painel da hospedagem |
| `FTP_SERVER_DIR` | pasta destino, ex: `/public_html/` (com barras) | depende da hospedagem |
| `VITE_SUPABASE_URL` | URL do seu Supabase | Supabase → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key do Supabase | Supabase → Settings → API |

> **Hostinger**: `FTP_SERVER_DIR` geralmente é `/public_html/`
> **cPanel**: idem `/public_html/`
> **Locaweb**: `/web/`

#### 3. Pronto

Faça qualquer alteração, dê `git push` e veja o deploy rodando em **Actions** no GitHub. Em ~2 min o site está no ar.

Pra rodar manualmente sem push: **Actions → Deploy para Hospedagem → Run workflow**.

---

## 🅱️ Caminho 2: Sem GitHub, build local + upload manual

Funciona offline, sem precisar de Git nem GitHub.

```bash
# 1. instalar dependências (uma vez)
npm install

# 2. garantir que o .env tem suas credenciais Supabase
#    (copie de .env.example e preencha)

# 3. gerar o build
npm run build
```

Depois do build, confirme que dentro de `dist/` existem estes arquivos:

```bash
dist/.htaccess
dist/web.config
```

Depois abra a pasta `dist/` que foi criada, e confirme que nela existem também `.htaccess` (Apache) e `web.config` (IIS). Em seguida:

- **cPanel / Hostinger File Manager**: entra em `public_html/`, apaga o conteúdo antigo, faz upload de **tudo que está dentro de `dist/`**
- **FileZilla (FTP)**: conecta no servidor, vai em `/public_html/`, arrasta tudo que está dentro de `dist/`

Pronto. Não esquecer do arquivo `.htaccess` (vem junto, vindo de `public/.htaccess`). Se ele não estiver no servidor, as rotas internas podem abrir e depois cair em **Not Found** ao atualizar ou acessar direto.

---

## 🔁 Dá pra usar os dois?

Sim. Você pode trabalhar offline, testar local (`npm run dev`), e quando quiser:
- subir manual via FTP **OU**
- commitar e dar push pro GitHub deployar sozinho

---

## ❓ Problemas comuns

**"Tela branca" no site publicado** → confira no painel da hospedagem se o `.htaccess` foi enviado (às vezes FTP esconde arquivos que começam com ponto — habilite "mostrar arquivos ocultos").

**"Página não encontrada" ao atualizar uma rota interna** → mesma causa: `.htaccess` faltando.

**Erro de variável VITE_SUPABASE no console** → você esqueceu de configurar os secrets no GitHub (caminho 1) ou o `.env` local (caminho 2).

**FTP do GitHub falha com "530 Login incorrect"** → confira `FTP_USERNAME` e `FTP_PASSWORD`. Em algumas hospedagens o usuário precisa ser `usuario@seusite.com.br` (com domínio).
