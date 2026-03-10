/**
 * Хук для работы с Telegram WebApp SDK
 */
export function useTelegram() {
  const tg = window.Telegram?.WebApp

  // Инициализация SDK
  const init = () => {
    if (tg) {
      tg.ready()
      tg.expand() // Раскрыть на весь экран
    }
  }

  // Данные пользователя из Telegram
  const user = tg?.initDataUnsafe?.user || null

  // Получить telegram_id (из URL-параметра при разработке)
  const getTelegramId = () => {
    if (user?.id) return user.id
    // Fallback для локальной разработки
    const urlParams = new URLSearchParams(window.location.search)
    const tgId = urlParams.get('tg_id')
    return tgId ? parseInt(tgId) : 12345 // 12345 = тестовый ID
  }

  // Цвета темы Telegram
  const applyTheme = () => {
    if (!tg) return
    const style = document.documentElement.style
    style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff')
    style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000')
    style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999')
    style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc')
    style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc')
    style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff')
    style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f1f1f1')
  }

  // Вибрация (haptic feedback)
  const haptic = (type = 'light') => {
    tg?.HapticFeedback?.impactOccurred(type)
  }

  return { tg, user, getTelegramId, init, applyTheme, haptic }
}
