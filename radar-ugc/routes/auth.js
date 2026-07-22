// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'troque-essa-chave-em-producao';
const COOKIE_NAME = 'radar_ugc_token';

// Middleware: exige login. Usado em rotas de painel/API protegidas.
function exigirLogin(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.redirect('/login');
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.clearCookie(COOKIE_NAME);
    return res.redirect('/login');
  }
}

// Igual à anterior, mas responde com JSON 401 em vez de redirecionar (para chamadas de API/fetch)
function exigirLoginAPI(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ erro: 'Não autenticado.' });
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
}

router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, tipo, nichos } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Preencha nome, e-mail e senha.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
  }

  const existente = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existente) {
    return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const nichosJson = JSON.stringify(Array.isArray(nichos) ? nichos : []);

  const resultado = db.prepare(`
    INSERT INTO users (nome, email, senha_hash, tipo, nichos)
    VALUES (?, ?, ?, ?, ?)
  `).run(nome.trim(), email.toLowerCase().trim(), senhaHash, tipo === 'empresa' ? 'empresa' : 'criador', nichosJson);

  const token = jwt.sign({ id: resultado.lastInsertRowid, nome, email, tipo }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE_NAME, token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ ok: true, redirect: '/dashboard' });
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Preencha e-mail e senha.' });

  const usuario = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!usuario) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

  const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaOk) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.cookie(COOKIE_NAME, token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ ok: true, redirect: '/dashboard' });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true, redirect: '/' });
});

module.exports = { router, exigirLogin, exigirLoginAPI };
