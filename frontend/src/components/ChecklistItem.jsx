import { useState } from 'react'

// Звук при чеке — Web Audio API
function playCheckSound(checking) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    if (checking) {
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.07)
    } else {
      osc.frequency.setValueAtTime(500, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.07)
    }
    gain.gain.setValueAtTime(0.07, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12)
  } catch (e) {}
}

// Вибрация через Telegram HapticFeedback
function triggerHaptic(checking) {
  try {
    const tg = window.Telegram?.WebApp
    if (tg?.HapticFeedback) {
      checking
        ? tg.HapticFeedback.impactOccurred('light')
        : tg.HapticFeedback.impactOccurred('soft')
    }
  } catch (e) {}
}


const PRIORITY_COLORS = {
  1: 'border-l-red-500',
  2: 'border-l-yellow-400',
  3: 'border-l-gray-300',
}

/**
 * Один пункт чеклиста с описанием и тоглом
 */
export default function ChecklistItem({ item, onToggle }) {
  const [expanded, setExpanded] = useState(false)

  const handleToggle = () => {
    playCheckSound(!item.is_checked)
    triggerHaptic(!item.is_checked)
    onToggle(item.id)
  }

  return (
    <div
      className={`checklist-item border-l-4 ${PRIORITY_COLORS[item.priority] || 'border-l-gray-300'}
        bg-white rounded-r-xl mb-2 shadow-sm overflow-hidden`}
    >
      {/* Основная строка */}
      <div className="flex items-start gap-3 p-3">
        {/* Чекбокс */}
        <button
          onClick={handleToggle}
          className={`flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all
            ${item.is_checked
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-400'
            }`}
        >
          {item.is_checked && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Текст */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.title}
          </p>
          {item.quantity && (
            <p className="text-xs text-blue-500 mt-0.5">{item.quantity}</p>
          )}
        </div>

        {/* Кнопка "подробнее" */}
        {item.description && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Описание (раскрывается) */}
      {expanded && item.description && (
        <div className="px-3 pb-3 pt-0">
          <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-2">
            💡 {item.description}
          </p>
        </div>
      )}
    </div>
  )
}
