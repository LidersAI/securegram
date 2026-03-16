import { PeerServer } from 'peer';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 9000;
const USE_SSL = process.env.USE_SSL === 'true';
const SSL_KEY = process.env.SSL_KEY || '/etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem';
const SSL_CERT = process.env.SSL_CERT || '/etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem';
const SECRET = process.env.PEER_SECRET || 'peerjs';

// ── Offline Message Queue ──────────────────────────────────────────
// Map<recipientPeerId, Array<{from, payload, ts}>>
const offlineQueue = new Map();
const MAX_QUEUE_PER_PEER = 500;  // макс сообщений на одного получателя
const MSG_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней — после этого удаляем

function queueMessage(recipientId, from, payload) {
  if (!offlineQueue.has(recipientId)) {
    offlineQueue.set(recipientId, []);
  }
  const queue = offlineQueue.get(recipientId);
  // Чистим устаревшие
  const now = Date.now();
  const fresh = queue.filter(m => now - m.ts < MSG_TTL_MS);
  // Лимит очереди
  if (fresh.length >= MAX_QUEUE_PER_PEER) fresh.shift();
  fresh.push({ from, payload, ts: now });
  offlineQueue.set(recipientId, fresh);
  console.log(`[Queue] Сохранено для ${recipientId}: ${fresh.length} сообщений`);
}

function flushQueue(recipientId) {
  const msgs = offlineQueue.get(recipientId) || [];
  offlineQueue.delete(recipientId);
  return msgs;
}

// ── HTTP / HTTPS сервер ────────────────────────────────────────────
let server;

if (USE_SSL) {
  server = https.createServer({
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT),
  });
  console.log('[SecureGram] SSL включён');
} else {
  server = http.createServer();
  console.log('[SecureGram] HTTP режим (SSL на стороне прокси)');
}

// ── PeerJS сервер ──────────────────────────────────────────────────
const peerServer = PeerServer({
  server,
  path: '/signal',
  proxied: true,
  allow_discovery: false,
  concurrent_limit: 5000,
  cleanup_out_msgs: 1000,
  alive_timeout: 60000,
  key: SECRET,
});

// ── Логи + доставка офлайн-сообщений при подключении ──────────────
peerServer.on('connection', (client) => {
  const id = client.getId();
  console.log(`[+] подключён: ${id} | всего: ${getCount()}`);

  // Если есть очередь — сигналим клиенту через специальный HTTP endpoint,
  // клиент сам запросит их через /offline-messages/:id
  const pending = offlineQueue.get(id);
  if (pending && pending.length > 0) {
    console.log(`[Queue] ${id} подключился, в очереди ${pending.length} сообщ.`);
  }
});

peerServer.on('disconnect', (client) => {
  console.log(`[-] отключён:  ${client.getId()} | всего: ${getCount()}`);
});

peerServer.on('error', (err) => {
  console.error('[!] ошибка:', err.message);
});

function getCount() {
  try {
    return peerServer._clients?.size ?? '?';
  } catch {
    return '?';
  }
}

// ── REST endpoints ─────────────────────────────────────────────────
server.on('request', (req, res) => {
  const url = new URL(req.url, `http://localhost`);

  // Healthcheck
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, peers: getCount(), ts: Date.now() }));
  }

  // POST /offline-messages — клиент-отправитель сохраняет сообщение если получатель офлайн
  // Body: { to: "peerId", from: "peerId", payload: "encrypted_string" }
  if (url.pathname === '/offline-messages' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { to, from, payload } = JSON.parse(body);
        if (!to || !from || !payload) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Missing fields' }));
        }
        queueMessage(to, from, payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, queued: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /offline-messages/:peerId — клиент-получатель забирает свои сообщения при старте
  const match = url.pathname.match(/^\/offline-messages\/([^/]+)$/);
  if (match && req.method === 'GET') {
    const peerId = decodeURIComponent(match[1]);
    const msgs = flushQueue(peerId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, messages: msgs }));
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
║  Offline Queue: активен${' '.repeat(17)}║
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
