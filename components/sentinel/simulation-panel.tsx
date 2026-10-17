'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronUp, FlaskConical, HelpCircle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { THREAT_ICONS } from '@/lib/sentinel/format'
import { SCENARIO_LIST } from '@/lib/sentinel/scenarios'
import { sentinel } from '@/lib/sentinel/store'
import type { ThreatType } from '@/lib/sentinel/types'

const SHORT_LABELS: Record<ThreatType, string> = {
  fire: 'Smoke / Fire',
  intrusion: 'Intrusion / Theft',
  accident: 'Accident / Collision',
  violence: 'Crowd / Violence',
}

const PILL_BASE =
  'group relative flex h-12 items-center gap-2.5 rounded-xl border border-border bg-gradient-to-b from-white/[0.05] to-white/[0.01] pl-1.5 pr-3 text-left transition-all duration-300 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2'

export function SimulationPanel({ ambient }: { ambient: boolean }) {
  const [open, setOpen] = useState(true)

  return (
    <section aria-labelledby="sim-heading" className="panel rounded-2xl">
      <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:gap-5">
        <div className="flex items-center gap-3 xl:w-48 xl:shrink-0">
          <span className="neon-warn flex size-9 shrink-0 items-center justify-center rounded-xl">
            <FlaskConical className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="sim-heading" className="text-sm font-semibold tracking-tight text-white">
              Threat Simulation
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Control Panel</p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="sim-actions"
              key="actions"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="-m-1 min-w-0 flex-1 overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-2 p-1 sm:grid-cols-2 lg:grid-cols-5">
                {SCENARIO_LIST.map((s) => {
                  const Icon = THREAT_ICONS[s.type]
                  return (
                    <motion.button
                      key={s.type}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => sentinel.simulate(s.type)}
                      aria-label={s.buttonLabel}
                      title={s.buttonLabel}
                      className={cn(
                        PILL_BASE,
                        'hover:border-threat/50 hover:from-threat/15 hover:to-threat/[0.03] hover:shadow-[0_0_26px_-8px_var(--threat)] focus-visible:outline-threat',
                      )}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-threat/10 text-threat ring-1 ring-inset ring-threat/30 transition-all duration-300 group-hover:bg-threat group-hover:text-white group-hover:shadow-[0_0_18px_var(--threat)]">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-white">{SHORT_LABELS[s.type]}</span>
                        <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                          Zone {s.zoneId}
                        </span>
                      </span>
                    </motion.button>
                  )
                })}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sentinel.simulateUncertain()}
                  aria-label="Simulate Uncertain Detection, below 50% confidence, routed to review queue"
                  title="Simulate Uncertain Detection (<50% confidence → Review Queue)"
                  className={cn(
                    PILL_BASE,
                    'hover:border-info/50 hover:from-info/15 hover:to-info/[0.03] hover:shadow-[0_0_26px_-8px_var(--info)] focus-visible:outline-info sm:col-span-2 lg:col-span-1',
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info ring-1 ring-inset ring-info/30 transition-all duration-300 group-hover:bg-info group-hover:text-background group-hover:shadow-[0_0_18px_var(--info)]">
                    <HelpCircle className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-white">Uncertain Signal</span>
                    <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      {'<50% → Review'}
                    </span>
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 xl:ml-auto xl:shrink-0">
          <div className="flex h-10 flex-1 items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.02] px-3 xl:flex-none">
            <span id="ambient-label" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Ambient AI
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={ambient}
              aria-labelledby="ambient-label"
              onClick={() => sentinel.setAmbient(!ambient)}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus-visible:outline-2',
                ambient ? 'bg-safe shadow-[0_0_14px_-2px_var(--safe)]' : 'bg-white/10',
              )}
            >
              <span
                className={cn(
                  'inline-block size-4 rounded-full bg-white shadow transition-transform duration-300',
                  ambient ? 'translate-x-[18px]' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
          <button
            type="button"
            onClick={() => sentinel.resetDemo()}
            className="flex h-10 items-center gap-2 rounded-xl border border-border bg-white/[0.02] px-3 text-xs font-medium text-muted-foreground transition-all hover:border-white/20 hover:bg-white/[0.05] hover:text-white focus-visible:outline-2"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="sim-actions"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white/[0.02] text-muted-foreground transition-all hover:border-white/20 hover:bg-white/[0.05] hover:text-white focus-visible:outline-2"
          >
            <ChevronUp className={cn('size-4 transition-transform duration-300', !open && 'rotate-180')} aria-hidden="true" />
            <span className="sr-only">{open ? 'Collapse' : 'Expand'} simulation controls</span>
          </button>
        </div>
      </div>
    </section>
  )
}
