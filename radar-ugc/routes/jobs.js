// routes/jobs.js
const express = require('express');
const db = require('../db/database');
const { exigirLoginAPI } = require('./auth');

const router = express.Router();

// Retorna as vagas ativas do dia, mais recentes primeiro.
// Free: só as vagas com mais de 24h (delay). Pro/Empresa: tudo em tempo real.
router.get('/', exigirLoginAPI, (req, res) => {
  const usuario = db.prepare('SELECT * FROM users WHERE id = ?').get(req.usuario.id);
  const ehPro = usuario.plano === 'pro' || usuario.plano === 'empresa';

  const query = ehPro
    ? `SELECT * FROM jobs WHERE status = 'ativa' ORDER BY data_publicacao DESC LIMIT 50`
    : `SELECT * FROM jobs WHERE status = 'ativa' AND data_publicacao <= datetime('now', '-24 hours') ORDER BY data_publicacao DESC LIMIT 5`;

  const vagas = db.prepare(query).all();
  res.json({ vagas, plano: usuario.plano, total_ativas: db.prepare(`SELECT COUNT(*) AS n FROM jobs WHERE status='ativa'`).get().n });
});

router.get('/me', exigirLoginAPI, (req, res) => {
  const usuario = db.prepare('SELECT id, nome, email, tipo, plano, nichos, criado_em FROM users WHERE id = ?').get(req.usuario.id);
  res.json({ usuario });
});

module.exports = router;
