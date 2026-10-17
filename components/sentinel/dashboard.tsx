'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { History, LayoutDashboard, Loader2, ShieldAlert, Truck, CheckCircle2, Cpu, Flame, Shield, Car, Users, HelpCircle, EyeOff } from 'lucide-react'
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
type ThreatFilter = 'none' | 'critical' | 'responding' | 'review' | 'fire' | 'intrusion' | 'collision' | 'violence' | 'all'

const AMBIENT_INTERVAL_MS = 35_000

export function Dashboard() {
  const state = useSentinel()
  const now = useNow()
  const [view, setView] = useState<View>('dashboard')
  const [threatFilter, setThreatFilter] = useState<ThreatFilter>('none')

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
    <div className="relative min-h-screen bg-[#07090e] text-slate-100 selection:bg-threat/30 selection:text-white">
      {/* Cinematic ambient background lighting */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#07090e] to-[#040507]" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-[0.015] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10">
        <TopNav />

        <main className="mx-auto max-w-[1500px] space-y-10 px-4 py-8 md:px-10">
          {/* Cinematic AI Cognition Banner */}
          <div className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-3.5 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-threat/40 to-transparent" />
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex size-2 rounded-full bg-threat animate-ping shrink-0" />
              <Cpu className="size-4 text-threat shrink-0" />
              <p className="font-mono text-xs tracking-wide text-slate-300 truncate">
                <span className="text-white font-bold uppercase tracking-wider mr-2">Neural Telemetry:</span>
                {activeThreats.length > 0 
                  ? `Analyzing Zone ${activeThreats[0].zoneId} vector... Confidence ${activeThreats[0].confidence.toFixed(1)}%... Ready for dispatch.`
                  : 'All perimeter zones secure under autonomous edge surveillance.'}
              </p>
            </div>
            <span className="hidden font-mono text-[10px] tracking-widest text-slate-500 md:inline">SYSTEM SECURE</span>
          </div>

          <StatsBar
            cameras={TOTAL_CAMERAS}
            threatsToday={stats.threatsToday}
            resolved={stats.resolved}
            accuracy={stats.accuracy}
            activeCount={stats.activeCount}
            reviewCount={stats.reviewCount}
          />

          {/* Navigation Views & Status */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-6">
            <nav aria-label="Primary views" className="flex items-center gap-1.5 rounded-2xl bg-white/[0.03] p-1.5 border border-white/[0.06] backdrop-blur-md sm:w-fit">
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
                      'relative flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-medium transition-all focus-visible:outline-2 sm:flex-none',
                      selected ? 'text-white' : 'text-slate-400 hover:text-slate-200',
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="primary-view-pill"
                        className="absolute inset-0 rounded-xl bg-white/[0.08] shadow-inner ring-1 ring-white/10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <t.icon className="relative size-4 text-slate-300" aria-hidden="true" />
                    <span className="relative font-mono tracking-wide">
                      <span className="sm:hidden">{t.short}</span>
                      <span className="hidden sm:inline">{t.label}</span>
                    </span>
                    <span
                      className={cn(
                        'tabular relative min-w-5 rounded-full px-1.5 py-0.5 text-center font-mono text-[10px] font-bold',
                        alert ? 'bg-threat text-white shadow-[0_0_12px_var(--threat)]' : 'bg-white/10 text-slate-300',
                      )}
                    >
                      {t.badge}
                    </span>
                  </button>
                )
              })}
            </nav>
            <div className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 md:flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Edge Node EU-01 · {ZONE_LIST.length} Zones · {TOTAL_CAMERAS} Cams
            </div>
          </div>

          {!state.hydrated ? (
            <div className="flex h-96 items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
              <Loader2 className="size-4 animate-spin text-threat" aria-hidden="true" />
              Initializing Autonomous AI Core...
            </div>
          ) : view === 'dashboard' ? (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <SimulationPanel ambient={state.ambient} />

              {/* LIVE MULTI-ZONE CAMERA GRID */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5">
                      <span className="size-2 rounded-full bg-threat" />
                      Live Surveillance & Camera Grid
                    </h2>
                    <p className="font-mono text-xs text-slate-400">Real-time computer vision feeds and active predictive risk telemetry</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
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

              {/* CLEAN CATEGORY INSPECTION BAR */}
              <div className="rounded-3xl border border-white/[0.08] bg-black/40 p-5 backdrop-blur-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    Quick Inspection Categories:
                  </span>
                  {threatFilter !== 'none' && (
                    <button
                      type="button"
                      onClick={() => setThreatFilter('none')}
                      className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-300 hover:text-white transition-colors border border-white/10"
                    >
                      <EyeOff className="size-3.5" />
                      <span>Hide Inspection Grid</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: 'critical', label: 'Critical Active', icon: ShieldAlert, count: activeThreats.length, tone: 'text-threat' },
                    { id: 'responding', label: 'Teams On-Site', icon: Truck, count: activeResponses.length, tone: 'text-amber-400' },
                    { id: 'review', label: 'Human Review', icon: CheckCircle2, count: reviewQueue.length, tone: 'text-sky-400' },
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
                        onClick={() => setThreatFilter(active ? 'none' : (tab.id as ThreatFilter))}
                        className={cn(
                          'flex items-center gap-2.5 rounded-2xl px-4 py-2.5 font-mono text-xs font-semibold transition-all duration-200',
                          active
                            ? 'bg-white/15 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/30 ring-1 ring-white/20 scale-[1.02]'
                            : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]',
                        )}
                      >
                        <tab.icon className={cn('size-4', tab.tone)} />
                        <span>{tab.label}</span>
                        <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-slate-200 tabular">
                          {tab.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* FOCUSED INSPECTION GRID (Appears ONLY when clicked) */}
              {threatFilter !== 'none' && (
                <motion.section 
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pt-4 border-t border-white/[0.08]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-white capitalize">
                        {threatFilter === 'critical' && 'Tier 1: Critical Active Threats'}
                        {threatFilter === 'responding' && 'Tier 2: Active Responses & Teams On-Site'}
                        {threatFilter === 'review' && 'Human-in-the-Loop Review Queue'}
                        {threatFilter === 'fire' && 'Smoke & Fire Incident Feeds'}
                        {threatFilter === 'intrusion' && 'Intrusion & Unauthorized Access Feeds'}
                        {threatFilter === 'collision' && 'Vehicle Collision & Traffic Feeds'}
                        {threatFilter === 'violence' && 'Aggressive Crowd & Violence Feeds'}
                        {threatFilter === 'all' && 'All System Incidents'}
                      </h3>
                      <p className="font-mono text-xs text-slate-400">
                        Showing {filteredIncidents.length} matching operational records
                      </p>
                    </div>
                  </div>

                  {filteredIncidents.length === 0 ? (
                    <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-16 text-center font-mono text-xs text-slate-400 space-y-3">
                      <p className="text-sm font-semibold text-white">No active records found in this category.</p>
                      <p>Select another category above or simulate an event.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {filteredIncidents.map((incident) => (
                        <ThreatCard key={incident.id} incident={incident} now={now} />
                      ))}
                    </div>
                  )}
                </motion.section>
              )}
            </motion.div>
          ) : (
            <motion.div key="audit" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <AuditLog audit={state.audit} />
            </motion.div>
          )}

          <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.08] pt-8 pb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 sm:flex-row">
            <span>SentinelAI v2.4 · Autonomous Edge Defense Node</span>
            <span>State persisted locally · Sub-4s Response Benchmark</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
