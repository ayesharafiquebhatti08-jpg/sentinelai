import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tone = 'threat' | 'warn' | 'safe' | 'info' | 'neutral'

const TONES: Record<Tone, string> = {
  threat: 'neon-threat',
  warn: 'neon-warn',
  safe: 'neon-safe',
  info: 'neon-info',
  neutral: 'border border-border bg-white/[0.03] text-muted-foreground',
}

export function NeonBadge({
  tone,
  solid,
  dot,
  pulse,
  icon: Icon,
  size = 'sm',
  className,
  children,
}: {
  tone: Tone
  solid?: boolean
  dot?: boolean
  pulse?: boolean
  icon?: LucideIcon
  size?: 'xs' | 'sm'
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-mono font-semibold uppercase',
        size === 'xs' ? 'px-2 py-0.5 text-[9px] tracking-[0.14em]' : 'px-2.5 py-1 text-[10px] tracking-[0.16em]',
        solid && tone === 'threat' ? 'neon-threat-solid' : TONES[tone],
        pulse && 'animate-glow-pulse',
        className,
      )}
    >
      {dot && (
        <span className="relative flex size-1.5" aria-hidden="true">
          {pulse && <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />}
          <span className="relative inline-flex size-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
        </span>
      )}
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {children}
    </span>
  )
}
