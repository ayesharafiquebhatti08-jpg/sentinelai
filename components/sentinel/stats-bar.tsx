'use client'

import { AnimatePresence, motion } from 'motion/react'
import { CircleCheck, Cctv, Gauge, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Accent = 'info' | 'threat' | 'safe' | 'warn'

interface Stat {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  accent: Accent
  valueClass?: string
  meter?: number
}

const ACCENTS: Record<Accent, { neon: string; line: string; bar: string }> = {
  info: { neon: 'neon-info', line: 'from-info/80', bar: 'bg-info shadow-[0_0_10px_var(--info)]' },
  threat: { neon: 'neon-threat', line: 'from-threat/90', bar: 'bg-threat shadow-[0_0_10px_var(--threat)]' },
  safe: { neon: 'neon-safe', line: 'from-safe/80', bar: 'bg-safe shadow-[0_0_10px_var(--safe)]' },
  warn: { neon: 'neon-warn', line: 'from-warn/80', bar: 'bg-warn shadow-[0_0_10px_var(--warn)]' },
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
      accent: 'info',
    },
    {
      label: 'Threats Today',
      value: String(threatsToday),
      sub: `${activeCount} active · ${reviewCount} in review`,
      icon: TriangleAlert,
      accent: activeCount > 0 ? 'threat' : 'warn',
      valueClass: activeCount > 0 ? 'text-threat text-glow-threat' : undefined,
    },
    {
      label: 'Resolved Incidents',
      value: String(resolved),
      sub: 'Archived to audit log',
      icon: CircleCheck,
      accent: 'safe',
    },
    {
      label: 'System Accuracy',
      value: `${accuracy.toFixed(1)}%`,
      sub: 'Rolling model precision',
      icon: Gauge,
      accent: 'safe',
      valueClass: 'text-safe text-glow-safe',
      meter: accuracy,
    },
  ]

  return (
    <section aria-label="Quick statistics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((s) => {
        const a = ACCENTS[s.accent]
        return (
          <div
            key={s.label}
            className="panel group relative overflow-hidden rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5 sm:p-5"
          >
            <span
              aria-hidden="true"
              className={cn('absolute inset-x-5 top-0 h-px bg-gradient-to-r to-transparent', a.line)}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.22em] text-muted-foreground">
                {s.label}
              </p>
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', a.neon)}>
                <s.icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4 h-10 overflow-hidden sm:h-11">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={s.value}
                  initial={{ y: 22, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -22, opacity: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className={cn('tabular text-3xl font-bold tracking-tight text-white sm:text-4xl', s.valueClass)}
                >
                  {s.value}
                </motion.p>
              </AnimatePresence>
            </div>
            {s.meter !== undefined ? (
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
                <div className={cn('h-full rounded-full', a.bar)} style={{ width: `${s.meter}%` }} />
              </div>
            ) : null}
            <p className="mt-2.5 truncate text-xs text-muted-foreground">{s.sub}</p>
          </div>
        )
      })}
    </section>
  )
}
