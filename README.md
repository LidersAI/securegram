<div align="center">

# 𝕃 LIDERS CHAT

### Защищённый P2P мессенджер с E2E шифрованием

[![Live](https://img.shields.io/badge/LIVE-liderschat.ru-30d5f5?style=for-the-badge&logo=googlechrome&logoColor=white)](https://liderschat.ru)
[![PWA](https://img.shields.io/badge/PWA-Ready-0d1a2e?style=for-the-badge&logo=pwa&logoColor=white)](https://liderschat.ru)
[![E2E](https://img.shields.io/badge/E2E-AES--256--GCM-22c55e?style=for-the-badge&logo=shield&logoColor=white)](#)
[![No Server](https://img.shields.io/badge/P2P-WebRTC-3b82f6?style=for-the-badge)](#)

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
     │──── GET /poll (20s hold) ────▶│◀──── POST /signal ───────────│
     │◀─── {offer} ─────────────────│                               │
     │                               │                               │
     │══════════════ WebRTC DataChannel (P2P, E2E) ════════════════▶│
     │                               │                               │
     │─── 🔒 зашифрованные сообщения ────────────────────────────▶  │
```

Сервер нужен **только** для сигнализации (WebRTC handshake). Сообщения идут напрямую.

---

## 🔐 Безопасность

| Компонент | Технология |
|---|---|
| Обмен ключами | ECDH P-384 |
| Шифрование сообщений | AES-256-GCM |
| IV | Случайный, уникальный для каждого сообщения |
| Защита от replay | Seen message IDs (Set) |
| Пароли аккаунтов | PBKDF2-SHA256, 100 000 итераций |
| Резервный код | PBKDF2-SHA256, хранится только хэш |

---

## 📱 Возможности

### Чаты
- 💬 Личные сообщения (DM) по никнейму или ID
- 👥 Группы с приглашением по ссылке
- 📢 Каналы — публикации только от создателя
- 📌 Закрепление чатов и сообщений
- 🔍 Поиск по чатам и сообщениям
- ✏️ Черновики сообщений
- 🔄 Drag & drop — перетаскивание чатов

### Сообщения
- 📷 Фото + подпись в одном сообщении
- 📎 Файлы до 10MB с подписью
- 🎤 Голосовые сообщения
- 🔗 Автоматические ссылки, **жирный**, _курсив_, `код`
- 😊 Реакции, ответы, редактирование, удаление
- 📤 Пересылка сообщений
- 💬 Комментарии к постам в канале

### Аккаунт
- 🔑 Никнейм + пароль (без номера телефона)
- 🔄 Вход с любого устройства под своим ID
- 🔒 Резервный код восстановления доступа
- 👤 Аватар, статус (онлайн / не беспокоить / нет на месте)
- 🕐 «Был(а) N минут назад» в шапке чата

### Безопасность
- 🚨 Режим паники — мгновенно скрыть весь контент
- 🔐 Экспорт/импорт аккаунта на другое устройство

### Платформы
- 🌐 Браузер (Chrome, Safari, Firefox)
- 📱 PWA — установка на главный экран iOS и Android
- 📞 Аудио и видеозвонки P2P

---

## 🏗 Архитектура

```
┌─────────────────────────────────────────┐
│             index.html (210KB)           │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  CSS     │  │   HTML   │  │   JS   │ │
│  │ (theme)  │  │ (layout) │  │ (logic)│ │
│  └──────────┘  └──────────┘  └────────┘ │
│                                          │
│  Crypto: Web Crypto API (встроен)        │
│  Transport: WebRTC DataChannel           │
│  Signaling: HTTP long-polling            │
│  Storage: localStorage                   │
└─────────────────────────────────────────┘
```

**Одним файлом.** Никаких зависимостей, никакой сборки.

---

## 📁 Файлы репозитория

```
/
├── index.html              ← Всё приложение (HTML + CSS + JS)
├── sw.js                   ← Service Worker (PWA, кэш иконок)
├── manifest.json           ← PWA манифест
├── 404.html                ← Редирект для старых ссылок
├── CNAME                   ← liderschat.ru
├── BRANDING.md             ← Гайд по брендингу
├── favicon.ico
├── favicon-16.png
├── favicon-32.png
├── icon-72.png .. icon-512.png          ← PWA иконки
├── icon-192-maskable.png                ← Android adaptive
└── icon-512-maskable.png
```

---

## ⚙️ Конфигурация

В начале `index.html`:

```javascript
var SIGNAL = 'https://liders-chat-signal.onrender.com'; // сигнальный сервер
var RELAY  = 'https://liders-chat-signal.onrender.com'; // офлайн-доставка
var BASE   = 'https://liderschat.ru/';                  // базовый URL
var DB_KEY = 'sg_v1';                                   // ключ localStorage
```

---

## 🚀 Деплой

Сайт деплоится автоматически через **GitHub Pages** при каждом пуше в `main`.

Custom domain: `liderschat.ru` → настроен через CNAME + DNS A-записи на GitHub Pages IPs.

---

## 🛠 Разработка

```bash
# Просто откройте файл в браузере
open index.html

# Или любой локальный сервер
python3 -m http.server 8080
```

Никакого npm, никакой сборки.

---

<div align="center">

**© 2026 LIDERS CHAT** · [liderschat.online](https://liderschat.online) · [liderschat.ru](https://liderschat.ru)

*Ваши сообщения — только ваши*

</div>
