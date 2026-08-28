# ForragemantoVisual

Estudo de forrageamento visual — PsychoPy (laboratório) + versão online (Exp. 2).

## Deploy na Vercel (obrigatório)

O app Next.js está em **`web/`**, não na raiz do repositório.

Na Vercel:

1. Abra o projeto → **Settings** → **General**
2. **Root Directory** → clique **Edit**
3. Digite: `web`
4. **Save**
5. **Deployments** → último deploy → **Redeploy**

Sem isso, a Vercel não encontra o `package.json` com Next.js e o build falha.

## Rodar localmente

```bash
cd web
npm install
npm run dev
```

Abra http://localhost:3000

## PsychoPy (laboratório)

```bash
pip install -r requirements.txt
python forrageamento_exp1.py --experiment 2 --dummy
```
