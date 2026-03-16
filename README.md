# 💬 LIDERS CHAT

**LIDERS CHAT** — это современный, быстрый и полностью защищенный P2P-мессенджер. Основной упор сделан на приватность: сообщения передаются напрямую между устройствами, минуя центральные серверы.

## 🚀 Основные возможности

* **End-to-End Encryption:** Все данные шифруются прямо в браузере.
* **P2P Architecture:** Работает без хранения истории на сервере.
* **Групповые чаты:** Вход по прямой ссылке или QR-коду без необходимости обмена номерами телефонов.
* **Медиа-данные:** Поддержка передачи фото, файлов и голосовых сообщений.
* **Звонки:** Аудио и видеосвязь высокого качества через WebRTC.
* **PWA Ready:** Можно установить на смартфон или ПК как обычное приложение.

## 🛠 Технологический стек

* **Frontend:** HTML5, CSS3 (Modern Flexbox/Variables), Vanilla JavaScript.
* **QR-библиотека:** [jsQR](https://github.com/cozmo/jsQR) для быстрого сканирования инвайтов.
* **Дизайн:** Интерфейс в стиле "Premium Dark", адаптивная верстка под мобильные устройства (iOS/Android).
* **Offline:** Service Workers для работы в режиме веб-приложения.

## 📦 Установка и запуск

1. Склонируйте репозиторий:
   ```bash
   git clone [https://github.com/ваш-аккаунт/liders-chat.git](https://github.com/ваш-аккаунт/liders-chat.git)

2. Откройте index.html через локальный сервер (например, Live Server в VS Code).

3. Для работы PWA и Service Worker требуется HTTPS соединение.

🔒 Конфиденциальность
Проект создан для обеспечения максимальной анонимности. Мы не собираем email, номера телефонов или IP-адреса. Все ключи шифрования хранятся только в LocalStorage вашего браузера.

### Требования
- Node.js 18+ (`node -v`)
- Java JDK 11+ (`java -version`)
- Android SDK (или Android Studio)

### Установка

```bash
npm install -g @bubblewrap/cli
```

### Инициализация проекта

```bash
mkdir securegram-apk && cd securegram-apk
bubblewrap init --manifest https://lidersai.github.io/securegram/manifest.json
```

Bubblewrap спросит несколько вопросов:
- **Application ID**: `com.securegram.app`
- **Display mode**: `standalone`
- **Orientation**: `portrait`
- **Theme color**: `#17212b`
- **Background color**: `#0e1621`

### Сборка APK

```bash
bubblewrap build
```

Первый раз скачает Android SDK (~400MB), потом соберёт APK.

Готовый файл: `app-release-signed.apk`

### Установка на телефон

1. Отправь APK себе (через Telegram, почту, USB)
2. Открой файл на телефоне
3. Android спросит разрешение → **"Установить из неизвестных источников"** → Разрешить
4. Установить

---

## Способ 3: Capacitor (полноценное нативное приложение)

Если нужен доступ к нативным функциям (push-уведомления, фоновый режим):

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

npx cap init SecureGram com.securegram.app --web-dir .
npx cap add android

# Скопировать файлы
cp index.html sw.js manifest.json *.png android/app/src/main/assets/public/

npx cap sync android
npx cap open android  # открывает Android Studio
```

В Android Studio: **Build → Generate Signed Bundle/APK → APK**

---

## Распространение

Готовый APK можно:
- Отправить через Telegram
- Залить на Google Drive и дать ссылку
- Разместить на GitHub Releases
- Создать простую страницу скачивания

> **Не нужен Play Store** — APK устанавливается напрямую.

---

## Оффлайн-сообщения (как в мессенджерах)

В `server.js` уже добавлена базовая серверная очередь оффлайн-сообщений:

- `POST /offline-messages` — сохранить шифрованное сообщение для получателя;
- `GET /offline-messages/:peerId` — забрать сообщения при входе (и очистить очередь);
- `GET /presence/:peerId` — проверить, онлайн ли собеседник.

### Что важно

- Очередь теперь **переживает перезапуск сервера** (сохраняется в `offline-queue.json`).
- Старые сообщения автоматически удаляются по TTL (по умолчанию 7 дней).
- Для production лучше заменить JSON-файл на БД (PostgreSQL/Redis).

### Минимальная логика на клиенте

1. Перед отправкой проверяешь `GET /presence/:peerId`.
2. Если `online === true` — отправляешь через WebRTC как обычно.
3. Если `online === false` — отправляешь `POST /offline-messages` с уже зашифрованным payload.
4. При старте клиента делаешь `GET /offline-messages/:myPeerId` и отображаешь пришедшие сообщения.

Пример `POST /offline-messages`:

```json
{
  "to": "peer_bob",
  "from": "peer_alice",
  "payload": "<encrypted_message_blob>"
}
```

Переменная окружения для пути файла очереди (опционально):

```bash
OFFLINE_QUEUE_PATH=/var/lib/securegram/offline-queue.json
```


### Статус интеграции в клиент

Оффлайн-доставка теперь встроена в `index.html`:

- текст, фото, голосовые и файлы при недоставке в P2P ставятся в серверную очередь;
- при входе клиент забирает очередь через `/offline-messages/:myId`;
- для оффлайн-доставки у отправителя должен быть установлен ключ с получателем (достаточно один раз открыть личку/контакт в сети);
- сохранён fallback на старый `/relay` API для совместимости со старым сервером.
- если оффлайн-сообщение пришло до активной сессии, клиент автоматически поднимает соединение для обмена ключом и расшифровывает очередь;
- публичные ключи контактов и identity-ключ устройства сохраняются локально, поэтому оффлайн-сообщения можно расшифровать даже после перезапуска приложения;

- В личках можно задать **кастомные имена контактов** (переименование ID в удобное имя) из профиля контакта в чате.
