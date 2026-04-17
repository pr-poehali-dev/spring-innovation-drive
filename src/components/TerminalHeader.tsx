import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"

interface TerminalHeaderProps {
  isVisible?: boolean
}

/**
 * Компонент TerminalHeader
 *
 * Отображает шапку терминала в стиле киберпанк:
 * - Часы в реальном времени (UTC)
 * - Переключатель темы (темная/светлая)
 * - Терминальный промпт
 */
export function TerminalHeader({ isVisible = true }: TerminalHeaderProps) {
  const [currentTime, setCurrentTime] = useState("")
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getUTCHours().toString().padStart(2, "0")
      const minutes = now.getUTCMinutes().toString().padStart(2, "0")
      const seconds = now.getUTCSeconds().toString().padStart(2, "0")
      setCurrentTime(`${hours}:${minutes}:${seconds}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    if (isDark) {
      document.documentElement.classList.remove("dark")
    } else {
      document.documentElement.classList.add("dark")
    }
  }

  return (
    <header
      className={`border-b border-border bg-black/70 backdrop-blur-sm transition-all duration-2000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between font-mono text-sm">
          <div className="flex items-center gap-4">
            <span className="text-green-400 font-bold">root@impulse:~$</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-white font-mono tabular-nums">UTC {currentTime}</span>

            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/10 hover:bg-muted/30 border border-muted/20 hover:border-muted/40 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Переключить тему"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-yellow-400 hover:text-yellow-300 transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-green-400 hover:text-green-300 transition-colors" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
