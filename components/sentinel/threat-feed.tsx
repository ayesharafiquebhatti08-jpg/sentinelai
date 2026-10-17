'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Inbox, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REVIEW_THRESHOLD } from '@/lib/sentinel/scenarios'
import type { Incident } from '@/lib/sentinel/types'
import { ThreatCard } from './threat-card'

type Filter = 'all' | 'critical' | 'review'

export function ThreatFeed({ incidents, now }: { incidents: Incident[]; now: number }) {
  const [filter, setFilter] = useState<Filter>('all')

  const critical = incidents.filter((i) => i.queue === 'active')
  const review = incidents.filter((i) => i.queue === 'review')

  const tabs: { id: Filter; label: string; count: number; activeClass: string }[] = [
    { id: 'all', label: 'All Alerts', count: incidents.length, activeClass: 'bg-foreground text-background' },
    { id: 'critical', label: 'Critical Threats', count: critical.length, activeClass: 'bg-threat text-white' },
    { id: 'review', label: 'Low-Priority / Review', count: review.length, activeClass: 'bg-info text-background' },
  ]

  const visible = filter === 'all' ? incidents : filter === 'critical' ? critical : review

  return (
    <section
      aria-labelledby="feed-heading"
      className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card/50 xl:h-[calc(100vh-7.5rem)] xl:min-h-0"
    >
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="feed-heading" className="flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-threat opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-threat" />
            </span>
            Live Threat Detection & Triage
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Real-time</span>
        </div>

        <div role="tablist" aria-label="Filter alerts" className="mt-3 flex gap-1 overflow-x-auto rounded-lg bg-background/60 p-1">
          {tabs.map((t) => {
            const selected = filter === t.id
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => setFilter(t.id)}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="feed-tab"
                    className="absolute inset-0 rounded-md border border-border bg-card"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <span className="relative">{t.label}</span>
                <span
                  className={cn(
                    'relative min-w-5 rounded px-1 font-mono text-[10px] tabular',
                    t.count > 0 ? t.activeClass : 'bg-muted text-muted-foreground',
                  )}
                >
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        {filter === 'review' && (
          <p className="mt-2.5 rounded-md border border-info/20 bg-info/5 px-2.5 py-2 text-[11px] leading-relaxed text-info/90">
            {`Detections below ${REVIEW_THRESHOLD}% confidence are auto-routed here instead of triggering a full alert. A human operator verifies footage before any escalation.`}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((i) => (
            <ThreatCard key={i.id} incident={i} now={now} />
          ))}
        </AnimatePresence>

        {visible.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full min-h-60 flex-col items-center justify-center gap-3 text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-full border border-safe/25 bg-safe/10 text-safe">
              {filter === 'review' ? <Inbox className="size-5" aria-hidden="true" /> : <ShieldCheck className="size-5" aria-hidden="true" />}
            </span>
            <div>
              <p className="text-sm font-medium">
                {filter === 'review' ? 'Review queue is empty' : 'All zones secure'}
              </p>
              <p className="mt-1 max-w-64 text-xs text-muted-foreground">
                Use the simulation panel to inject a test threat into the AI pipeline.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
