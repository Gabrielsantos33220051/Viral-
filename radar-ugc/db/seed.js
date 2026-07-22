// db/seed.js
// Popula o banco com vagas de exemplo, pra o painel nao comecar vazio
// antes do primeiro ciclo real de scraping rodar.
// Rodar com: npm run seed

const db = require('./database');

const vagasExemplo = [
  {
    titulo: 'Criadora para unboxing de linha de skincare',
    descricao: 'Marca de skincare busca criadora para gravar unboxing + review de 3 produtos. Envio do kit por conta da marca.',
    nicho: 'beleza',
    tipo_remuneracao: 'permuta',
    valor_estimado: 'Kit avaliado em R$250',
    link_original: 'https://exemplo.com/vaga-skincare',
    fonte: 'formulário direto de marca',
    origem: 'manual'
  },
  {
    titulo: 'Vídeo review de suplemento para academia',
    descricao: 'Empresa de suplementos busca criador fitness para vídeo de resultado após 30 dias de uso.',
    nicho: 'fitness',
    tipo_remuneracao: 'pago',
    valor_estimado: 'R$600',
    link_original: 'https://exemplo.com/vaga-suplemento',
    fonte: 'campanha ativa',
    origem: 'manual'
  },
  {
    titulo: 'UGC storytelling para app de organização financeira',
    descricao: 'Fintech busca criador para vídeo estilo "dia na vida" usando o app.',
    nicho: 'tech',
    tipo_remuneracao: 'pago',
    valor_estimado: 'R$800',
    link_original: 'https://exemplo.com/vaga-fintech',
    fonte: 'freelancer · aberto',
    origem: 'manual'
  },
  {
    titulo: 'Vídeo unboxing de brinquedos educativos',
    descricao: 'Marca infantil busca criadores com filhos pequenos para gravação de unboxing.',
    nicho: 'infantil',
    tipo_remuneracao: 'permuta',
    valor_estimado: 'Produto avaliado em R$180',
    link_original: 'https://exemplo.com/vaga-brinquedos',
    fonte: 'grupo de comunidade',
    origem: 'manual'
  },
  {
    titulo: 'Review de air fryer para loja de eletros',
    descricao: 'E-commerce de eletrodomésticos busca criador para vídeo curto de review.',
    nicho: 'casa',
    tipo_remuneracao: 'pago',
    valor_estimado: 'R$280',
    link_original: 'https://exemplo.com/vaga-airfryer',
    fonte: 'formulário direto de marca',
    origem: 'manual'
  }
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO jobs (titulo, descricao, nicho, tipo_remuneracao, valor_estimado, link_original, fonte, origem)
  VALUES (@titulo, @descricao, @nicho, @tipo_remuneracao, @valor_estimado, @link_original, @fonte, @origem)
`);

const insertMany = db.transaction((vagas) => {
  for (const vaga of vagas) insert.run(vaga);
});

insertMany(vagasExemplo);
console.log(`Seed concluído: ${vagasExemplo.length} vagas de exemplo inseridas (se já não existiam).`);
