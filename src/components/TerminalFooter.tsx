interface TerminalFooterProps {
  isVisible?: boolean
}

/**
 * Компонент TerminalFooter
 *
 * Отображает футер терминала в стиле киберпанк:
 * - Копирайт
 * - Информация о создателе
 * - Плавная анимация появления/скрытия
 */
export function TerminalFooter({ isVisible = true }: TerminalFooterProps) {
  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 border-t border-border bg-black/70 backdrop-blur-sm z-20 transition-all duration-2000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center font-mono text-sm">
          <span className="text-muted-foreground">
            <span className="text-green-400 font-medium">2025 КодИмпульс </span>
            <span className="text-green-400/70">| Терминал нового поколения</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
