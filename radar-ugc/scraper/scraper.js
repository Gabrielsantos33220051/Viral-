// scraper/scraper.js
//
// Scraper real de vagas UGC. Roda de forma independente (via `npm run scrape`
// ou agendado por cron dentro do server.js).
//
// IMPORTANTE — leia antes de escalar isso:
// Este scraper só busca de FONTES ABERTAS (feeds RSS públicos e formulários
// que a própria marca disponibiliza). Ele NÃO faz scraping de plataformas
// como Instagram, Workana, 99Freelas ou LinkedIn, porque isso normalmente
// viola os termos de uso delas — antes de adicionar esse tipo de fonte,
// valide com um advogado.
//
// Para adicionar uma fonte nova: crie um objeto no array FONTES abaixo
// seguindo o mesmo formato. O scraper já cuida de deduplicar, classificar
// por nicho e salvar no banco.

const Parser = require('rss-parser');
const db = require('../db/database');

const parser = new Parser({ timeout: 15000 });

// Palavras-chave que indicam que a vaga é relevante para criadores UGC
const PALAVRAS_UGC = [
  'ugc', 'criador de conteúdo', 'creator', 'influenciador', 'unboxing',
  'review de produto', 'vídeo review', 'content creator', 'produtor de conteúdo',
  'influencer', 'video creator', 'user generated content', 'brand ambassador',
  'social content', 'tiktok creator', 'product review video', 'seeding'
];

// Mapa simples de nicho por palavra-chave encontrada no título/descrição
const MAPA_NICHO = {
  beleza: ['skincare', 'maquiagem', 'cosmético', 'beleza'],
  fitness: ['suplemento', 'academia', 'fitness', 'treino'],
  tech: ['app', 'software', 'tecnologia', 'fintech'],
  infantil: ['infantil', 'criança', 'brinquedo'],
  casa: ['casa', 'eletrodoméstico', 'decoração'],
  moda: ['moda', 'roupa', 'vestuário'],
  alimentação: ['comida', 'restaurante', 'delivery', 'alimentício']
};

function classificarNicho(texto) {
  const lower = texto.toLowerCase();
  for (const [nicho, palavras] of Object.entries(MAPA_NICHO)) {
    if (palavras.some((p) => lower.includes(p))) return nicho;
  }
  return 'geral';
}

function pareceUGC(texto) {
  const lower = texto.toLowerCase();
  return PALAVRAS_UGC.some((p) => lower.includes(p));
}

// Lista de fontes RSS abertas. Adicione novas fontes aqui.
// Todas abaixo são feeds públicos e legítimos — cada um é filtrado pelas
// palavras-chave de UGC antes de virar vaga no banco, então mesmo fontes
// genéricas de vagas remotas só entram se a vaga específica falar de
// criação de conteúdo/UGC/review/unboxing.
const FONTES = [
  {
    nome: 'We Work Remotely — marketing',
    tipo: 'rss',
    url: 'https://weworkremotely.com/categories/remote-marketing-jobs.rss'
  },
  {
    nome: 'We Work Remotely — design',
    tipo: 'rss',
    url: 'https://weworkremotely.com/categories/remote-design-jobs.rss'
  },
  {
    nome: 'Jobicy — marketing',
    tipo: 'rss',
    url: 'https://jobicy.com/?feed=job_feed&job_categories=marketing'
  },
  {
    nome: 'Jobicy — design & criação',
    tipo: 'rss',
    url: 'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia'
  },
  {
    nome: 'RemoteOK — conteúdo',
    tipo: 'rss',
    url: 'https://remoteok.com/remote-content-jobs.rss'
  },
  {
    nome: 'RemoteOK — marketing',
    tipo: 'rss',
    url: 'https://remoteok.com/remote-marketing-jobs.rss'
  }
  // Fontes de maior valor pra esse produto — recomendo adicionar assim que
  // encontradas — são formulários próprios de marca (ex: "trabalhe com a
  // gente" de e-commerces que fazem seeding) e editais de campanha. Não têm
  // formato padrão, então cada uma normalmente exige um pequeno adaptador
  // específico em vez de RSS. Posso montar esse adaptador assim que você
  // me mandar 2-3 links de marcas que já fazem esse tipo de recrutamento.
];

async function rodarFonteRSS(fonte) {
  let encontradas = 0;
  try {
    const feed = await parser.parseURL(fonte.url);
    const inserir = db.prepare(`
      INSERT OR IGNORE INTO jobs (titulo, descricao, nicho, tipo_remuneracao, valor_estimado, link_original, fonte, origem)
      VALUES (@titulo, @descricao, @nicho, 'a combinar', NULL, @link, @fonte, 'scraping')
    `);

    for (const item of feed.items) {
      const textoCompleto = `${item.title || ''} ${item.contentSnippet || ''}`;
      if (!pareceUGC(textoCompleto)) continue;

      const resultado = inserir.run({
        titulo: (item.title || 'Vaga sem título').slice(0, 200),
        descricao: (item.contentSnippet || '').slice(0, 500),
        nicho: classificarNicho(textoCompleto),
        link: item.link || '',
        fonte: fonte.nome
      });
      if (resultado.changes > 0) encontradas++;
    }

    db.prepare(`INSERT INTO scraping_log (fonte, vagas_encontradas, status) VALUES (?, ?, 'ok')`)
      .run(fonte.nome, encontradas);
  } catch (err) {
    db.prepare(`INSERT INTO scraping_log (fonte, vagas_encontradas, status, erro) VALUES (?, 0, 'erro', ?)`)
      .run(fonte.nome, String(err.message || err));
    console.error(`[scraper] Erro na fonte "${fonte.nome}":`, err.message);
  }
  return encontradas;
}

async function rodarTodasAsFontes() {
  console.log(`[scraper] Iniciando varredura em ${FONTES.length} fonte(s)...`);
  let total = 0;
  for (const fonte of FONTES) {
    if (fonte.tipo === 'rss') {
      const n = await rodarFonteRSS(fonte);
      console.log(`[scraper] ${fonte.nome}: ${n} vaga(s) nova(s)`);
      total += n;
    }
  }
  console.log(`[scraper] Varredura concluída. Total de vagas novas: ${total}`);
  return total;
}

// Permite rodar direto: node scraper/scraper.js
if (require.main === module) {
  rodarTodasAsFontes().then(() => process.exit(0));
}

module.exports = { rodarTodasAsFontes };
