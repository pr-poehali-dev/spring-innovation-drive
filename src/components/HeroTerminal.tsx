import type React from "react"
import { useState, useEffect, useRef } from "react"

interface HeroTerminalProps {
  onExitTriggered?: (isExiting: boolean) => void
}

const FULL_TEXT = "тетрис"

const fetchIPInfo = async (retries = 1): Promise<string> => {
  const isLikelyBlocked =
    navigator.doNotTrack === "1" ||
    (window as unknown as { chrome?: { runtime?: { onConnect?: unknown } } }).chrome?.runtime?.onConnect ||
    (navigator.userAgent.includes("Firefox") && navigator.userAgent.includes("Private"))

  if (isLikelyBlocked) {
    return "IP_СКРЫТ | ЛОКАЦИЯ_ЗАШИФРОВАНА | СЕТЬ_ЗАЩИЩЕНА"
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
        cache: "no-cache",
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return `${data.ip} | ${data.city}, ${data.region} | Провайдер: ${data.org}`
    } catch {
      if (attempt === retries) {
        return "IP_СКРЫТ | ЛОКАЦИЯ_ЗАШИФРОВАНА | СЕТЬ_ЗАЩИЩЕНА"
      }
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
  return "IP_СКРЫТ | ЛОКАЦИЯ_ЗАШИФРОВАНА | СЕТЬ_ЗАЩИЩЕНА"
}

/**
 * Компонент HeroTerminal
 *
 * Главный интерактивный терминал с:
 * - Анимацией посимвольного набора
 * - Определением метаданных пользователя
 * - Системой команд с историей
 * - Последовательностью выхода с BSOD
 */
export function HeroTerminal({ onExitTriggered }: HeroTerminalProps) {
  const [displayText, setDisplayText] = useState("")
  const [showCursor, setShowCursor] = useState(true)
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isTypingLine, setIsTypingLine] = useState(false)
  const [isInteractive, setIsInteractive] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [showInputCursor, setShowInputCursor] = useState(true)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showBSOD, setShowBSOD] = useState(false)
  const [isExitSequenceActive, setIsExitSequenceActive] = useState(false)
  const [countdown, setCountdown] = useState(7)
  const [showRestartButton, setShowRestartButton] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const exitTimeoutsRef = useRef<NodeJS.Timeout[]>([])
  const ipInfoRef = useRef("IP_СКРЫТ | ЛОКАЦИЯ_ЗАШИФРОВАНА | СЕТЬ_ЗАЩИЩЕНА")

  const clearExitTimeouts = () => {
    exitTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    exitTimeoutsRef.current = []
  }

  const processCommand = (command: string): string[] => {
    const cmd = command.toLowerCase().trim()

    setTerminalLines([])

    switch (cmd) {
      case "help":
      case "помощь":
        return [
          '<span class="text-cyan-400 font-bold">Доступные команды:</span>',
          '  <span class="text-yellow-400">очистить</span>     - <span class="text-gray-400">Очистить экран терминала</span>',
          '  <span class="text-yellow-400">кто</span>          - <span class="text-gray-400">Информация о Тетрис</span>',
          '  <span class="text-yellow-400">время</span>        - <span class="text-gray-400">Показать дату и время</span>',
          '  <span class="text-yellow-400">рекорды</span>      - <span class="text-gray-400">Таблица рекордов</span>',
          '  <span class="text-yellow-400">фигуры</span>       - <span class="text-gray-400">Список фигур Тетрис</span>',
          '  <span class="text-yellow-400">играть</span>       - <span class="text-gray-400">Запустить игру</span>',
        ]

      case "clear":
      case "очистить":
        return ["CLEAR_SCREEN"]

      case "whoami":
      case "кто":
        return [
          `<span class="text-green-400">Игра:</span> <span class="text-green-300">Тетрис — классика навсегда</span>`,
          `<span class="text-green-400">Жанр:</span> <span class="text-green-200">Головоломка / Аркада</span>`,
          `<span class="text-green-400">Создан:</span> <span class="text-green-200">Алексей Пажитнов, 1984</span>`,
          `<span class="text-green-400">Цель:</span> <span class="text-green-200">Складывай фигуры, убирай линии, бей рекорды</span>`,
          `<span class="text-green-400">Режимы:</span> <span class="text-green-200">Одиночная игра | Рекорды | Челлендж</span>`,
        ]

      case "records":
      case "рекорды":
        return [
          '<span class="text-cyan-400 font-bold">🏆 Таблица рекордов:</span>',
          ' <span class="text-yellow-400">1.</span>  <span class="text-white">MATRIX</span>    <span class="text-green-300">999.999</span> <span class="text-gray-400">очков</span>',
          ' <span class="text-yellow-400">2.</span>  <span class="text-white">T3TR15</span>    <span class="text-green-300">847.320</span> <span class="text-gray-400">очков</span>',
          ' <span class="text-yellow-400">3.</span>  <span class="text-white">HACKER</span>    <span class="text-green-300">712.500</span> <span class="text-gray-400">очков</span>',
          ' <span class="text-yellow-400">4.</span>  <span class="text-white">BLOCK_X</span>   <span class="text-green-300">650.100</span> <span class="text-gray-400">очков</span>',
          ' <span class="text-yellow-400">5.</span>  <span class="text-white">ZERO_G</span>    <span class="text-green-300">599.800</span> <span class="text-gray-400">очков</span>',
          '<span class="text-gray-400">Войди в игру, чтобы попасть в таблицу!</span>',
        ]

      case "figures":
      case "фигуры":
        return [
          '<span class="text-cyan-400 font-bold">Фигуры Тетрис (тетрамино):</span>',
          '  <span class="text-cyan-400">I</span>  <span class="text-gray-400">— длинная палка (4 блока)</span>',
          '  <span class="text-yellow-400">O</span>  <span class="text-gray-400">— квадрат 2x2</span>',
          '  <span class="text-orange-400">L</span>  <span class="text-gray-400">— Г-образная фигура</span>',
          '  <span class="text-blue-400">J</span>  <span class="text-gray-400">— зеркальная Г-образная</span>',
          '  <span class="text-green-400">S</span>  <span class="text-gray-400">— S-образная змейка</span>',
          '  <span class="text-red-400">Z</span>  <span class="text-gray-400">— Z-образная змейка</span>',
          '  <span class="text-purple-400">T</span>  <span class="text-gray-400">— T-образная фигура</span>',
        ]

      case "time":
      case "время": {
        const now = new Date()
        const timeString = now.toLocaleString("ru-RU")
        const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone
        return [`<span class="text-cyan-400">${timeString}</span> <span class="text-yellow-400">${timezoneName}</span>`]
      }

      case "play":
      case "играть":
        executeExit()
        return [""]

      default:
        return ["[КОМАНДА НЕ РАСПОЗНАНА] Введите 'помощь' для списка команд"]
    }
  }

  const executeExit = async () => {
    clearExitTimeouts()

    setIsExitSequenceActive(true)
    setIsInteractive(false)
    onExitTriggered?.(true)

    setTerminalLines([])

    const initialTimeout = setTimeout(async () => {
      const exitSequence = [
        '<span class="text-cyan-400 font-bold">ЗАПУСК ИГРОВОГО ДВИЖКА ТЕТРИС...</span>',
        "",
        '<span class="text-cyan-400">$ tetris --init --mode=classic</span>',
        '<span class="text-yellow-400">загрузка_ресурсов:</span> <span class="text-green-300">OK</span>',
        '<span class="text-yellow-400">инициализация_поля:</span> <span class="text-green-300">10x20 клеток</span>',
        '<span class="text-yellow-400">генератор_фигур:</span> <span class="text-orange-400">СЛУЧАЙНЫЙ_РЕЖИМ</span>',
        "",
        '<span class="text-cyan-400">$ cat /proc/tetris/engine</span>',
        '<span class="text-green-400">движок:</span> <span class="text-white">TetrisCore v2.0</span>',
        '<span class="text-green-400">фреймрейт:</span> <span class="text-white">60 FPS</span>',
        '<span class="text-green-400">гравитация:</span> <span class="text-white">уровень 1 → 10</span>',
        "",
        '<span class="text-cyan-400">$ ps aux | grep tetris</span>',
        '<span class="text-yellow-400 font-bold animate-pulse">ФИГУРА_I</span> <span class="text-cyan-400 font-bold animate-pulse">ПАДАЕТ</span> <span class="text-green-400 font-bold animate-pulse">СКОРОСТЬ_1.0</span>',
        '<span class="text-orange-400 font-bold animate-pulse">ФИГУРА_L</span> <span class="text-purple-400 font-bold animate-pulse">В_ОЧЕРЕДИ</span>',
        '<span class="text-red-400 font-bold animate-pulse">ЛИНИЯ</span> <span class="text-green-400 font-bold animate-pulse">ПОЧТИ_ЗАПОЛНЕНА</span> <span class="text-yellow-400 font-bold animate-pulse">+100_ОЧКОВ</span>',
        "",
        '<span class="text-yellow-400">Загрузка уровней:</span>',
        ' <span class="text-cyan-400">[▓▓▓▓▓▓▓▓░░]</span> <span class="text-green-400">80%</span> <span class="text-gray-400">— уровень 1</span>',
        ' <span class="text-cyan-400">[▓▓▓▓▓▓▓▓▓▓]</span> <span class="text-green-400">100%</span> <span class="text-gray-400">— готово!</span>',
        "",
        '<span class="text-green-500 font-bold text-lg animate-pulse">ИГРА ЗАГРУЖЕНА!</span>',
        '<span class="text-yellow-400 font-bold animate-pulse">ДОБРО ПОЖАЛОВАТЬ В ТЕТРИС</span>',
        "",
        '<span class="text-cyan-400 font-bold text-xl animate-pulse">СТАРТ!</span>',
        '<span class="text-green-500 font-bold text-2xl animate-pulse">УДАЧИ В ИГРЕ!</span>',
      ]

      let lineIndex = 0
      let charIndex = 0

      const typeExitSequence = () => {
        if (lineIndex >= exitSequence.length) {
          const bsodTimeout = setTimeout(() => {
            setShowBSOD(true)
            setCountdown(7)
          }, 500)
          exitTimeoutsRef.current.push(bsodTimeout)
          return
        }

        const currentLine = exitSequence[lineIndex]

        if (charIndex === 0 && currentLine !== "") {
          setTerminalLines((prev) => [...prev, ""])
        }

        if (currentLine === "") {
          setTerminalLines((prev) => [...prev, ""])
          lineIndex++
          charIndex = 0
          setTimeout(typeExitSequence, 25)
          return
        }

        if (charIndex < currentLine.length) {
          const partialLine = currentLine.slice(0, charIndex + 1)
          setTerminalLines((prev) => {
            const newLines = [...prev]
            newLines[newLines.length - 1] = partialLine
            return newLines
          })
          charIndex++

          const typingSpeed = currentLine.includes("$")
            ? 2.5
            : currentLine.includes("ЗАГРУЖЕНА") || currentLine.includes("СТАРТ")
              ? 3.75
              : currentLine.includes("ТЕТРИС")
                ? 1.875
                : Math.random() * 1.25 + 1

          setTimeout(typeExitSequence, typingSpeed)
        } else {
          charIndex = 0
          lineIndex++

          const pauseTime = currentLine.includes("$")
            ? 25
            : currentLine.includes("ЗАГРУЖЕНА") || currentLine.includes("СТАРТ")
              ? 37.5
              : 12.5

          setTimeout(typeExitSequence, pauseTime)
        }
      }

      typeExitSequence()
    }, 500)
    exitTimeoutsRef.current.push(initialTimeout)
  }

  const handleInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isExitSequenceActive) return

    if (e.key === "Enter" && userInput.trim()) {
      const command = userInput.trim()
      const response = processCommand(command)

      setCommandHistory((prev) => [...prev, command])
      setHistoryIndex(-1)

      if (response[0] === "CLEAR_SCREEN") {
        setTerminalLines([])
      } else {
        setTerminalLines((prev) => [...prev, `root@tetris:~# ${command}`, ...response, ""])
      }

      setUserInput("")

      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setUserInput(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setUserInput("")
        } else {
          setHistoryIndex(newIndex)
          setUserInput(commandHistory[newIndex])
        }
      }
    }
  }

  useEffect(() => {
    const detectUserMetadata = async () => {
      const screen = `${window.screen.width}x${window.screen.height}`
      const viewport = `${window.innerWidth}x${window.innerHeight}`
      const userAgent = navigator.userAgent
      const platform = navigator.platform
      const language = navigator.language
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const colorDepth = window.screen.colorDepth
      const pixelRatio = window.devicePixelRatio

      const fingerprint = btoa(userAgent + platform + screen).slice(0, 16)

      let lineIndex = 0
      let charIndex = 0

      const typeCharacter = () => {
        const currentIpInfo = ipInfoRef.current

        const lines = [
          "",
          '<span class="text-cyan-400">$ tetris --check-connection</span>',
          `<span class="text-yellow-400">сетевая_трассировка:</span> <span class="text-white">${currentIpInfo}</span>`,
          "",
          '<span class="text-cyan-400">$ tetris --fingerprint</span>',
          `<span class="text-yellow-400">идентификатор_игрока:</span> <span class="text-orange-400">${fingerprint}</span><span class="text-gray-400">...</span>`,
          "",
          '<span class="text-cyan-400">$ cat /proc/данные_игрока</span>',
          `<span class="text-yellow-400">браузер=</span><span class="text-green-300">"${userAgent}"</span>`,
          `<span class="text-yellow-400">платформа=</span><span class="text-green-300">"${platform}"</span> <span class="text-yellow-400">язык=</span><span class="text-green-300">"${language}"</span>`,
          `<span class="text-yellow-400">экран=</span><span class="text-green-300">"${screen}"</span> <span class="text-yellow-400">окно=</span><span class="text-green-300">"${viewport}"</span>`,
          `<span class="text-yellow-400">цвет=</span><span class="text-green-300">"${colorDepth}бит"</span> <span class="text-yellow-400">плотность=</span><span class="text-green-300">"${pixelRatio}x"</span>`,
          `<span class="text-yellow-400">часовой_пояс=</span><span class="text-green-300">"${timezone}"</span>`,
          "",
        ]

        if (lineIndex >= lines.length) {
          setIsInteractive(true)
          return
        }

        const currentLine = lines[lineIndex]

        if (charIndex === 0) {
          setIsTypingLine(true)
          setTerminalLines((prev) => [...prev, ""])
        }

        if (charIndex < currentLine.length) {
          const partialLine = currentLine.slice(0, charIndex + 1)
          setTerminalLines((prev) => {
            const newLines = [...prev]
            newLines[newLines.length - 1] = partialLine
            return newLines
          })
          charIndex++

          const typingSpeed = currentLine.startsWith("$")
            ? 2.5
            : currentLine.includes("ALERT")
              ? 3.75
              : currentLine.includes("сетевая_трассировка")
                ? 1.875
                : Math.random() * 1.25 + 1

          setTimeout(typeCharacter, typingSpeed)
        } else {
          setIsTypingLine(false)
          charIndex = 0
          lineIndex++

          const pauseTime =
            currentLine === "" ? 6.25 : currentLine.startsWith("$") ? 25 : currentLine.includes("ALERT") ? 37.5 : 12.5

          setTimeout(typeCharacter, pauseTime)
        }
      }

      typeCharacter()

      fetchIPInfo(1).then((ipInfo) => {
        ipInfoRef.current = ipInfo
        setTerminalLines((prev) =>
          prev.map((line) =>
            line.includes("сетевая_трассировка:")
              ? `<span class="text-yellow-400">сетевая_трассировка:</span> <span class="text-white">${ipInfo}</span>`
              : line,
          ),
        )
      })
    }

    detectUserMetadata()

    let i = 0
    const typeTimer = setInterval(() => {
      if (i < FULL_TEXT.length) {
        setDisplayText(FULL_TEXT.slice(0, i + 1))
        i++
      } else {
        clearInterval(typeTimer)
      }
    }, 4.75)

    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 125)

    const inputCursorTimer = setInterval(() => {
      setShowInputCursor((prev) => !prev)
    }, 100)

    return () => {
      clearInterval(typeTimer)
      clearInterval(cursorTimer)
      clearInterval(inputCursorTimer)
      clearExitTimeouts()
    }
  }, [])

  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (window.innerWidth > 768 && isInteractive && !isExitSequenceActive) {
        const target = e.target as HTMLElement
        const isInputElement =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true"

        if (!isInputElement && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          inputRef.current?.focus()
        }
      }
    }

    document.addEventListener("keydown", handleGlobalKeydown)
    return () => document.removeEventListener("keydown", handleGlobalKeydown)
  }, [isInteractive, isExitSequenceActive])

  useEffect(() => {
    if (showBSOD && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showBSOD && countdown === 0) {
      setShowRestartButton(true)
    }
  }, [showBSOD, countdown])

  const handleManualRestart = () => {
    window.location.reload()
  }

  if (showBSOD) {
    return (
      <div className="fixed inset-0 bg-blue-600 text-white font-mono flex flex-col justify-center items-start z-50 overflow-auto">
        <div className="w-full p-4 md:p-8 space-y-2 md:space-y-4">
          <div className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">:(</div>

          <div className="text-base md:text-xl mb-1 md:mb-2">
            Запуск игры перегрузил терминал и требуется перезагрузка.
          </div>
          <div className="text-sm md:text-lg mb-2 md:mb-4">
            Слишком много фигур одновременно! Восстанавливаем систему...
          </div>

          <div className="text-xs md:text-sm space-y-1 md:space-y-2 max-w-full">
            <div className="text-white space-y-1">
              <div>Паника ядра - переполнение стека фигур: Критическое исключение</div>
              <div className="hidden md:block">CPU: 0 PID: 1 Comm: tetris/engine Без патчей 6.1.0-tetris #1</div>
              <div className="hidden md:block">Оборудование: TETRIS Терминал/GAME, BIOS v1.984 01/01/1984</div>
            </div>

            <div className="text-blue-200 space-y-1 mt-2 md:mt-4 hidden md:block">
              <div>Стек вызовов:</div>
              <div className="ml-4 space-y-1">
                <div>? __die+0x20/0x70</div>
                <div>? die+0x33/0x40</div>
                <div>? impulse_terminal_init+0x42/0x80</div>
                <div>? exc_invalid_state+0x4c/0x60</div>
                <div>? impulse_terminal_init+0x42/0x80</div>
                <div>? kernel_init+0x1a/0x130</div>
              </div>
            </div>

            <div className="text-blue-300 space-y-1 mt-2 md:mt-4 hidden md:block">
              <div>RIP: 0010:tetris_engine_init+0x42/0x80</div>
              <div>Code: 48 89 df e8 0b fe ff ff 85 c0 78 73 48 c7 c7 a0 e4 82 82 e8 0f 0b 48</div>
              <div>RSP: 0000:ffffc90000013e28 EFLAGS: 00010246</div>
              <div>RBP: ffffc90000013e40 DATA: 0000000000000000 R09: c0000000ffffdfff</div>
            </div>

            <div className="text-blue-400 space-y-1 mt-2 md:mt-4 hidden md:block">
              <div>Подключённые модули: tetris_core tetris_engine matrix_rain figure_generator</div>
              <div>---[ конец паники ядра - переполнение стека фигур: Критическое исключение ]---</div>
            </div>

            <div className="mt-4 md:mt-6 space-y-2">
              <p className="text-sm md:text-base">Если вы обратитесь в поддержку, сообщите эту информацию:</p>
              <p className="bg-blue-700 p-2 rounded text-xs md:text-sm">Код остановки: STACK_OVERFLOW_TETROMINO</p>
              <p className="bg-blue-700 p-2 rounded text-xs md:text-sm">Источник сбоя: tetris_engine.sys</p>

              <div className="mt-4 p-3 bg-blue-800 rounded border border-blue-500 mb-20 md:mb-8">
                <div className="text-yellow-300 font-bold text-sm md:text-base">Восстановление из резервных копий...</div>
                {!showRestartButton ? (
                  <>
                    <div className="text-green-400 mt-1 text-sm md:text-base">
                      Перезагрузка через: {countdown} сек.
                    </div>
                    <div className="w-full bg-blue-900 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="bg-green-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, ((7 - countdown) / 7) * 100)}%` }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-green-400 mt-1 text-sm md:text-base">Восстановление завершено!</div>
                    <div className="w-full bg-blue-900 rounded-full h-2 mt-2 overflow-hidden">
                      <div className="bg-green-400 h-2 rounded-full w-full"></div>
                    </div>
                    <button
                      onClick={handleManualRestart}
                      className="mt-4 px-4 md:px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors duration-200 border-2 border-green-400 text-sm md:text-base"
                    >
                      Вернуться в терминал
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-2 left-2 md:bottom-4 md:left-8 text-xs text-gray-300 space-y-1 max-w-[calc(100vw-1rem)] md:max-w-none">
          <div className="text-green-400">Нажмите Ctrl+Alt+Del для перезагрузки (шутка)</div>
          <div className="text-cyan-400">Или попробуйте выключить и включить снова...</div>
        </div>
      </div>
    )
  }

  return (
    <section className="flex flex-col justify-start items-center relative overflow-hidden py-8">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="container mx-auto px-4 relative z-10 w-full">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg shadow-2xl mb-8 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/20 flex-shrink-0">
              <div className="w-3 h-3 bg-destructive rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="ml-4 text-xs text-muted-foreground font-mono">терминал://tetris.game</span>
            </div>

            <div className="p-8 font-mono">
              <div className="text-left space-y-1">
                {terminalLines.map((line, index) => {
                  return (
                    <p
                      key={index}
                      className={
                        line && line.includes("whitespace-pre")
                          ? ""
                          : (line && line.includes("ВТОРЖЕНИЕ_ОБНАРУЖЕНО")) ||
                              (line && line.includes("ЦЕЛЬ_ЗАХВАЧЕНА")) ||
                              (line && line.includes("[ТРЕВОГА]")) ||
                              (line && line.includes("АВАРИЙНЫЙ")) ||
                              (line && line.includes("ВНИМАНИЕ:")) ||
                              (line && line.includes("КРИТИЧЕСКАЯ ОШИБКА")) ||
                              (line && line.includes("СБОЙ СИСТЕМЫ")) ||
                              (line && line.includes("СКОМПРОМЕТИРОВАНО"))
                            ? "text-red-400 font-bold"
                            : line && line.startsWith("$")
                              ? "text-green-400"
                              : line && line.startsWith("root@tetris")
                                ? "text-green-400 font-bold"
                                : line &&
                                    (line.includes("[ДОСТУП ЗАПРЕЩЁН]") ||
                                      line.includes("Внимание:") ||
                                      line.includes("Уязвимости") ||
                                      line.includes("Ошибка сегментации") ||
                                      line.includes("Переполнение стека"))
                                  ? "text-red-400 font-bold"
                                  : line &&
                                      (line.includes("браузер=") ||
                                        line.includes("платформа=") ||
                                        line.includes("разрешение=") ||
                                        line.includes("глубина_цвета=") ||
                                        line.includes("часовой_пояс=") ||
                                        line.includes("сетевая_трассировка:") ||
                                        line.includes("отпечаток:") ||
                                        line.includes("идентификатор_игрока:") ||
                                        line.includes("экран="))
                                    ? "text-green-400"
                                    : line &&
                                        (line.includes("АНАЛИЗ_ЗАВЕРШЁН") ||
                                          line.includes("ЗАПИСЬ_СЕССИИ") ||
                                          line.includes("[ИНФО]") ||
                                          line.includes("Прогресс:") ||
                                          line.includes("успешно") ||
                                          line.includes("завершено") ||
                                          line.includes("предоставлен") ||
                                          line.includes("100%") ||
                                          line.includes("Удаление"))
                                      ? "text-yellow-400"
                                      : "text-muted-foreground"
                      }
                      dangerouslySetInnerHTML={{ __html: line }}
                    />
                  )
                })}

                {isInteractive && !isExitSequenceActive && (
                  <div className="flex items-center mt-2">
                    <span className="text-green-400 font-bold">root@tetris:~#</span>
                    <div className="relative flex-1 ml-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleInputSubmit}
                        className="bg-transparent border-none outline-none text-muted-foreground font-mono w-full"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Введите 'играть' или 'помощь'..."
                      />
                      <span
                        className={`absolute left-0 top-0 ${showInputCursor ? "opacity-100 text-green-400 font-bold text-lg" : "opacity-0"} transition-opacity duration-100 pointer-events-none`}
                        style={{ left: userInput.length > 0 ? `${userInput.length * 0.6}em` : "0" }}
                      >
                        _
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}