'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Inbox, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REVIEW_THRESHOLD } from '@/lib/sentinel/scenarios'
import type { Incident } from '@/lib/sentinel/types'
import { NeonBadge } from './neon-badge'
import { ThreatCard } from './threat-card'

type Filter = 'all' | 'critical' | 'review'

export function ThreatFeed({ incidents, now }: { incidents: Incident[]; now: number }) {
  const [filter, setFilter] = useState<Filter>('all')

  const critical = incidents.filter((i) => i.queue === 'active')
  const review = incidents.filter((i) => i.queue === 'review')

  const tabs: { id: Filter; label: string; count: number; countClass: string }[] = [
    { id: 'all', label: 'All Alerts', count: incidents.length, countClass: 'text-white' },
    { id: 'critical', label: 'Critical Threats', count: critical.length, countClass: 'text-threat text-glow-threat' },
    { id: 'review', label: 'Low-Priority / Review', count: review.length, countClass: 'text-info' },
  ]

  const visible = filter === 'all' ? incidents : filter === 'critical' ? critical : review

  return (
    <section
      aria-labelledby="feed-heading"
      className="panel flex min-h-[560px] flex-col overflow-hidden rounded-2xl xl:h-[calc(100vh-6.5rem)] xl:min-h-0"
    >
      <div className="border-b border-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="feed-heading" className="text-[15px] font-semibold tracking-tight text-white">
              Live Threat Detection & Triage
            </h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              AI triage · {critical.length} open · {review.length} queued
            </p>
          </div>
          <NeonBadge tone="threat" dot pulse size="xs">
            Live
          </NeonBadge>
        </div>

        <div role="tablist" aria-label="Filter alerts" className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-border bg-black/30 p-1">
          {tabs.map((tab) => {
            const selected = filter === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'relative flex flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2',
                  selected ? 'text-white' : 'text-muted-foreground hover:text-white',
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="feed-tab"
                    className="absolute inset-0 rounded-lg bg-white/[0.06] ring-1 ring-inset ring-white/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <span
                  className={cn(
                    'tabular relative text-xl font-bold leading-none tracking-tight',
                    tab.count > 0 ? tab.countClass : 'text-muted-foreground/60',
                  )}
                >
                  {tab.count}
                </span>
                <span className="relative font-mono text-[9px] font-medium uppercase leading-tight tracking-[0.14em]">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>

        <AnimatePresence initial={false}>
          {filter === 'review' && (
            <motion.p
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden rounded-xl border border-info/25 bg-info/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-info/90"
            >
              {`Detections below ${REVIEW_THRESHOLD}% confidence are auto-routed here instead of triggering a full alert. A human operator verifies footage before any escalation.`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((i) => (
            <ThreatCard key={i.id} incident={i} now={now} />
          ))}
        </AnimatePresence>

        {visible.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full min-h-64 flex-col items-center justify-center gap-4 text-center"
          >
            <span className="neon-safe flex size-14 items-center justify-center rounded-2xl">
              {filter === 'review' ? (
                <Inbox className="size-6" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-6" aria-hidden="true" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                {filter === 'review' ? 'Review queue is empty' : 'All zones secure'}
              </p>
              <p className="mx-auto mt-1.5 max-w-64 text-xs leading-relaxed text-muted-foreground">
                Use the simulation controls to inject a test threat into the AI pipeline.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
