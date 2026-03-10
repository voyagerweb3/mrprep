import { useState, useEffect } from 'react'
import CategoryCard from '../components/CategoryCard'
import ProgressBar from '../components/ProgressBar'
import { getCategories, toggleItem, registerUser } from '../api/checklist'
import { useTelegram } from '../hooks/useTelegram'

export default function HomePage() {
  const { getTelegramId, user, haptic } = useTelegram()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const OPTIONAL_SLUGS = ['pets']
  const [showPets, setShowPets] = useState(() => {
    try { return localStorage.getItem('mrprep_show_pets') === 'true' } catch { return false }
  })
  const togglePets = () => {
    const next = !showPets
    setShowPets(next)
    try { localStorage.setItem('mrprep_show_pets', String(next)) } catch {}
  }
  const visibleCategories = categories.filter(c => !OPTIONAL_SLUGS.includes(c.slug))
  const petsCategory = categories.find(c => c.slug === 'pets')

  const telegramId = getTelegramId()

  const allItems = categories.flatMap(c => c.items)
  const totalChecked = allItems.filter(i => i.is_checked).length
  const totalItems = allItems.length
  const totalPercent = totalItems > 0 ? Math.round(totalChecked / totalItems * 100) : 0

  useEffect(() => {
    async function load() {
      try {
        await registerUser(telegramId, user?.username, user?.first_name)
        const data = await getCategories(telegramId)
        setCategories(data)
      } catch (e) {
        setError('Не удалось загрузить данные. Проверь подключение.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [telegramId])

  const handleToggle = async (itemId) => {
    haptic('light')
    setCategories(prev => prev.map(cat => ({...cat,items:cat.items.map(item => item.id===itemId?{...item,is_checked:!item.is_checked}:item)})))
    try { await toggleItem(itemId,telegramId) } catch(e) {
      setCategories(prev => prev.map(cat => ({...cat,items:cat.items.map(item => item.id===itemId?{...item,is_checked: !item.is_checked}:item)})))
    }
  }

  const readinessLevel = () => {
    if (totalPercent >= 80) return { label: 'Высокая готовность', color: 'text-green-600', emoji: '🟢' }
    if (totalPercent >= 50) return { label: 'ҡредняя Ҩотовность', color: 'text-yellow-600', emoji: '🟡' }
    if (totalPercent >= 20) return { label: 'Низкая Ҩотовность', color: 'text-orange-500', emoji: '🟠' }
    return { label: 'Не готов', color: 'text-red-600', emoji: '🔴' }
  }

  if (loading) return (<div className="flex items-center justify-center min-h-screen"><div className="text-center"><div className="text-4xl mb-3 animate-pulse">☢️</div><p className="text-gray-500 text-sm">Загружаем чеклист...</p></div></div>)
  if (error) return (<div className="flex items-center justify-center min-h-screen p-4"><div className="text-center"><div className="text-4xl mb-3">😞</div><p className="text-gray-600 text-sm">{error}</p><button onClick={()=>window.location.reload()} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm">Повторить</button></div></div>)
  const level = readinessLevel()
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-white px-4 pt-4 pb-5 shadow-sm mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">☢️ Чеклист выживания</h1>
        <p className="text-xs text-gray-500 mb-4">Подготовься заранее — сам действуй уверенно</p>
        <div className="bg-gray-50 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">{level.emoji} {level.label}</span>
            <span className="text-lg font-bold text-gray-900">{totalPercent}%</span>
    
          {petsCategory && (
            <div style={{marginTop: '12px'}}>
              <button
                onClick={togglePets}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '12px 16px', borderRadius: '12px',
                  border: '1.5px dashed var(--tg-theme-hint-color, #aaa)',
                  background: showPets ? 'var(--tg-theme-secondary-bg-color, #f0f0f0)' : 'transparent',
                  color: 'var(--tg-theme-text-color, #333)',
                  cursor: 'pointer', fontSize: '15px', fontWeight: '500'
                }}
              >
                <span style={{fontSize:'20px'}}>🐾</span>
                <span style={{flex:1, textAlign:'left'}}>Питомцы</span>
                <span style={{fontSize:'12px', opacity:0.6}}>{showPets ? '✓ включено' : '+ добавить'}</span>
              </button>
              {showPets && (
                <CategoryCard key={petsCategory.id} category={petsCategory} onToggleItem={handleToggle} />
              )}
            </div>
          )}
      </div>
          <ProgressBar percent={totalPercent} />
          <p className="text-xs text-gray-400 mt-2 text-right">Отмечено {totalChecked} из {totalItems} пунктов</p>
        </div>
      </div>
      <div className="px-4 mb-3 flex gap-4 text-xs text-gray-500">
        <span><span className="inline-block w-2 h-3 bg-red-500 rounded mr-1 align-middle" />Высокий приоритет</span>
        <span><span className="inline-block w-2 h-3 bg-yellow-400 rounded mr-1 align-middle" />Средний</span>
      </div>
      <div className="px-4">
        {visibleCategories.map(cat => (
          <CategoryCard key={cat.id} category={cat} onToggleItem={handleToggle} />
        ))}
      </div>
    </div>
  )
}
