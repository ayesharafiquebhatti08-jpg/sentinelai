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
    <div className="relative min-h-screen bg-background">
      <div aria-hidden="true" className="command-glow pointer-events-none fixed inset-0" />
      <div aria-hidden="true" className="command-grid pointer-events-none fixed inset-0" />

      <div className="relative">
        <TopNav />

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 md:px-8">
          <StatsBar
            cameras={TOTAL_CAMERAS}
            threatsToday={stats.threatsToday}
            resolved={stats.resolved}
            accuracy={stats.accuracy}
            activeCount={stats.activeCount}
            reviewCount={stats.reviewCount}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Primary views" className="panel flex items-center gap-1 rounded-full p-1 sm:w-fit">
              {(
                [
                  { id: 'dashboard', label: 'Command Dashboard', short: 'Dashboard', icon: LayoutDashboard, badge: stats.activeCount },
                  { id: 'audit', label: 'Incident History & Audit Log', short: 'Audit Log', icon: History, badge: state.audit.length },
                ] as const
              ).map((t) => {
                const selected = view === t.id
                const alert = t.id === 'dashboard' && t.badge > 0
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setView(t.id)}
                    aria-current={selected ? 'page' : undefined}
                    className={cn(
                      'relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 sm:flex-none',
                      selected ? 'text-white' : 'text-muted-foreground hover:text-white',
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="primary-view"
                        className="absolute inset-0 rounded-full bg-white/[0.07] ring-1 ring-inset ring-white/10"
                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                      />
                    )}
                    <t.icon className="relative size-4" aria-hidden="true" />
                    <span className="relative">
                      <span className="sm:hidden">{t.short}</span>
                      <span className="hidden sm:inline">{t.label}</span>
                    </span>
                    <span
                      className={cn(
                        'tabular relative min-w-5 rounded-full px-1.5 py-px text-center font-mono text-[10px] font-bold',
                        alert ? 'neon-threat-solid' : 'bg-white/[0.06] text-muted-foreground',
                      )}
                    >
                      {t.badge}
                    </span>
                  </button>
                )
              })}
            </nav>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground md:block">
              Edge Node EU-01 · {ZONE_LIST.length} Zones · {TOTAL_CAMERAS} Cams
            </p>
          </div>

          {!state.hydrated ? (
            <div className="flex h-96 items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Initializing AI guard
            </div>
          ) : view === 'dashboard' ? (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <SimulationPanel ambient={state.ambient} />

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
                <section aria-labelledby="zones-heading" className="min-w-0">
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <h2 id="zones-heading" className="text-[15px] font-semibold tracking-tight text-white">
                        Live Multi-Zone Camera & Sensor Grid
                      </h2>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Computer vision · Thermal · Access control
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                <div className="xl:sticky xl:top-20 xl:self-start">
                  <ThreatFeed incidents={state.incidents} now={now} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="audit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <AuditLog audit={state.audit} />
            </motion.div>
          )}

          <footer className="flex flex-col items-center justify-between gap-2 border-t border-border pt-5 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row">
            <span>SentinelAI v2.4 · Edge inference node EU-01</span>
            <span>State persisted locally · Human-in-the-loop below 50% confidence</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
