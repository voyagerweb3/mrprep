import { useState, useEffect } from 'react'
import CategoryCard from '../components/CategoryCard'
import { getCategories, toggleItem, registerUser } from '../api/checklist'
import { useTelegram } from '../hooks/useTelegram'

export default function HomePage() {
  const { user, getTelegramId } = useTelegram()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const telegramId = getTelegramId() || 99999

  const handleToggle = async (itemId) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      items: cat.items.map(item =>
        item.id === itemId ? { ...item, is_checked: !item.is_checked } : item
      )
    })))
    try {
      await toggleItem(itemId, telegramId)
    } catch (e) {
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map(item =>
          item.id === itemId ? { ...item, is_checked: !item.is_checked } : item
        )
      })))
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        await registerUser(telegramId, user?.username, user?.first_name)
        const data = await getCategories(telegramId)
        setCategories(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [telegramId])

  const allItems = categories.flatMap(c => c.items || [])
  const totalItems = allItems.length
  const checkedItems = allItems.filter(i => i.is_checked).length
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'var(--tg-theme-hint-color, #aaa)', fontSize:'16px' }}>
        Загрузка...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', height:'100vh', gap:'12px', padding:'20px', textAlign:'center' }}>
        <div style={{ fontSize:'40px' }}>😔</div>
        <div style={{ color:'var(--tg-theme-text-color, #333)', fontSize:'16px' }}>Не удалось загрузить данные. Проверь подключение.</div>
        <div style={{ color:'var(--tg-theme-hint-color, #aaa)', fontSize:'12px' }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={{ padding:'16px', paddingBottom:'40px' }}>
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:'bold', color:'var(--tg-theme-text-color, #333)', margin:'0 0 4px' }}>
          ☢️ Чеклист выживания
        </h1>
        <p style={{ fontSize:'13px', color:'var(--tg-theme-hint-color, #888)', margin:'0 0 12px' }}>
          Подготовься заранее — будь готов к любому
        </p>
        <div style={{ background:'var(--tg-theme-secondary-bg-color, #f5f5f5)', borderRadius:'8px', padding:'12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
            <span style={{ fontSize:'13px', color:'var(--tg-theme-text-color, #333)' }}>
              Отмечено {checkedItems} из {totalItems} пунктов
            </span>
            <span style={{ fontSize:'13px', fontWeight:'bold', color: progress === 100 ? '#22c55e' : 'var(--tg-theme-text-color, #333)' }}>
              {progress}%
            </span>
          </div>
          <div style={{ background:'var(--tg-theme-hint-color, #ddd)', borderRadius:'4px', height:'6px', overflow:'hidden' }}>
            <div style={{ background: progress === 100 ? '#22c55e' : '#3b82f6', height:'100%', width: progress + '%', borderRadius:'4px', transition:'width 0.3s' }} />
          </div>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        {categories.map(cat => (
          <CategoryCard key={cat.id} category={cat} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  )
}
