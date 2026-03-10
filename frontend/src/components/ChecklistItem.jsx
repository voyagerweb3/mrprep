import { useState, useEffect } from 'react'

function playCheckSound(checking) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
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
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
  } catch (e) {}
}

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

export default function ChecklistItem({ item, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  // Local checked state — updates instantly on click, syncs with server state via useEffect
  const [localChecked, setLocalChecked] = useState(item.is_checked === true)

  useEffect(() => {
    setLocalChecked(item.is_checked === true)
  }, [item.is_checked])

  const handleToggle = () => {
    const next = !localChecked
    setLocalChecked(next)
    playCheckSound(next)
    triggerHaptic(next)
    onToggle(item.id)
  }

  const priorityColor = item.priority === 1 ? '#ef4444' : item.priority === 2 ? '#f59e0b' : '#6b7280'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 0', borderBottom: '1px solid var(--tg-theme-secondary-bg-color, #f0f0f0)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: priorityColor, flexShrink: 0 }} />
        <button
          onClick={handleToggle}
          style={{
            width: '24px', height: '24px', borderRadius: '6px', border: '2px solid',
            borderColor: localChecked ? '#22c55e' : 'var(--tg-theme-hint-color, #aaa)',
            background: localChecked ? '#22c55e' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s'
          }}
        >
          {localChecked && <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
        </button>
        <span style={{
          flex: 1, fontSize: '14px',
          color: 'var(--tg-theme-text-color, #333)',
          textDecoration: localChecked ? 'line-through' : 'none',
          opacity: localChecked ? 0.5 : 1
        }}>
          {item.title}
        </span>
        {item.description && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: '12px', color: 'var(--tg-theme-hint-color, #aaa)' }}
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>
      {expanded && item.description && (
        <div style={{ marginTop: '6px', marginLeft: '44px', fontSize: '12px', color: 'var(--tg-theme-hint-color, #888)', lineHeight: '1.4' }}>
          {item.description}
        </div>
      )}
      {item.quantity && (
        <div style={{ marginTop: '4px', marginLeft: '44px', fontSize: '11px', color: 'var(--tg-theme-hint-color, #aaa)' }}>
          📦 {item.quantity}
        </div>
      )}
    </div>
  )
}
