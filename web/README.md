# Forrageamento Visual — Versão Online

Plataforma web para o **Experimento 2** (sessão contínua), com mouse como indicador de atenção visual.

## Fluxo

1. Boas-vindas  
2. **TCLE** com assinatura digital  
3. Instruções didáticas (4 passos + ilustração L/T)  
4. Checklist de ambiente  
5. Tarefa (~7 min)  
6. Agradecimento + salvamento automático  

## Como rodar

```bash
cd web
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Modo teste (30 segundos)

Em desenvolvimento, a sessão dura 30 s por padrão. Para forçar outra duração:

```
http://localhost:3000?duration=60
```

## Dados

**Local (dev):** `web/data/online/` (criado automaticamente).

**Produção (Vercel):** use **Supabase** — o disco da Vercel é efêmero/read-only (`ENOENT mkdir /var/task/data`).

1. Crie um projeto em [supabase.com](https://supabase.com)
2. SQL Editor → execute `web/supabase/schema.sql`
3. Settings → API → copie `URL` e `service_role`
4. Na Vercel → Environment Variables:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=forrageamento
```

Tabelas: `participants` (progresso/TCLE) e `submissions` (eventos/CSV/assinatura). Arquivos também vão para o bucket Storage `forrageamento`.

## Interface

Estudo de **Victor Correard** — layout navy, acentos ciano, cards em vidro, grid de fundo, tipografia Plus Jakarta Sans.

Tokens: `lib/vekon/tokens.ts` · Shell: `components/ui/vekon-shell.tsx`

## Ética e coleta online

Alinhado à **Res. CNS 510/2016**, orientações **CONEP** para ambiente virtual e **LGPD**:

- TCLE completo com seções obrigatórias
- Download da cópia do TCLE (recomendação CONEP)
- Código anônimo separado de nome/e-mail
- IP **não** coletado
- Checklist de privacidade e idade (18+)
- Retenção de dados documentada (5 anos)

Configure pesquisador e CEP em `web/.env.local` (copie de `.env.example`).

## Deploy

```bash
npm run build
npm start
```

Para produção remota, faça deploy em Vercel/Netlify e configure armazenamento persistente (S3, Supabase, etc.) — a API local grava em disco.
