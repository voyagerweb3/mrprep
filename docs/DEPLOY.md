# Деплой на Railway

## Шаг 1: Создай бота в Telegram

1. Открой @BotFather в Telegram
2. Отправь `/newbot` → дай имя и username (например `survival_checklist_bot`)
3. Скопируй **BOT_TOKEN**
4. Отправь `/newapp` или `/mybots` → Выбери бота → "Bot Settings" → "Menu Button" → задай URL фронтенда (после деплоя)

## Шаг 2: Задеплой бэкенд + бот на Railway

1. Зайди на [railway.app](https://railway.app), войди через GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Выбери репозиторий → настрой **Root Directory**: `backend`
4. В разделе **Variables** добавь:
   ```
   BOT_TOKEN=твой_токен
   WEBAPP_URL=https://твой-фронтенд.vercel.app  (заполнишь после шага 3)
   PORT=8000
   ```
5. Railway создаст URL вида `https://xxxx.railway.app` — это твой `API_URL`

## Шаг 3: Задеплой фронтенд на Vercel

1. Зайди на [vercel.com](https://vercel.com), войди через GitHub
2. **New Project** → выбери репо → **Root Directory**: `frontend`
3. В **Environment Variables** добавь:
   ```
   VITE_API_URL=https://xxxx.railway.app/api
   ```
4. После деплоя получишь URL вида `https://xxxx.vercel.app`

## Шаг 4: Обнови переменные и засей БД

1. В Railway обнови `WEBAPP_URL` на URL от Vercel
2. В Railway → Service → Shell:
   ```bash
   python seed_data.py
   ```

## Шаг 5: Привяжи Mini App к боту

В @BotFather:
```
/setmenubutton → выбери бота → Web App → введи URL фронтенда
```

Или через @BotFather:
```
/mybots → твой бот → Bot Settings → Menu Button → Configure menu button
URL: https://твой-фронтенд.vercel.app
Text: 📋 Открыть чеклист
```

---

## Локальный запуск с ngrok (для тестирования Mini App в Telegram)

```bash
# Установм ngrok: https://ngrok.com
ngrok http 5173
# Скопируй https://xxxx.ngrok.io
# Вставь как WEBAPP_URL в боте
```
