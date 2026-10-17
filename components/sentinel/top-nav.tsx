'use client'

import { Radar } from 'lucide-react'
import { formatTime, useNow } from '@/lib/sentinel/format'
import { NeonBadge } from './neon-badge'

export function TopNav() {
  const now = useNow()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-threat to-threat/40 shadow-[0_0_28px_-4px_var(--threat)] ring-1 ring-inset ring-white/20">
            <Radar className="size-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="flex items-baseline gap-2 truncate text-[15px] font-semibold tracking-tight text-white">
              SentinelAI
              <span className="hidden truncate font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground md:inline">
                {'// Proactive Threat Prevention Hub'}
              </span>
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:hidden">
              Threat Prevention Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden text-right lg:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Local Time</p>
            <p className="tabular font-mono text-sm font-semibold text-white" suppressHydrationWarning>
              {now ? formatTime(now) : '--:--:--'}
            </p>
          </div>
          <span className="hidden h-8 w-px bg-border lg:block" aria-hidden="true" />
          <div role="status" aria-live="polite">
            <NeonBadge tone="safe" dot pulse>
              System Online<span className="hidden sm:inline">{' • AI Guard Active'}</span>
            </NeonBadge>
          </div>
        </div>
      </div>
    </header>
  )
}
