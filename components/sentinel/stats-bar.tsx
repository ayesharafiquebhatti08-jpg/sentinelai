'use client'

import { AnimatePresence, motion } from 'motion/react'
import { CircleCheck, Cctv, Gauge, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stat {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  tone: 'neutral' | 'threat' | 'safe' | 'warn'
}

const TONES: Record<Stat['tone'], string> = {
  neutral: 'text-info bg-info/10 border-info/25',
  threat: 'text-threat bg-threat/10 border-threat/30',
  safe: 'text-safe bg-safe/10 border-safe/25',
  warn: 'text-warn bg-warn/10 border-warn/25',
}

export function StatsBar({
  cameras,
  threatsToday,
  resolved,
  accuracy,
  activeCount,
  reviewCount,
}: {
  cameras: number
  threatsToday: number
  resolved: number
  accuracy: number
  activeCount: number
  reviewCount: number
}) {
  const stats: Stat[] = [
    {
      label: 'Active Cameras',
      value: String(cameras),
      sub: '4 zones · 100% uptime',
      icon: Cctv,
      tone: 'neutral',
    },
    {
      label: 'Threats Detected Today',
      value: String(threatsToday),
      sub: `${activeCount} active · ${reviewCount} in review`,
      icon: TriangleAlert,
      tone: activeCount > 0 ? 'threat' : 'warn',
    },
    {
      label: 'Resolved Incidents',
      value: String(resolved),
      sub: 'Archived to audit log',
      icon: CircleCheck,
      tone: 'safe',
    },
    {
      label: 'System Accuracy',
      value: `${accuracy.toFixed(1)}%`,
      sub: 'Rolling model precision',
      icon: Gauge,
      tone: 'neutral',
    },
  ]

  return (
    <section aria-label="Quick statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="group relative overflow-hidden rounded-xl border border-border bg-card/70 p-4 transition-colors hover:bg-card"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-[10px] uppercase leading-tight tracking-[0.18em] text-muted-foreground">
              {s.label}
            </p>
            <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-md border', TONES[s.tone])}>
              <s.icon className="size-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 h-9 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={s.value}
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -18, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="tabular text-3xl font-semibold tracking-tight"
              >
                {s.value}
              </motion.p>
            </AnimatePresence>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{s.sub}</p>
        </div>
      ))}
    </section>
  )
}
