'use client'

import { motion } from 'motion/react'
import { FlaskConical, HelpCircle, RotateCcw, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { THREAT_ICONS } from '@/lib/sentinel/format'
import { SCENARIO_LIST, ZONES } from '@/lib/sentinel/scenarios'
import { sentinel } from '@/lib/sentinel/store'

export function SimulationPanel({ ambient }: { ambient: boolean }) {
  return (
    <section
      aria-labelledby="sim-heading"
      className="relative overflow-hidden rounded-xl border border-border bg-card/70"
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md border border-warn/30 bg-warn/10 text-warn">
            <FlaskConical className="size-3.5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="sim-heading" className="text-sm font-semibold">
              Threat Simulation & Control
            </h2>
            <p className="text-xs text-muted-foreground">Inject test events into the live AI pipeline</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <span>Ambient AI noise</span>
            <button
              type="button"
              role="switch"
              aria-checked={ambient}
              onClick={() => sentinel.setAmbient(!ambient)}
              className={cn(
                'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
                ambient ? 'bg-safe' : 'bg-muted',
              )}
            >
              <span className="sr-only">Toggle ambient detections</span>
              <span
                className={cn(
                  'inline-block size-3 rounded-full bg-white shadow transition-transform',
                  ambient ? 'translate-x-3.5' : 'translate-x-0.5',
                )}
              />
            </button>
          </label>
          <button
            type="button"
            onClick={() => sentinel.resetDemo()}
            className="flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-2"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            Reset demo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 xl:grid-cols-5">
        {SCENARIO_LIST.map((s) => {
          const Icon = THREAT_ICONS[s.type]
          return (
            <motion.button
              key={s.type}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => sentinel.simulate(s.type)}
              className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-threat/25 bg-threat/[0.06] px-3 py-2.5 text-left transition-all hover:border-threat/60 hover:bg-threat/[0.12] hover:shadow-[0_0_24px_-8px] hover:shadow-threat focus-visible:outline-2 focus-visible:outline-threat"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-threat/15 text-threat transition-colors group-hover:bg-threat group-hover:text-white">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium leading-snug text-foreground">{s.buttonLabel}</span>
                <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <Zap className="size-2.5" aria-hidden="true" />
                  Zone {s.zoneId} · {ZONES[s.zoneId].name.split(' ')[0]}
                </span>
              </span>
            </motion.button>
          )
        })}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => sentinel.simulateUncertain()}
          className="group flex items-center gap-3 rounded-lg border border-info/25 bg-info/[0.05] px-3 py-2.5 text-left transition-all hover:border-info/60 hover:bg-info/[0.1] focus-visible:outline-2 focus-visible:outline-info sm:col-span-2 xl:col-span-1"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-info/15 text-info transition-colors group-hover:bg-info group-hover:text-background">
            <HelpCircle className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-medium leading-snug">Simulate Uncertain Detection</span>
            <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{'<50% conf → Review Queue'}</span>
          </span>
        </motion.button>
      </div>
    </section>
  )
}
