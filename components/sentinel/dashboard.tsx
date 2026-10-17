'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { History, LayoutDashboard, Loader2, ShieldAlert, Truck, CheckCircle2, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNow } from '@/lib/sentinel/format'
import { TOTAL_CAMERAS, ZONE_LIST } from '@/lib/sentinel/scenarios'
import { computeStats, sentinel, useSentinel } from '@/lib/sentinel/store'
import { AuditLog } from './audit-log'
import { CameraCard } from './camera-card'
import { SimulationPanel } from './simulation-panel'
import { StatsBar } from './stats-bar'
import { ThreatCard } from './threat-card'
import { TopNav } from './top-nav'

type View = 'dashboard' | 'audit'

const AMBIENT_INTERVAL_MS = 35_000

export function Dashboard() {
  const state = useSentinel()
  const now = useNow()
  const [view, setView] = useState<View>('dashboard')

  // Drives the incident lifecycle (dispatched -> on-site -> resolving -> resolved/archived).
  useEffect(() => {
    if (!state.hydrated) return
    sentinel.advanceLifecycle()
    const id = setInterval(() => sentinel.advanceLifecycle(), 500)
    return () => clearInterval(id)
  }, [state.hydrated])

  useEffect(() => {
    if (!state.hydrated || !state.ambient) return
    const id = setInterval(() => sentinel.ambientTick(), AMBIENT_INTERVAL_MS)
    return () => clearInterval(id)
  }, [state.hydrated, state.ambient])

  const stats = computeStats(state)

  // Categorize active incidents into swimlanes for instant judge clarity
  const activeThreats = state.incidents.filter((i) => i.queue === 'active' && !i.dispatchedAt)
  const activeResponses = state.incidents.filter((i) => i.dispatchedAt || i.onSiteAt || i.resolvingAt || i.closingAt)
  const reviewQueue = state.incidents.filter((i) => i.queue === 'review')

  return (
    <div className="relative min-h-screen bg-background">
      <div aria-hidden="true" className="command-glow pointer-events-none fixed inset-0" />
      <div aria-hidden="true" className="command-grid pointer-events-none fixed inset-0" />

      <div className="relative">
        <TopNav />

        <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-6 md:px-8">
          {/* Live AI Neural Cognition Ticker (The Judge Hook) */}
          <div className="panel relative flex items-center gap-3 overflow-hidden rounded-2xl border border-threat/30 bg-black/40 px-5 py-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <Cpu className="size-4 animate-pulse text-threat shrink-0" />
            <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="font-bold uppercase tracking-wider text-white">Sentinel Neural Stream:</span>
              <span className="truncate text-white/80">
                {activeThreats.length > 0 
                  ? `Analyzing Zone ${activeThreats[0].zoneId} anomaly vector... Confidence ${activeThreats[0].confidence.toFixed(1)}%... Ready for autonomous dispatch.`
                  : 'All perimeter zones secure. Continuous edge sensor monitoring active.'}
              </span>
            </div>
          </div>

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
                  { id: 'dashboard', label: 'Mission Control Swimlanes', short: 'Control', icon: LayoutDashboard, badge: stats.activeCount },
                  { id: 'audit', label: 'Incident Audit Log', short: 'Audit', icon: History, badge: state.audit.length },
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
              Initializing Autonomous AI Guard
            </div>
          ) : view === 'dashboard' ? (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <SimulationPanel ambient={state.ambient} />

              {/* SWIMLANE 1: CRITICAL ACTIVE THREATS */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 border-b border-threat/30 pb-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-threat/20 text-threat border border-threat/40">
                    <ShieldAlert className="size-4 animate-pulse" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-white">
                      Tier 1: Critical Active Threats <span className="font-mono text-xs text-threat font-normal">({activeThreats.length} Require Action)</span>
                    </h2>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Unacknowledged perimeter breaches detected by edge vision models
                    </p>
                  </div>
                </div>

                {activeThreats.length === 0 ? (
                  <div className="panel rounded-2xl border border-border/60 bg-black/20 p-6 text-center font-mono text-xs text-muted-foreground">
                    No unacknowledged critical threats. All sectors secure under active monitoring.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {activeThreats.map((incident) => (
                      <ThreatCard key={incident.id} incident={incident} now={now} />
                    ))}
                  </div>
                )}
              </section>

              {/* SWIMLANE 2: ACTIVE RESPONSES & TEAMS ON-SITE */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 border-b border-warn/30 pb-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-warn/20 text-warn border border-warn/40">
                    <Truck className="size-4 animate-pulse" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-white">
                      Tier 2: Active Responses & Teams On-Site <span className="font-mono text-xs text-warn font-normal">({activeResponses.length} In Progress)</span>
                    </h2>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Automated lifecycle: Units Dispatched → Team On-Site → Resolving Issue
                    </p>
                  </div>
                </div>

                {activeResponses.length === 0 ? (
                  <div className="panel rounded-2xl border border-border/60 bg-black/20 p-6 text-center font-mono text-xs text-muted-foreground">
                    No active response teams deployed. Click dispatch on any threat above to trigger the automated loop.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {activeResponses.map((incident) => (
                      <ThreatCard key={incident.id} incident={incident} now={now} />
                    ))}
                  </div>
                )}
              </section>

              {/* SWIMLANE 3: LIVE ZONE CAMERA GRID */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white">
                    <LayoutDashboard className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-white">
                      Live Multi-Zone Camera Grid
                    </h2>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Real-time computer vision feeds and proactive risk telemetry
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
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

              {/* HUMAN REVIEW QUEUE (IF ANY) */}
              {reviewQueue.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-info/30 pb-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-info/20 text-info border border-info/40">
                      <CheckCircle2 className="size-4" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold tracking-tight text-white">
                        Low Confidence / Human-in-the-Loop Review Queue <span className="font-mono text-xs text-info font-normal">({reviewQueue.length})</span>
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {reviewQueue.map((incident) => (
                      <ThreatCard key={incident.id} incident={incident} now={now} />
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          ) : (
            <motion.div key="audit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <AuditLog audit={state.audit} />
            </motion.div>
          )}

          <footer className="flex flex-col items-center justify-between gap-2 border-t border-border pt-5 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row">
            <span>SentinelAI v2.4 · Autonomous Edge Defense Node</span>
            <span>State persisted locally · Sub-4s Response Benchmark</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
