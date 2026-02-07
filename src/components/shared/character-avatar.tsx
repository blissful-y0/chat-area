import { cn } from "@/lib/utils"

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
} as const

const COLORS = [
  "bg-red-900/60",
  "bg-orange-900/60",
  "bg-amber-900/60",
  "bg-emerald-900/60",
  "bg-teal-900/60",
  "bg-cyan-900/60",
  "bg-blue-900/60",
  "bg-indigo-900/60",
  "bg-violet-900/60",
  "bg-pink-900/60",
]

function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface CharacterAvatarProps {
  name: string
  size: keyof typeof SIZES
  avatarUrl: string | null
  className?: string
}

export function CharacterAvatar({
  name,
  size,
  avatarUrl,
  className,
}: CharacterAvatarProps) {
  const sizeClass = SIZES[size]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizeClass,
          className
        )}
      />
    )
  }

  const initial = name.charAt(0).toUpperCase()
  const bgColor = hashColor(name)

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-zinc-200",
        sizeClass,
        bgColor,
        className
      )}
    >
      {initial}
    </div>
  )
}
