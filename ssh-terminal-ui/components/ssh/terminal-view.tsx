"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { SSHServer, TerminalLine } from "@/lib/ssh-types"
import { generateWelcomeLines, simulateCommand } from "@/lib/ssh-mock-data"

interface TerminalViewProps {
  server: SSHServer
  isActive: boolean
}

export function TerminalView({ server, isActive }: TerminalViewProps) {
  const [lines, setLines] = useState<TerminalLine[]>(() =>
    generateWelcomeLines(server)
  )
  const [currentInput, setCurrentInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [lines, scrollToBottom])

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  const handleCommand = (command: string) => {
    const result = simulateCommand(command, server)

    if (result.length === 1 && result[0].content === "__CLEAR__") {
      const promptPrefix = `${server.username}@${server.name.toLowerCase().replace(/\s/g, "-")}:~$`
      setLines([
        {
          id: `prompt-${Date.now()}`,
          type: "prompt",
          content: promptPrefix,
          timestamp: new Date().toISOString(),
        },
      ])
    } else {
      setLines((prev) => {
        const withoutLastPrompt = prev.filter(
          (l, i) => !(i === prev.length - 1 && l.type === "prompt")
        )
        return [...withoutLastPrompt, ...result]
      })
    }

    if (command.trim()) {
      setCommandHistory((prev) => [...prev, command.trim()])
    }
    setHistoryIndex(-1)
    setCurrentInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(currentInput)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCurrentInput("")
        } else {
          setHistoryIndex(newIndex)
          setCurrentInput(commandHistory[newIndex])
        }
      }
    } else if (e.key === "c" && e.ctrlKey) {
      const promptPrefix = `${server.username}@${server.name.toLowerCase().replace(/\s/g, "-")}:~$`
      setLines((prev) => [
        ...prev.filter(
          (l, i) => !(i === prev.length - 1 && l.type === "prompt")
        ),
        {
          id: `int-${Date.now()}`,
          type: "input",
          content: `${promptPrefix} ${currentInput}^C`,
          timestamp: new Date().toISOString(),
        },
        {
          id: `prompt-${Date.now()}`,
          type: "prompt",
          content: promptPrefix,
          timestamp: new Date().toISOString(),
        },
      ])
      setCurrentInput("")
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault()
      const promptPrefix = `${server.username}@${server.name.toLowerCase().replace(/\s/g, "-")}:~$`
      setLines([
        {
          id: `prompt-${Date.now()}`,
          type: "prompt",
          content: promptPrefix,
          timestamp: new Date().toISOString(),
        },
      ])
      setCurrentInput("")
    }
  }

  const handleTerminalClick = () => {
    inputRef.current?.focus()
  }

  const renderLine = (line: TerminalLine) => {
    switch (line.type) {
      case "system":
        return (
          <span className="text-primary/80 italic">{line.content}</span>
        )
      case "input":
        return <span className="text-terminal-foreground">{line.content}</span>
      case "output":
        return <span className="text-terminal-foreground/90">{line.content}</span>
      case "error":
        return <span className="text-destructive">{line.content}</span>
      case "prompt":
        return null
      default:
        return <span>{line.content}</span>
    }
  }

  const lastLine = lines[lines.length - 1]
  const promptText = lastLine?.type === "prompt" ? lastLine.content : ""

  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col bg-terminal font-mono text-sm",
        !isActive && "hidden"
      )}
      onClick={handleTerminalClick}
    >
      <div
        ref={terminalRef}
        className="flex-1 overflow-auto p-4 leading-relaxed terminal-scroll"
      >
        {lines
          .filter((l) => l.type !== "prompt" || l.id !== lastLine?.id)
          .map((line) => (
            <div key={line.id} className="min-h-[1.375rem] whitespace-pre">
              {renderLine(line)}
            </div>
          ))}

        {/* Active prompt line with input */}
        {promptText && (
          <div className="relative flex items-center min-h-[1.375rem]">
            <span className="text-primary font-semibold">{promptText}</span>
            <span className="text-terminal-foreground">&nbsp;</span>
            <span className="text-terminal-foreground whitespace-pre">{currentInput}</span>
            <span className="inline-block w-[0.5em] h-[1.1em] bg-terminal-cursor animate-pulse ml-px" />
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="sr-only"
              autoFocus={isActive}
              spellCheck={false}
              autoComplete="off"
              aria-label="Terminal input"
            />
          </div>
        )}
      </div>
    </div>
  )
}
