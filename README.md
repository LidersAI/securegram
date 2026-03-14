# SecureGram — Сборка APK

## Что нужно загрузить на GitHub

Все файлы из этого архива положить в репозиторий `securegram` рядом с `index.html`:

```
securegram/
├── index.html          ← обновлённый (в отдельном архиве)
├── manifest.json       ← НОВЫЙ
├── sw.js               ← НОВЫЙ (service worker)
├── favicon.ico         ← НОВЫЙ
├── favicon-16.png      ← НОВЫЙ
├── favicon-32.png      ← НОВЫЙ
├── icon-72.png         ← НОВЫЙ
├── icon-96.png         ← НОВЫЙ
├── icon-128.png        ← НОВЫЙ
├── icon-144.png        ← НОВЫЙ
├── icon-152.png        ← НОВЫЙ
├── icon-192.png        ← НОВЫЙ (заменяет старый)
├── icon-192-maskable.png ← НОВЫЙ
├── icon-256.png        ← НОВЫЙ
├── icon-512.png        ← НОВЫЙ (заменяет старый)
└── icon-512-maskable.png ← НОВЫЙ
```

---

## Способ 1: PWA — установить прямо из браузера (БЕЗ APK)

После загрузки файлов на GitHub Pages:

1. Открой `https://lidersai.github.io/securegram/` на Android в Chrome
2. Нажми **⋮** (три точки) → **"Добавить на главный экран"**
3. Или в настройках приложения появится кнопка **"Установить как приложение"**
4. Готово — иконка на главном экране, работает как нативное приложение

> Это самый простой способ. Рекомендую начать с него.

---

## Способ 2: APK через Bubblewrap (Google)

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
