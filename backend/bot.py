"""
Telegram бот — точка входа для Mini App + напоминания через APScheduler.
Запуск: python bot.py
"""
import os
import logging
from datetime import datetime, timedelta

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-frontend.railway.app")
API_URL = os.getenv("API_URL", "http://localhost:8000")


# ── Команды ───────────────────────────────────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start — открывает Mini App"""
    user = update.effective_user
    keyboard = [[
        InlineKeyboardButton(
            "☢️ Открыть чеклист выживания",
            web_app=WebAppInfo(url=f"{WEBAPP_URL}?tg_id={user.id}")
        )
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        f"Привет, {user.first_name}! 👋\n\n"
        "Это справочник по выживанию в условиях ЧС.\n"
        "Отмечай пункты по категориям и отслеживай свою готовность.\n\n"
        "🔻 Нажми кнопку ниже, чтобы открыть чеклист:",
        reply_markup=reply_markup
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📋 *Доступные команды:*\n\n"
        "/start — открыть приложение\n"
        "/status — мой прогресс\n"
        "/remind — настроить напоминания\n"
        "/help — эта справка",
        parse_mode="Markdown"
    )


async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показывает прогресс через API"""
    import httpx
    user = update.effective_user
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{API_URL}/api/checklist/progress?telegram_id={user.id}")
            data = resp.json()

        percent = data.get("percent", 0)
        checked = data.get("checked", 0)
        total = data.get("total", 0)

        # Прогресс-бар из эмодзи
        filled = int(percent / 10)
        bar = "🟩" * filled + "⬜" * (10 - filled)

        text = f"📊 *Твоя готовность: {percent}%*\n{bar}\n\n"
        text += f"Отмечено: {checked} из {total} пунктов\n\n"

        by_cat = data.get("by_category", {})
        for slug, cat_data in by_cat.items():
            cat_pct = cat_data.get("percent", 0)
            cat_checked = cat_data.get("checked", 0)
            cat_total = cat_data.get("total", 0)
            title = cat_data.get("title", slug)
            text += f"{title}: {cat_checked}/{cat_total} ({cat_pct}%)\n"

        await update.message.reply_text(text, parse_mode="Markdown")

    except Exception as e:
        logger.error(f"Status error: {e}")
        await update.message.reply_text("Не удалось получить статус. Попробуй позже.")


async def remind(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Настройка напоминаний"""
    keyboard = [
        [InlineKeyboardButton("Каждый день", callback_data="remind_1")],
        [InlineKeyboardButton("Раз в неделю", callback_data="remind_7")],
        [InlineKeyboardButton("Раз в месяц", callback_data="remind_30")],
        [InlineKeyboardButton("❌ Отключить", callback_data="remind_0")],
    ]
    await update.message.reply_text(
        "🔔 Как часто напоминать тебе проверить запасы?",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def remind_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка выбора интервала напоминаний"""
    import httpx
    query = update.callback_query
    await query.answer()

    user = update.effective_user
    data = query.data  # "remind_7" / "remind_0"
    days = int(data.split("_")[1])

    try:
        async with httpx.AsyncClient() as client:
            await client.put(
                f"{API_URL}/api/users/reminders/{user.id}",
                json={"enabled": days > 0, "interval_days": days if days > 0 else 7}
            )

        if days == 0:
            await query.edit_message_text("🔕 Напоминания отключены.")
        else:
            labels = {1: "каждый день", 7: "раз в неделю", 30: "раз в месяц"}
            await query.edit_message_text(
                f"✅ Буду напоминать {labels.get(days, f'каждые {days} дней')}!"
            )
    except Exception as e:
        logger.error(f"Remind callback error: {e}")
        await query.edit_message_text("Ошибка. Попробуй позже.")


# ── Планировщик напоминаний ───────────────────────────────────────────────────

async def send_reminders(app: Application):
    """Отправляет напоминания пользователям (запускается по расписанию)"""
    import httpx
    from app.database import SessionLocal
    from app.models import User

    db = SessionLocal()
    try:
        users = db.query(User).filter(User.reminders_enabled == True).all()
        now = datetime.utcnow()

        for user in users:
            # Проверяем, пора ли напоминать
            due = user.last_seen + timedelta(days=user.reminder_interval_days)
            if now >= due:
                try:
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(
                            f"{API_URL}/api/checklist/progress?telegram_id={user.telegram_id}"
                        )
                        data = resp.json()
                        percent = data.get("percent", 0)

                    await app.bot.send_message(
                        chat_id=user.telegram_id,
                        text=(
                            f"⏰ *Напоминание о запасах*\n\n"
                            f"Твоя готовность: *{percent}%*\n\n"
                            f"Пора проверить и пополнить запасы!"
                        ),
                        parse_mode="Markdown",
                        reply_markup=InlineKeyboardMarkup([[
                            InlineKeyboardButton(
                                "📋 Открыть чеклист",
                                web_app=WebAppInfo(url=f"{WEBAPP_URL}?tg_id={user.telegram_id}")
                            )
                        ]])
                    )
                    logger.info(f"Reminder sent to {user.telegram_id}")
                except Exception as e:
                    logger.error(f"Failed to send reminder to {user.telegram_id}: {e}")
    finally:
        db.close()


# ── Запуск ────────────────────────────────────────────────────────────────────

def main():
    if not BOT_TOKEN:
        raise ValueError("BOT_TOKEN не задан в .env")

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("status", status))
    app.add_handler(CommandHandler("remind", remind))
    app.add_handler(CallbackQueryHandler(remind_callback, pattern="^remind_"))

    # Планировщик — проверяем напоминания каждый час
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        send_reminders,
        "interval",
        hours=1,
        args=[app],
    )
    scheduler.start()

    logger.info("🤖 Бот запущен")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
