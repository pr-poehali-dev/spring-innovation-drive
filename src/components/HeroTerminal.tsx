import type React from "react"
import { useState, useEffect, useRef } from "react"

interface HeroTerminalProps {
  onExitTriggered?: (isExiting: boolean) => void
}

const FULL_TEXT = "код импульс"

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
          '  <span class="text-yellow-400">кто</span>          - <span class="text-gray-400">Информация о КодИмпульс</span>',
          '  <span class="text-yellow-400">время</span>        - <span class="text-gray-400">Показать дату и время</span>',
          '  <span class="text-yellow-400">трассировка</span>  - <span class="text-gray-400">Запустить трассировку</span>',
          '  <span class="text-yellow-400">доступ</span>       - <span class="text-gray-400">Запросить доступ к системе</span>',
          '  <span class="text-yellow-400">импульс</span>      - <span class="text-gray-400">Активировать импульс</span>',
        ]

      case "clear":
      case "очистить":
        return ["CLEAR_SCREEN"]

      case "whoami":
      case "кто":
        return [
          `<span class="text-green-400">Название:</span> <span class="text-green-300">КодИмпульс</span>`,
          `<span class="text-green-400">Локация:</span> <span class="text-green-200">приближается к вам..</span>`,
          `<span class="text-green-400">Телеграм:</span> <a href="https://t.me/codeimpulse" target="_blank" rel="noopener noreferrer" class="text-green-300 hover:text-green-200 underline">@codeimpulse</a>`,
          `<span class="text-green-400">GitHub:</span> <a href="https://github.com/codeimpulse" target="_blank" rel="noopener noreferrer" class="text-green-300 hover:text-green-200 underline">@codeimpulse</a>`,
          `<span class="text-green-400">Сайт:</span> <a href="https://codeimpulse.dev" target="_blank" rel="noopener noreferrer" class="text-green-300 hover:text-green-200 underline">codeimpulse.dev</a>`,
        ]

      case "access":
      case "доступ":
        return [
          '<span class="text-red-400 font-bold">[ДОСТУП ЗАПРЕЩЁН]</span> <span class="text-yellow-400">ВВЕДИТЕ \'ИМПУЛЬС\'</span>',
        ]

      case "trace":
      case "трассировка":
        return [
          '<span class="text-cyan-400">$ traceroute целевой_хост</span>',
          '<span class="text-gray-400">трассировка до</span> <span class="text-white">целевой_хост</span> <span class="text-gray-400">(</span><span class="text-cyan-300">192.168.1.1</span><span class="text-gray-400">), макс. 30 прыжков, 60 байт</span>',
          ' <span class="text-yellow-400">1</span>  <span class="text-green-300">шлюз</span> <span class="text-gray-400">(</span><span class="text-cyan-300">192.168.1.1</span><span class="text-gray-400">)</span>  <span class="text-white">1.234 мс</span>  <span class="text-white">1.123 мс</span>  <span class="text-white">1.456 мс</span>',
          ' <span class="text-yellow-400">2</span>  <span class="text-cyan-300">10.0.0.1</span> <span class="text-gray-400">(</span><span class="text-cyan-300">10.0.0.1</span><span class="text-gray-400">)</span>  <span class="text-white">12.345 мс</span>  <span class="text-white">11.234 мс</span>  <span class="text-white">13.456 мс</span>',
          ' <span class="text-yellow-400">3</span>  <span class="text-cyan-300">172.16.0.1</span> <span class="text-gray-400">(</span><span class="text-cyan-300">172.16.0.1</span><span class="text-gray-400">)</span>  <span class="text-white">23.456 мс</span>  <span class="text-white">22.345 мс</span>  <span class="text-white">24.567 мс</span>',
          ' <span class="text-yellow-400">4</span>  <span class="text-red-400">* * *</span>',
          ' <span class="text-yellow-400">5</span>  <span class="text-cyan-300">203.0.113.1</span> <span class="text-gray-400">(</span><span class="text-cyan-300">203.0.113.1</span><span class="text-gray-400">)</span>  <span class="text-white">45.678 мс</span>  <span class="text-white">44.567 мс</span>  <span class="text-white">46.789 мс</span>',
          '<span class="text-green-400">трассировка завершена - цель обнаружена</span>',
        ]

      case "time":
      case "время":
        const now = new Date()
        const timeString = now.toLocaleString("ru-RU")
        const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone
        return [`<span class="text-cyan-400">${timeString}</span> <span class="text-yellow-400">${timezoneName}</span>`]

      case "impulse":
      case "импульс":
      case "pulse":
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
        '<span class="text-red-400 font-bold">ИНИЦИАЛИЗАЦИЯ ТЕРМАЛЬНОГО КОНТАКТА...</span>',
        "",
        '<span class="text-cyan-400">$ импульс --активация</span>',
        '<span class="text-yellow-400">состояние_протокола:</span> <span class="text-green-300">ИМПУЛЬС_АКТИВЕН</span>',
        '<span class="text-yellow-400">режим_синхронизации:</span> <span class="text-orange-400">ВКЛЮЧЁН</span>',
        "",
        '<span class="text-cyan-400">$ cat /proc/состояние_ядра</span>',
        '<span class="text-red-500 font-bold">ПАНИКА ЯДРА:</span> <span class="text-yellow-400">Невозможно обработать NULL-указатель</span> <span class="text-magenta-400">0xDEADBEEF</span>',
        '<span class="text-red-500 font-bold">ОШИБКА:</span> <span class="text-cyan-400">сбой запроса страничной памяти</span>',
        '<span class="text-green-400">IP:</span> <span class="text-yellow-400">[&lt;ffffffffa0123456&gt;]</span> <span class="text-red-400">impulse_exit+0x42/0x100</span>',
        "",
        '<span class="text-cyan-400">$ ps aux | grep импульс</span>',
        '<span class="text-red-400 font-bold animate-pulse">НЕЙРОСЕТЬ</span> <span class="text-yellow-400 font-bold animate-pulse">АКТИВНО_СКАНИРУЕТ</span> <span class="text-cyan-400 font-bold animate-pulse">ДАННЫЕ_ОБНАРУЖЕНЫ</span>',
        '<span class="text-magenta-400 font-bold animate-pulse">МОДУЛЬ_ЗАЩИТЫ</span> <span class="text-green-400 font-bold animate-pulse">АНТРОПОМОРФИЗМ_АКТИВЕН</span>',
        '<span class="text-purple-400 font-bold animate-pulse">ПРОТОКОЛЫ_ИМПУЛЬСА</span> <span class="text-orange-400 font-bold animate-pulse">ПРОРЫВ_НЕИЗБЕЖЕН</span>',
        "",
        '<span class="text-yellow-400">Стек вызовов:</span>',
        ' <span class="text-cyan-400">[&lt;ffffffffa0123456&gt;]</span> <span class="text-green-400">impulse_exit+0x42/0x100</span> <span class="text-magenta-400">[impulse_core]</span>',
        ' <span class="text-cyan-400">[&lt;ffffffff81234567&gt;]</span> <span class="text-green-400">sys_exit_group+0x0/0x20</span>',
        ' <span class="text-cyan-400">[&lt;ffffffff81345678&gt;]</span> <span class="text-green-400">system_call_fastpath+0x16/0x1b</span>',
        "",
        '<span class="text-red-500 font-bold text-lg">КРИТИЧЕСКАЯ ОШИБКА:</span> <span class="text-yellow-400 font-bold">ПРОРЫВ ПРОТОКОЛОВ ИМПУЛЬСА</span>',
        '<span class="text-orange-400 font-bold">ПОВРЕЖДЕНИЕ_ПАМЯТИ:</span> <span class="text-magenta-400">0xDEADBEEF</span> <span class="text-red-400">-&gt;</span> <span class="text-cyan-400">0xCAFEBABE</span>',
        '<span class="text-red-400 font-bold">ПЕРЕПОЛНЕНИЕ_СТЕКА в</span> <span class="text-yellow-400">IMPULSE_HANDLER()</span>',
        "",
        '<span class="text-red-500 font-bold text-xl animate-pulse">СБОЙ ЦЕЛОСТНОСТИ СИСТЕМЫ</span>',
        '<span class="text-blue-400 font-bold text-lg animate-pulse">СИНИЙ ЭКРАН НЕИЗБЕЖЕН...</span>',
        "",
        '<span class="text-red-400 font-bold text-2xl animate-pulse">КРИТИЧНО</span>',
        '<span class="text-red-500 font-bold text-3xl animate-pulse">КРИТИЧЕСКИЙ СБОЙ СИСТЕМЫ</span>',
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
            : currentLine.includes("ПАНИКА ЯДРА") || currentLine.includes("КРИТИЧ")
              ? 3.75
              : currentLine.includes("ИМПУЛЬС")
                ? 1.875
                : Math.random() * 1.25 + 1

          setTimeout(typeExitSequence, typingSpeed)
        } else {
          charIndex = 0
          lineIndex++

          const pauseTime = currentLine.includes("$")
            ? 25
            : currentLine.includes("КРИТИЧ") || currentLine.includes("СБОЙ")
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
        setTerminalLines((prev) => [...prev, `root@impulse:~# ${command}`, ...response, ""])
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
          '<span class="text-cyan-400">$ traceroute целевой_хост</span>',
          `<span class="text-yellow-400">сетевая_трассировка:</span> <span class="text-white">${currentIpInfo}</span>`,
          "",
          '<span class="text-cyan-400">$ md5sum /dev/urandom | head -c 16</span>',
          `<span class="text-yellow-400">отпечаток:</span> <span class="text-orange-400">${fingerprint}</span><span class="text-gray-400">...</span>`,
          "",
          '<span class="text-cyan-400">$ cat /proc/метаданные_пользователя</span>',
          `<span class="text-yellow-400">браузер=</span><span class="text-green-300">"${userAgent}"</span>`,
          `<span class="text-yellow-400">платформа=</span><span class="text-green-300">"${platform}"</span> <span class="text-yellow-400">язык=</span><span class="text-green-300">"${language}"</span>`,
          `<span class="text-yellow-400">разрешение=</span><span class="text-green-300">"${screen}"</span> <span class="text-yellow-400">viewport=</span><span class="text-green-300">"${viewport}"</span>`,
          `<span class="text-yellow-400">глубина_цвета=</span><span class="text-green-300">"${colorDepth}бит"</span> <span class="text-yellow-400">плотность=</span><span class="text-green-300">"${pixelRatio}x"</span>`,
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
            Активация импульса вызвала сбой и требуется перезагрузка.
          </div>
          <div className="text-sm md:text-lg mb-2 md:mb-4">
            Мы собираем информацию об ошибке, после чего система перезагрузится.
          </div>

          <div className="text-xs md:text-sm space-y-1 md:space-y-2 max-w-full">
            <div className="text-white space-y-1">
              <div>Паника ядра - синхронизация невозможна: Критическое исключение</div>
              <div className="hidden md:block">CPU: 0 PID: 1 Comm: swapper/0 Без патчей 6.1.0-impulse #1</div>
              <div className="hidden md:block">Оборудование: IMPULSE Терминал/IMPULSE, BIOS v2.0 01/01/2025</div>
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
              <div>RIP: 0010:impulse_terminal_init+0x42/0x80</div>
              <div>Code: 48 89 df e8 0b fe ff ff 85 c0 78 73 48 c7 c7 a0 e4 82 82 e8 0f 0b 48</div>
              <div>RSP: 0000:ffffc90000013e28 EFLAGS: 00010246</div>
              <div>RBP: ffffc90000013e40 DATA: 0000000000000000 R09: c0000000ffffdfff</div>
            </div>

            <div className="text-blue-400 space-y-1 mt-2 md:mt-4 hidden md:block">
              <div>Подключённые модули: impulse_core impulse_terminal matrix_rain</div>
              <div>---[ конец паники ядра - синхронизация невозможна: Критическое исключение ]---</div>
            </div>

            <div className="mt-4 md:mt-6 space-y-2">
              <p className="text-sm md:text-base">Если вы обратитесь в поддержку, сообщите эту информацию:</p>
              <p className="bg-blue-700 p-2 rounded text-xs md:text-sm">Код остановки: CRITICAL_PROCESS_DIED</p>
              <p className="bg-blue-700 p-2 rounded text-xs md:text-sm">Источник сбоя: impulse.sys</p>

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
                      Войти в терминал
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
              <span className="ml-4 text-xs text-muted-foreground font-mono">терминал://codeimpulse.dev</span>
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
                              : line && line.startsWith("root@impulse")
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
                                        line.includes("@codeimpulse") ||
                                        line.includes("github.com/codeimpulse"))
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
                    <span className="text-green-400 font-bold">root@impulse:~#</span>
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
                        placeholder="Введите 'помощь' для списка команд..."
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
