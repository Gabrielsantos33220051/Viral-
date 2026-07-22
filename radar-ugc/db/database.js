// db/database.js
// Inicializa o banco SQLite e garante que as tabelas existam.
// Em produção com muitos usuários simultâneos, trocar por Postgres (Supabase/Neon/Railway)
// e ajustar as queries — a estrutura das tabelas continua igual.

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'radar-ugc.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'criador', -- criador | empresa
  nichos TEXT DEFAULT '[]',             -- array JSON de strings
  plano TEXT NOT NULL DEFAULT 'free',   -- free | pro | empresa
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  nicho TEXT DEFAULT 'geral',
  tipo_remuneracao TEXT DEFAULT 'a combinar', -- pago | permuta | a combinar
  valor_estimado TEXT,
  link_original TEXT,
  fonte TEXT NOT NULL,               -- de onde a vaga veio
  origem TEXT NOT NULL DEFAULT 'scraping', -- scraping | manual
  status TEXT NOT NULL DEFAULT 'ativa',    -- ativa | expirada
  data_publicacao TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(titulo, fonte)
);

CREATE TABLE IF NOT EXISTS scraping_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fonte TEXT NOT NULL,
  vagas_encontradas INTEGER DEFAULT 0,
  executado_em TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT DEFAULT 'ok',
  erro TEXT
);
`);

module.exports = db;
