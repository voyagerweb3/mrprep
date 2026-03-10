import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import { useTelegram } from './hooks/useTelegram'

export default function App() {
  const { init, applyTheme } = useTelegram()

  useEffect(() => {
    init()
    applyTheme()
  }, [])

  return <HomePage />
}
