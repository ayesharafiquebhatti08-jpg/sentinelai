'use client'

import { Radar } from 'lucide-react'
import { formatTime, useNow } from '@/lib/sentinel/format'

export function TopNav() {
  const now = useNow()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-threat/40 bg-threat/10 glow-threat">
            <Radar className="size-5 text-threat" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight md:text-base">
              SentinelAI
              <span className="hidden font-mono text-xs font-normal text-muted-foreground sm:inline">
                {' // Proactive Threat Prevention Hub'}
              </span>
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:hidden">
              Threat Prevention Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right font-mono md:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Local Time</p>
            <p className="tabular text-sm text-foreground" suppressHydrationWarning>
              {now ? formatTime(now) : '--:--:--'}
            </p>
          </div>
          <div
            className="flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-3 py-1.5"
            role="status"
            aria-live="polite"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-safe opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-safe" />
            </span>
            <span className="whitespace-nowrap font-mono text-[11px] font-medium text-safe">
              System Online<span className="hidden sm:inline">{' • AI Guard Active'}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
