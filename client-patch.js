// ═══════════════════════════════════════════════════════════════════
//  Замени блок инициализации myPeer в securechat-tg.html
//  на этот код. Остальное трогать не нужно.
// ═══════════════════════════════════════════════════════════════════

// Список серверов — первый рабочий будет использован
const SIGNAL_SERVERS = [
  { host: 'signal.yourdomain.com', port: 443, path: '/signal', secure: true },  // твой сервер (приоритет)
  { host: 'signal2.yourdomain.com', port: 443, path: '/signal', secure: true }, // резервный (если есть)
  { host: '0.peerjs.com', port: 443, path: '/', secure: true },                 // публичный (последний fallback)
];

async function createPeerWithFallback(keyPair) {
  for (const srv of SIGNAL_SERVERS) {
    try {
      const peer = await tryConnect(srv);
      console.log(`[signal] подключён к ${srv.host}`);
      return peer;
    } catch (e) {
      console.warn(`[signal] ${srv.host} недоступен, пробуем следующий...`);
    }
  }
  throw new Error('Все сигнальные серверы недоступны');
}

function tryConnect(srv) {
  return new Promise((resolve, reject) => {
    const peer = new Peer({
      host: srv.host,
      port: srv.port,
      path: srv.path,
      secure: srv.secure,
      // key: 'your-secret',  // раскомментировать если задал PEER_SECRET на сервере
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // Свой TURN сервер (опционально — для жёстких NAT)
          // { urls: 'turn:turn.yourdomain.com:3478', username: 'user', credential: 'pass' }
        ]
      }
    });

    const timeout = setTimeout(() => {
      peer.destroy();
      reject(new Error('timeout'));
    }, 5000);

    peer.on('open', (id) => {
      clearTimeout(timeout);
      resolve(peer);
    });

    peer.on('error', (e) => {
      clearTimeout(timeout);
      peer.destroy();
      reject(e);
    });
  });
}

// ── Заменяй вызов init() на это: ────────────────────────────────────
async function init() {
  myKeyPair = await Crypto.genKeyPair();

  try {
    myPeer = await createPeerWithFallback(myKeyPair);
  } catch (e) {
    toast('❌ Нет подключения к сигнальному серверу');
    return;
  }

  myPeer.on('open', id => {
    myId = id;
    document.getElementById('my-id-val').textContent = id;
    document.getElementById('s-dot').classList.add('on');
    document.getElementById('s-txt').textContent = 'Онлайн · ' + id.slice(0,10) + '...';
    toast('Готов к работе');
  });

  myPeer.on('connection', conn => initConn(conn));
  myPeer.on('error', e => {
    toast('Ошибка соединения: ' + e.type);
    // Автоматический реконнект через 5 секунд
    setTimeout(() => init(), 5000);
  });
}
