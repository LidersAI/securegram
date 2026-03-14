import { PeerServer } from 'peer';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 9000;
const USE_SSL = process.env.USE_SSL === 'true';
const SSL_KEY = process.env.SSL_KEY || '/etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem';
const SSL_CERT = process.env.SSL_CERT || '/etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem';
const SECRET = process.env.PEER_SECRET || null; // опционально: ограничить доступ

// ── Создаём HTTP или HTTPS сервер ──────────────────────────────────
let server;

if (USE_SSL) {
  server = https.createServer({
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT),
  });
  console.log('[SecureGram] SSL включён');
} else {
  // Без SSL — Cloudflare/nginx будут терминировать TLS снаружи
  server = http.createServer();
  console.log('[SecureGram] HTTP режим (SSL на стороне прокси)');
}

// ── PeerJS сервер ──────────────────────────────────────────────────
const peerServer = PeerServer({
  server,
  path: '/signal',
  proxied: true,                     // за Cloudflare / nginx
  allow_discovery: false,            // не раскрывать список подключённых
  concurrent_limit: 5000,            // макс одновременных соединений
  cleanup_out_msgs: 1000,            // чистить очередь после N сообщений
  alive_timeout: 60000,              // 60 сек — считать мёртвым
  key: SECRET,                       // если задан — клиенты должны его передавать
});

// ── Логи ──────────────────────────────────────────────────────────
peerServer.on('connection', (client) => {
  console.log(`[+] подключён: ${client.getId()} | всего: ${getCount()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`[-] отключён:  ${client.getId()} | всего: ${getCount()}`);
});

peerServer.on('error', (err) => {
  console.error('[!] ошибка:', err.message);
});

function getCount() {
  try {
    // внутренний счётчик peer библиотеки
    return peerServer._clients?.size ?? '?';
  } catch {
    return '?';
  }
}

// ── Healthcheck endpoint ───────────────────────────────────────────
// Cloudflare и мониторинг будут стучать сюда
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, peers: getCount(), ts: Date.now() }));
  }
});

// ── Старт ─────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  SecureGram Signaling Server             ║
║  Порт: ${String(PORT).padEnd(34)}║
║  Путь: /signal${' '.repeat(26)}║
║  Healthcheck: /health${' '.repeat(19)}║
╚══════════════════════════════════════════╝
  `);
});

// ── Graceful shutdown ──────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[SecureGram] SIGTERM получен, закрываем...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[SecureGram] SIGINT получен, закрываем...');
  server.close(() => process.exit(0));
});
