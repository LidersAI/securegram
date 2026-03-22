<div align="center">

# 𝕃 LIDERS CHAT

### Защищённый P2P мессенджер с E2E шифрованием

[![Live](https://img.shields.io/badge/LIVE-liderschat.ru-30d5f5?style=for-the-badge&logo=googlechrome&logoColor=white)](https://liderschat.ru)
[![PWA](https://img.shields.io/badge/PWA-37%2F45-22c55e?style=for-the-badge)](https://liderschat.ru)
[![E2E](https://img.shields.io/badge/E2E-AES--256--GCM-22c55e?style=for-the-badge)](#)
[![P2P](https://img.shields.io/badge/P2P-WebRTC-3b82f6?style=for-the-badge)](#)

**Сообщения шифруются на вашем устройстве. Никто — даже мы — не может их прочитать.**

[Открыть приложение](https://liderschat.ru) · [Сигнальный сервер](https://github.com/LidersAI/securegram-signal-) · [Сайт проекта](https://liderschat.online)

</div>

---

## ⚡ Как это работает

```
Устройство A                    Сервер (Render)                 Устройство B
     │                               │                               │
     │──── POST /register ──────────▶│                               │
     │◀─── {token, peerId} ─────────│                               │
     │                               │                               │
     │──── GET /poll (20s) ─────────▶│◀──── POST /signal ───────────│
     │◀─── {offer/answer} ──────────│                               │
     │                               │                               │
     │══════════════ WebRTC DataChannel (P2P, E2E) ════════════════▶│
     │                               │                               │
     │──── 🔒 AES-256-GCM ──────────────────────────────────────▶  │
```

Сервер нужен **только** для WebRTC handshake (~0.2 сек). Далее всё P2P.

---

## 🔐 Безопасность

| Компонент | Технология |
|---|---|
| Обмен ключами | ECDH P-384 |
| Шифрование | AES-256-GCM |
| IV | Случайный, уникальный для каждого сообщения |
| Защита от replay | Set из seen message IDs |
| Пароли | PBKDF2-SHA256, 100 000 итераций, уникальная соль |
| Резервный код | PBKDF2-SHA256, хранится только хэш |
| Relay ключи | Сохраняются в localStorage для офлайн-доставки |

---

## 📱 Возможности

### Чаты и группы
- 💬 Личные сообщения (DM) по никнейму
- 👥 Группы с invite-ссылками и пин-кодом
- 📢 Каналы — посты только от создателя
- 💬 Комментарии к постам канала
- 📊 Статистика канала (подписчики, онлайн)
- 📋 Опросы в группах и каналах
- 📌 Закреплённые чаты и сообщения
- ↕️ Перетаскивание чатов (drag & drop)
- ✏️ Черновики сообщений

### Сообщения
- 📷 Фото + подпись в одном сообщении
- 📎 Файлы до 10MB с подписью
- 🎤 Голосовые сообщения (WebM / MP4 для iOS)
- 🔗 Автоссылки, **жирный**, _курсив_, `код`
- 😊 Реакции, ответы, редактирование, удаление
- 📤 Пересылка, закрепление сообщений

### Аккаунт и безопасность
- 🔑 Никнейм + пароль (без телефона и email)
- 🔄 Вход с любого устройства
- 🔒 Резервный код восстановления
- 👤 Аватар, статус (🟢 / 🔴 / 🟡)
- 🕐 «Был(а) N минут назад»
- 🔐 Пин-код при открытии приложения
- 🚨 Режим паники — мгновенно скрыть всё
- 📱 Экспорт/импорт ключей между устройствами

### Звонки и медиа
- 📞 Аудио и видеозвонки P2P
- 🔔 App Badge (счётчик непрочитанных на иконке)

### Офлайн-доставка
- 📦 Relay через сервер — сообщения ждут до 7 дней
- 🔑 Ключи сохраняются в localStorage — работает после перезагрузки
- 🔄 Авто-resend при новом подключении

### Платформы
- 🌐 Браузер (Chrome, Safari, Firefox)
- 📱 PWA — установка на iOS и Android
- 🤖 APK через PWABuilder (37/45 score)

---

## 🏗 Архитектура

```
┌─────────────────────────────────────┐
│          index.html (242KB)          │
│  Всё приложение в одном файле        │
│  CSS + HTML + JS — без зависимостей  │
│                                      │
│  Crypto:    Web Crypto API           │
│  Transport: WebRTC DataChannel       │
│  Signaling: HTTP long-polling        │
│  Storage:   localStorage             │
│  Auth:      PBKDF2 + JWT-like tokens │
└─────────────────────────────────────┘
```

---

## 📁 Структура репозитория

```
/
├── index.html              ← Всё приложение
├── sw.js                   ← Service Worker v7
├── manifest.json           ← PWA (37/45 PWABuilder)
├── 404.html                ← Редирект для SPA
├── CNAME                   ← liderschat.ru
├── BRANDING.md             ← Гайд по бренду
├── og-image.png            ← OG превью для соцсетей
├── favicon.ico / favicon-*.png
└── icon-72..512*.png       ← PWA иконки (LC логотип)
```

---

## ⚙️ Конфигурация

```javascript
var SIGNAL = 'https://liders-chat-signal.onrender.com';
var RELAY  = 'https://liders-chat-signal.onrender.com';
var BASE   = 'https://liderschat.ru/';
var DB_KEY = 'sg_v1';
```

---

## 🚀 Деплой

**Клиент** → GitHub Pages (автодеплой при пуше в `main`)

**Сервер** → Render.com + UptimeRobot (пинг каждые 5 мин — не засыпает)

**База данных** → Supabase PostgreSQL (аккаунты, сессии)

---

## 🛠 Локальная разработка

```bash
# Никакой сборки не нужно
python3 -m http.server 8080
# Открыть http://localhost:8080
```

---

<div align="center">

**© 2026 LIDERS CHAT** · [liderschat.online](https://liderschat.online) · [liderschat.ru](https://liderschat.ru)

*Ваши сообщения — только ваши*

</div>
