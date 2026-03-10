import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

/**
 * Получить все категории с пунктами и статусом пользователя
 */
export async function getCategories(telegramId) {
  const { data } = await api.get(`/checklist/categories?telegram_id=${telegramId}`)
  return data
}

/**
 * Переключить статус пункта (отмечен / не отмечен)
 */
export async function toggleItem(itemId, telegramId) {
  const { data } = await api.post(`/checklist/toggle/${itemId}?telegram_id=${telegramId}`)
  return data
}

/**
 * Получить общий прогресс
 */
export async function getProgress(telegramId) {
  const { data } = await api.get(`/checklist/progress?telegram_id=${telegramId}`)
  return data
}

/**
 * Зарегистрировать / обновить пользователя
 */
export async function registerUser(telegramId, username, firstName) {
  const params = new URLSearchParams({ telegram_id: telegramId })
  if (username) params.append('username', username)
  if (firstName) params.append('first_name', firstName)
  const { data } = await api.post(`/users/register?${params.toString()}`)
  return data
}

/**
 * Обновить настройки напоминаний
 */
export async function updateReminders(telegramId, enabled, intervalDays = 7) {
  const { data } = await api.put(`/users/reminders/${telegramId}`, {
    enabled,
    interval_days: intervalDays,
  })
  return data
}
