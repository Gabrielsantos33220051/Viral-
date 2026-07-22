# Radar UGC — SaaS de vagas e permutas de conteúdo

SaaS completo e funcional: landing page, cadastro, login, painel com vagas,
banco de dados e um scraper real de fontes abertas.

## O que já funciona de verdade neste projeto

- **Cadastro e login reais**, com senha criptografada (bcrypt) e sessão via cookie (JWT)
- **Banco de dados SQLite** já com as tabelas de usuários, vagas e log de scraping
- **Painel protegido** — só acessa quem está logado — mostrando vagas puxadas do banco
- **Regra de plano**: usuários `free` veem só 5 vagas/semana com 24-48h de atraso; `pro`/`empresa` veem tudo em tempo real
- **Scraper real** (`scraper/scraper.js`) que lê um feed RSS público, filtra por palavras-chave de UGC, classifica por nicho e salva no banco — sem duplicar
- **Agendamento automático**: o servidor roda o scraper sozinho a cada 3 horas

## Rodando localmente

```bash
npm install
npm run seed      # popula o banco com vagas de exemplo (não obrigatório)
npm start
```

Acesse `http://localhost:3000`. Crie uma conta em `/cadastro` e veja o painel em `/dashboard`.

Para forçar uma varredura manual do scraper:

```bash
npm run scrape
```

## Estrutura de pastas

```
radar-ugc/
├── server.js              → servidor principal, rotas e agendamento
├── routes/
│   ├── auth.js             → cadastro, login, logout, proteção de rotas
│   └── jobs.js              → API que entrega as vagas por plano
├── scraper/
│   └── scraper.js          → varredura de fontes abertas (RSS) + classificação
├── db/
│   ├── database.js          → conexão e schema do SQLite
│   └── seed.js               → vagas de exemplo
├── views/                   → páginas (landing, login, cadastro, dashboard)
└── public/css/              → estilos
```

## Antes de colocar no ar: o que você precisa decidir

1. **Fontes do scraper.** Já vem com 6 feeds públicos configurados (We Work
   Remotely, Jobicy e RemoteOK, nas categorias de marketing/design/conteúdo),
   todos filtrados pela lista de palavras-chave de UGC antes de virar vaga no
   banco. O maior salto de qualidade agora é adicionar fontes de maior valor:
   formulários próprios que marcas usam para recrutar criadores (seeding) e
   editais de campanha. Essas geralmente não têm RSS padrão — me manda 2-3
   links de marcas que você já sabe que fazem esse tipo de recrutamento que eu
   monto o adaptador específico pra cada uma. Fontes novas em formato RSS são
   só mais um objeto no array `FONTES` em `scraper/scraper.js`.
2. **Scraping de redes sociais e marketplaces fechados** (Instagram, Workana,
   99Freelas, LinkedIn) **não está incluído de propósito** — normalmente viola
   os termos de uso dessas plataformas. Antes de adicionar esse tipo de fonte,
   valide com um advogado.
3. **Troque o `JWT_SECRET`** no `.env` antes de ir para produção (veja `.env.example`).
4. **Banco de dados**: SQLite é ótimo para começar, mas em hospedagens
   *serverless* (como Vercel) o arquivo não persiste entre execuções. Se for
   usar esse tipo de hospedagem, troque por Postgres — o schema em
   `db/database.js` é simples de portar.

## Como hospedar (passo a passo)

### Opção recomendada para começar: Railway ou Render (grátis para validar)

1. Suba esta pasta para um repositório no GitHub.
2. Crie uma conta em [railway.app](https://railway.app) ou [render.com](https://render.com).
3. Clique em "New Project" → "Deploy from GitHub" → selecione o repositório.
4. Configure a variável de ambiente `JWT_SECRET` (gere uma string aleatória longa).
5. O comando de start já está no `package.json` (`npm start`) — a plataforma detecta sozinha.
6. Pronto: você recebe uma URL pública tipo `radar-ugc.up.railway.app`.

### Se quiser usar domínio próprio

Depois de hospedado, vá nas configurações de domínio da Railway/Render e
aponte seu domínio (ex: `radarugc.com.br`) seguindo as instruções de DNS
que a própria plataforma mostra (geralmente um registro CNAME).

### Garantir que o scraper rode mesmo com o servidor "dormindo"

Planos gratuitos de hospedagem costumam "dormir" o servidor após um tempo
sem acesso — e aí o `cron` interno para de rodar. Duas soluções simples:

- Use um serviço externo gratuito como [cron-job.org](https://cron-job.org)
  para chamar sua própria URL a cada poucas horas (mantém o servidor acordado).
- Ou crie um endpoint dedicado (ex: `/api/scraper/rodar`) protegido por uma
  chave secreta, e chame ele de fora via cron externo.

## Próximos passos sugeridos

- Adicionar alertas por WhatsApp (Twilio) quando surgir vaga no nicho do usuário
- Adicionar mais fontes reais de scraping
- Cobrança automática do plano Pro (Stripe ou Pagar.me)
- Área da empresa para publicar vaga diretamente (sem depender de scraping)
