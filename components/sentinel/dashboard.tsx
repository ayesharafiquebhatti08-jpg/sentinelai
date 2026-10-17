'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { History, LayoutDashboard, Loader2, ShieldAlert, Truck, CheckCircle2, Cpu, Flame, Shield, Car, Users, HelpCircle } from 'lucide-react'
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
type ThreatFilter = 'all' | 'critical' | 'responding' | 'review' | 'fire' | 'intrusion' | 'collision' | 'violence'

const AMBIENT_INTERVAL_MS = 35_000

export function Dashboard() {
  const state = useSentinel()
  const now = useNow()
  const [view, setView] = useState<View>('dashboard')
  const [threatFilter, setThreatFilter] = useState<ThreatFilter>('critical')

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

  const activeThreats = state.incidents.filter((i) => i.queue === 'active' && !i.dispatchedAt)
  const activeResponses = state.incidents.filter((i) => i.dispatchedAt || i.onSiteAt || i.resolvingAt || i.closingAt)
  const reviewQueue = state.incidents.filter((i) => i.queue === 'review')

  // Filtered incidents based on user's tab selection
  const filteredIncidents = state.incidents.filter((i) => {
    if (threatFilter === 'critical') return i.queue === 'active' && !i.dispatchedAt
    if (threatFilter === 'responding') return Boolean(i.dispatchedAt || i.onSiteAt || i.resolvingAt || i.closingAt)
    if (threatFilter === 'review') return i.queue === 'review'
    if (threatFilter === 'fire') return i.type === 'fire'
    if (threatFilter === 'intrusion') return i.type === 'intrusion'
    if (threatFilter === 'collision') return i.type === 'collision'
    if (threatFilter === 'violence') return i.type === 'violence'
    return true
  })

  return (
    <div className="relative min-h-screen bg-background">
      <div aria-hidden="true" className="command-glow pointer-events-none fixed inset-0" />
      <div aria-hidden="true" className="command-grid pointer-events-none fixed inset-0" />

      <div className="relative">
        <TopNav />

        <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-6 md:px-8">
          {/* Live AI Neural Cognition Ticker */}
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
                  { id: 'dashboard', label: 'Mission Control', short: 'Control', icon: LayoutDashboard, badge: stats.activeCount },
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
            <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <SimulationPanel ambient={state.ambient} />

              {/* INTERACTIVE CATEGORY SELECTOR TABS (Solves clutter) */}
              <div className="panel flex flex-wrap items-center gap-2 rounded-2xl p-3 border border-border/80">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2">
                  Filter Category:
                </span>
                {[
                  { id: 'critical', label: 'Critical Active', icon: ShieldAlert, count: activeThreats.length, tone: 'text-threat' },
                  { id: 'responding', label: 'Teams On-Site', icon: Truck, count: activeResponses.length, tone: 'text-warn' },
                  { id: 'review', label: 'Human Review', icon: CheckCircle2, count: reviewQueue.length, tone: 'text-info' },
                  { id: 'fire', label: 'Smoke / Fire', icon: Flame, count: state.incidents.filter(i => i.type === 'fire').length },
                  { id: 'intrusion', label: 'Intrusion', icon: Shield, count: state.incidents.filter(i => i.type === 'intrusion').length },
                  { id: 'collision', label: 'Collision', icon: Car, count: state.incidents.filter(i => i.type === 'collision').length },
                  { id: 'violence', label: 'Violence', icon: Users, count: state.incidents.filter(i => i.type === 'violence').length },
                  { id: 'all', label: 'View All', icon: HelpCircle, count: state.incidents.length },
                ].map((tab) => {
                  const active = threatFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setThreatFilter(tab.id as ThreatFilter)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl px-3.5 py-2 font-mono text-xs font-semibold transition-all',
                        active
                          ? 'bg-white/10 text-white shadow-md border border-white/20'
                          : 'bg-black/30 text-muted-foreground hover:bg-white/[0.05] hover:text-white border border-border/40',
                      )}
                    >
                      <tab.icon className={cn('size-3.5', tab.tone)} />
                      <span>{tab.label}</span>
                      <span className="rounded-full bg-black/50 px-1.5 py-0.2 text-[10px] text-white/80 tabular">
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* FOCUSED INCIDENT GRID SECTION */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <ShieldAlert className="size-4 text-threat" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold tracking-tight text-white capitalize">
                        {threatFilter === 'critical' && 'Tier 1: Critical Active Threats'}
                        {threatFilter === 'responding' && 'Tier 2: Active Responses & Teams On-Site'}
                        {threatFilter === 'review' && 'Human-in-the-Loop Review Queue'}
                        {threatFilter === 'fire' && 'Smoke & Fire Incident Feeds'}
                        {threatFilter === 'intrusion' && 'Intrusion & Unauthorized Access Feeds'}
                        {threatFilter === 'collision' && 'Vehicle Collision & Traffic Feeds'}
                        {threatFilter === 'violence' && 'Aggressive Crowd & Violence Feeds'}
                        {threatFilter === 'all' && 'All System Incidents'}
                      </h2>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Showing {filteredIncidents.length} matching operational items
                      </p>
                    </div>
                  </div>
                </div>

                {filteredIncidents.length === 0 ? (
                  <div className="panel rounded-2xl border border-border/60 bg-black/20 p-12 text-center font-mono text-xs text-muted-foreground space-y-2">
                    <p className="text-sm font-semibold text-white">No incidents found in this category.</p>
                    <p>Select another category tab above or trigger a simulation.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredIncidents.map((incident) => (
                      <ThreatCard key={incident.id} incident={incident} now={now} />
                    ))}
                  </div>
                )}
              </section>

              {/* LIVE ZONE CAMERA GRID */}
              <section className="space-y-4 pt-4">
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
