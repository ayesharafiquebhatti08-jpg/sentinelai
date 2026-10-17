'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { History, LayoutDashboard, Loader2, ShieldAlert, Truck, CheckCircle2, Cpu, Flame, Shield, Car, Users, HelpCircle, EyeOff, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNow } from '@/lib/sentinel/format'
import { TOTAL_CAMERAS, ZONE_LIST } from '@/lib/sentinel/scenarios'
import { computeStats, sentinel, useSentinel } from '@/lib/sentinel/store'
import { AuditLog } from './audit-log'
import { CameraCard } from './camera-card'
import { SimulationPanel } from './simulation-panel'
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
    <div className="min-h-screen bg-[#030508] text-slate-100 selection:bg-rose-500/30 selection:text-white">
      {/* Subtle atmospheric glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/30 via-[#030508] to-[#010203]" />

      <div className="relative z-10">
        <TopNav />

        <main className="mx-auto max-w-[1440px] space-y-8 px-6 py-8 md:px-12">
          
          {/* HEADER HERO SECTION (Clean & Minimalist) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.06] pb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px] uppercase tracking-wider">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                Autonomous Threat Prevention System
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                Mission Control Hub
              </h1>
              <p className="font-mono text-xs text-slate-400 max-w-xl">
                Real-time edge telemetry, active multi-zone computer vision grids, and zero-latency response protocols.
              </p>
            </div>

            {/* Quick Metrics (Borderless & Clean) */}
            <div className="flex items-center gap-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl px-6 py-4 backdrop-blur-xl">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Active Cams</p>
                <p className="text-2xl font-bold font-mono text-white">{TOTAL_CAMERAS}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Threats Today</p>
                <p className="text-2xl font-bold font-mono text-rose-400">{stats.threatsToday}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">System Accuracy</p>
                <p className="text-2xl font-bold font-mono text-emerald-400">{stats.accuracy.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* SIMULATION & CONTROLS */}
          <SimulationPanel ambient={state.ambient} />

          {/* LIVE MULTI-ZONE CAMERA GRID */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Radio className="size-4 text-rose-500 animate-pulse" />
                Live Perimeter Surveillance Feeds
              </h2>
              <span className="font-mono text-xs text-slate-500">4 Zones Online</span>
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
          <div className="rounded-3xl border border-white/[0.08] bg-black/40 p-6 backdrop-blur-2xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-300 font-semibold flex items-center gap-2">
                <Cpu className="size-4 text-rose-400" />
                Inspect Threat Categories & Queues:
              </span>
              {threatFilter !== 'none' && (
                <button
                  type="button"
                  onClick={() => setThreatFilter('none')}
                  className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-300 hover:text-white transition-colors border border-white/10"
                >
                  <EyeOff className="size-3.5" />
                  <span>Close Grid View</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5">
              {[
                { id: 'critical', label: 'Critical Active', icon: ShieldAlert, count: activeThreats.length, tone: 'text-rose-400' },
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
                      'flex items-center gap-2.5 rounded-2xl px-4 py-3 font-mono text-xs font-medium transition-all duration-200',
                      active
                        ? 'bg-white/15 text-white shadow-[0_0_25px_rgba(255,255,255,0.1)] border border-white/30 scale-[1.02]'
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
                    {threatFilter === 'critical' && 'Critical Active Threats'}
                    {threatFilter === 'responding' && 'Active Responses & Teams On-Site'}
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

          {/* AUDIT LOG VIEW TOGGLE */}
          <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView(view === 'dashboard' ? 'audit' : 'dashboard')}
                className="flex items-center gap-2 font-mono text-xs text-slate-400 hover:text-white bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl transition-colors"
              >
                <History className="size-4" />
                <span>{view === 'dashboard' ? 'View Full Incident Audit Log' : 'Back to Mission Control'}</span>
              </button>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
              SentinelAI Autonomous Node · UBIT Code//Connect '26
            </span>
          </div>

          {view === 'audit' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4">
              <AuditLog audit={state.audit} />
            </motion.div>
          )}

        </main>
      </div>
    </div>
  )
}
