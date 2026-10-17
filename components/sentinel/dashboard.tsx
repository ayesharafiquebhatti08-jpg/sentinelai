'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { History, LayoutDashboard, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNow } from '@/lib/sentinel/format'
import { TOTAL_CAMERAS, ZONE_LIST } from '@/lib/sentinel/scenarios'
import { computeStats, sentinel, useSentinel } from '@/lib/sentinel/store'
import { AuditLog } from './audit-log'
import { CameraCard } from './camera-card'
import { SimulationPanel } from './simulation-panel'
import { StatsBar } from './stats-bar'
import { ThreatFeed } from './threat-feed'
import { TopNav } from './top-nav'

type View = 'dashboard' | 'audit'

const AMBIENT_INTERVAL_MS = 35_000

export function Dashboard() {
  const state = useSentinel()
  const now = useNow()
  const [view, setView] = useState<View>('dashboard')

  useEffect(() => {
    if (!state.hydrated || !state.ambient) return
    const id = setInterval(() => sentinel.ambientTick(), AMBIENT_INTERVAL_MS)
    return () => clearInterval(id)
  }, [state.hydrated, state.ambient])

  const stats = computeStats(state)

  return (
    <div className="min-h-screen bg-background grid-backdrop">
      <TopNav />

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 md:px-6">
        <StatsBar
          cameras={TOTAL_CAMERAS}
          threatsToday={stats.threatsToday}
          resolved={stats.resolved}
          accuracy={stats.accuracy}
          activeCount={stats.activeCount}
          reviewCount={stats.reviewCount}
        />

        <nav aria-label="Primary views" className="flex items-center gap-1 rounded-lg border border-border bg-card/50 p-1 sm:w-fit">
          {(
            [
              { id: 'dashboard', label: 'Command Dashboard', icon: LayoutDashboard, badge: stats.activeCount },
              { id: 'audit', label: 'Incident History & Audit Log', icon: History, badge: state.audit.length },
            ] as const
          ).map((t) => {
            const selected = view === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setView(t.id)}
                aria-current={selected ? 'page' : undefined}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:flex-none',
                  selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="primary-view"
                    className="absolute inset-0 rounded-md border border-border bg-secondary"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <t.icon className="relative size-3.5" aria-hidden="true" />
                <span className="relative">
                  <span className="sm:hidden">{t.id === 'dashboard' ? 'Dashboard' : 'Audit Log'}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </span>
                <span
                  className={cn(
                    'relative rounded px-1.5 font-mono text-[10px] tabular',
                    t.id === 'dashboard' && t.badge > 0 ? 'bg-threat text-white' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {t.badge}
                </span>
              </button>
            )
          })}
        </nav>

        {!state.hydrated ? (
          <div className="flex h-96 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Initializing AI guard…
          </div>
        ) : view === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_440px]"
          >
            <div className="min-w-0 space-y-4">
              <SimulationPanel ambient={state.ambient} />
              <section aria-labelledby="zones-heading">
                <div className="mb-2.5 flex items-center justify-between">
                  <h2 id="zones-heading" className="text-sm font-semibold">
                    Live Multi-Zone Camera & Sensor Grid
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {ZONE_LIST.length} zones · {TOTAL_CAMERAS} cams
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {ZONE_LIST.map((zone) => {
                    const zoneIncidents = state.incidents.filter((i) => i.zoneId === zone.id)
                    return (
                      <CameraCard
                        key={zone.id}
                        zone={zone}
                        now={now}
                        threat={zoneIncidents.find((i) => i.queue === 'active')}
                        reviewCount={zoneIncidents.filter((i) => i.queue === 'review').length}
                      />
                    )
                  })}
                </div>
              </section>
            </div>
            <div className="xl:sticky xl:top-[4.5rem] xl:self-start">
              <ThreatFeed incidents={state.incidents} now={now} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="audit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <AuditLog audit={state.audit} />
          </motion.div>
        )}

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-border pt-4 pb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:flex-row">
          <span>SentinelAI v2.4 · Edge inference node EU-01</span>
          <span>State persisted locally · Human-in-the-loop below 50% confidence</span>
        </footer>
      </main>
    </div>
  )
}
