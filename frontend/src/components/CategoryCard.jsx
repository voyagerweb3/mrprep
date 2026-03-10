import { useState } from 'react'
import ChecklistItem from './ChecklistItem'
import ProgressBar from './ProgressBar'

/**
 * Карточка категории (сворачивается/разворачивается)
 */
export default function CategoryCard({ category, onToggleItem }) {
  const [open, setOpen] = useState(false)

  const checked = category.items.filter(i => i.is_checked).length
  const total = category.items.length
  const percent = total > 0 ? Math.round(checked / total * 100) : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden">
      {/* Заголовок карточки */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <span className="text-2xl">{category.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">{category.title}</span>
            <span className="text-xs text-gray-500 ml-2">{checked}/{total}</span>
          </div>
          <ProgressBar percent={percent} size="sm" />
        </div>

        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Список пунктов */}
      {open && (
        <div className="px-3 pb-3">
          {category.description && (
            <p className="text-xs text-gray-500 mb-3 px-1">{category.description}</p>
          )}
          {category.items.map(item => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={onToggleItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
