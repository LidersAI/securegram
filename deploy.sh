#!/bin/bash
# SecureGram Signaling Server — деплой на Ubuntu 22.04 / 24.04
# Запускать от root: bash deploy.sh signal.yourdomain.com

set -e  # остановиться при ошибке
DOMAIN=${1:-"signal.example.com"}
APP_DIR="/opt/securegram-signal"
SERVICE="securegram-signal"

echo ""
echo "══════════════════════════════════════════"
echo "  SecureGram Signal Server — деплой"
echo "  Домен: $DOMAIN"
echo "══════════════════════════════════════════"
echo ""

# ── 1. Node.js 20 ─────────────────────────────────────────────────
echo "[1/7] Устанавливаем Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "      Node.js $(node -v) ✓"

# ── 2. nginx ──────────────────────────────────────────────────────
echo "[2/7] Устанавливаем nginx..."
apt-get install -y nginx
echo "      nginx ✓"

# ── 3. certbot ────────────────────────────────────────────────────
echo "[3/7] Устанавливаем certbot..."
apt-get install -y certbot python3-certbot-nginx
echo "      certbot ✓"

# ── 4. Копируем файлы ─────────────────────────────────────────────
echo "[4/7] Копируем файлы сервера..."
mkdir -p $APP_DIR
cp server.js package.json $APP_DIR/
cd $APP_DIR
npm install --production
echo "      Файлы скопированы ✓"

# ── 5. systemd сервис ─────────────────────────────────────────────
echo "[5/7] Настраиваем systemd..."
cp /path/to/securegram-signal.service /etc/systemd/system/
sed -i "s|/opt/securegram-signal|$APP_DIR|g" /etc/systemd/system/$SERVICE.service
systemctl daemon-reload
systemctl enable $SERVICE
systemctl start $SERVICE
echo "      systemd ✓"

# ── 6. nginx конфиг ───────────────────────────────────────────────
echo "[6/7] Настраиваем nginx..."
# Сначала без SSL — для получения сертификата
cat > /etc/nginx/sites-available/$SERVICE << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /signal {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;
    }

    location /health {
        proxy_pass http://127.0.0.1:9000;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$SERVICE /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "      nginx ✓"

# ── 7. SSL сертификат ─────────────────────────────────────────────
echo "[7/7] Получаем SSL сертификат..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN
echo "      SSL ✓"

# ── Готово ────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  Готово! Сервер запущен."
echo ""
echo "  WebSocket: wss://$DOMAIN/signal"
echo "  Healthcheck: https://$DOMAIN/health"
echo ""
echo "  Проверка: systemctl status $SERVICE"
echo "  Логи:     journalctl -u $SERVICE -f"
echo "══════════════════════════════════════════"
echo ""
