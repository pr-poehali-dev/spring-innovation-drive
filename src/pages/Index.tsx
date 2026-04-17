import { useState } from "react"
import { TerminalHeader } from "@/components/TerminalHeader"
import { HeroTerminal } from "@/components/HeroTerminal"
import { CodeRain } from "@/components/CodeRain"
import { TerminalFooter } from "@/components/TerminalFooter"

/**
 * Главная страница - киберпанк терминал
 *
 * Создаёт иммерсивный интерфейс терминала в стиле киберпанк:
 * - Анимация матричного дождя на фоне
 * - Интерактивный терминал с анимацией набора
 * - Динамические шапка/подвал, скрывающиеся при выходе
 */
export default function HomePage() {
  const [showHeaderFooter, setShowHeaderFooter] = useState(true)

  const handleExitTriggered = (isExiting: boolean) => {
    setShowHeaderFooter(!isExiting)
  }

  return (
    <main className="relative">
      <CodeRain />

      <div className="relative z-10">
        <TerminalHeader isVisible={showHeaderFooter} />
        <HeroTerminal onExitTriggered={handleExitTriggered} />
      </div>

      <TerminalFooter isVisible={showHeaderFooter} />
    </main>
  )
}
