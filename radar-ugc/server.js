// server.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const path = require('path');

const { router: authRouter, exigirLogin } = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
const { rodarTodasAsFontes } = require('./scraper/scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Páginas públicas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'landing.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/cadastro', (req, res) => res.sendFile(path.join(__dirname, 'views', 'cadastro.html')));

// Painel protegido — exige login
app.get('/dashboard', exigirLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));

// API
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);

// Agenda o scraper para rodar sozinho a cada 3 horas (ajuste conforme necessário).
// Em planos de hospedagem com "sleep" (ex: free tier), isso só roda enquanto o
// servidor está ativo — para garantir execução constante, use um cron externo
// (ex: GitHub Actions, cron-job.org) chamando um endpoint dedicado.
cron.schedule('0 */3 * * *', () => {
  console.log('[cron] Disparando varredura agendada...');
  rodarTodasAsFontes();
});

app.listen(PORT, () => {
  console.log(`Radar UGC rodando em http://localhost:${PORT}`);
});
