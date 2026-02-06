import type { MacroContext } from "./types"

const MACRO_PATTERN = /\{\{([^}]+)\}\}/g

function getDateString(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getTimeString(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function resolveBuiltinMacro(name: string, context: MacroContext): string | null {
  const lower = name.toLowerCase().trim()

  switch (lower) {
    case "char":
      return context.char
    case "user":
      return context.user
    case "date":
      return context.date || getDateString()
    case "time":
      return context.time || getTimeString()
    case "idle_duration":
      return context.idle_duration ?? ""
    case "random":
      return context.random ?? String(randomNumber(1, 100))
    case "roll":
      return context.roll ?? String(randomNumber(1, 20))
    case "\\n":
      return "\n"
    default:
      return null
  }
}

function resolveRangedMacro(name: string): string | null {
  // {{random::min::max}} syntax
  const randomMatch = name.match(/^random::(\d+)::(\d+)$/)
  if (randomMatch) {
    const min = parseInt(randomMatch[1], 10)
    const max = parseInt(randomMatch[2], 10)
    return String(randomNumber(min, max))
  }

  // {{roll::sides}} syntax (dice roll)
  const rollMatch = name.match(/^roll::(\d+)$/)
  if (rollMatch) {
    const sides = parseInt(rollMatch[1], 10)
    return String(randomNumber(1, sides))
  }

  return null
}

export function processMacros(text: string, context: MacroContext): string {
  if (!text) return text

  return text.replace(MACRO_PATTERN, (_match, macroName: string) => {
    // Try builtin macros first
    const builtin = resolveBuiltinMacro(macroName, context)
    if (builtin !== null) return builtin

    // Try ranged macros
    const ranged = resolveRangedMacro(macroName)
    if (ranged !== null) return ranged

    // Try context lookup for custom macros
    const customValue = context[macroName.trim()]
    if (customValue !== undefined) return customValue

    // Unresolved macro: leave as-is
    return `{{${macroName}}}`
  })
}

export function createMacroContext(
  characterName: string,
  userName: string,
  overrides: Partial<MacroContext> = {}
): MacroContext {
  return {
    char: characterName,
    user: userName,
    date: getDateString(),
    time: getTimeString(),
    ...overrides,
  }
}
