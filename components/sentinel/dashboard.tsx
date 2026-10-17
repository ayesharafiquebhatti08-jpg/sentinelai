'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { History, LayoutDashboard, Loader2, ShieldAlert, Truck, CheckCircle2, Radio, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNow } from '@/lib/sentinel/format'
import { TOTAL_CAMERAS, ZONE_LIST } from '@/lib/sentinel/scenarios'
import { computeStats, sentinel, useSentinel } from '@/lib/sentinel/store'
import { AuditLog } from './audit-log'
import { CameraCard } from './camera-card'
import { ThreatCard } from './threat-card'
import { TopNav } from './top-nav'

type View = 'dashboard' | 'audit'
type ActiveTab = 'none' | 'critical' | 'responding' | 'review' | 'cameras'

const AMBIENT_INTERVAL_MS = 35_000

export function Dashboard() {
  const state = useSentinel()
  const now = useNow()
  const [view, setView] = useState<View>('dashboard')
  const [activeTab, setActiveTab] = useState<ActiveTab>('none')

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

  return (
    <div className="min-h-screen bg-[#030508] text-slate-100 selection:bg-rose-500/30 selection:text-white">
      {/* Subtle atmospheric gradient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#030508] to-[#010203]" />

      <div className="relative z-10">
        <TopNav />

        <main className="mx-auto max-w-[1300px] space-y-12 px-6 py-12 md:px-12">
          
          {/* HERO SECTION (Clean Code//Connect Style) */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs uppercase tracking-widest">
              <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
              Autonomous Threat Prevention Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              SENTINEL<span className="text-rose-500">AI</span>
            </h1>
            <p className="font-mono text-xs text-slate-400 leading-relaxed">
              Real-time edge threat detection, zero-latency automated response lifecycles, and autonomous facility surveillance.
            </p>
          </div>

          {/* VIEW SWITCHER (Dashboard vs Audit Log) */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-white/[0.03] p-1.5 border border-white/[0.06] backdrop-blur-md">
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-5 py-2 font-mono text-xs transition-all',
                  view === 'dashboard' ? 'bg-white/10 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
                )}
              >
                <LayoutDashboard className="size-4" />
                <span>Mission Control</span>
              </button>
              <button
                type="button"
                onClick={() => setView('audit')}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-5 py-2 font-mono text-xs transition-all',
                  view === 'audit' ? 'bg-white/10 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
                )}
              >
                <History className="size-4" />
                <span>Audit Log ({state.audit.length})</span>
              </button>
            </div>
          </div>

          {view === 'dashboard' ? (
            <div className="space-y-10">
              
              {/* THE 4 MAIN ENTRY CARDS (Clean, Spaced, Uncluttered) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card 1: Critical Threats */}
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'critical' ? 'none' : 'critical')}
                  className={cn(
                    'group text-left rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between h-48',
                    activeTab === 'critical' 
                      ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]' 
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <ShieldAlert className="size-5" />
                    </span>
                    <span className="font-mono text-2xl font-bold text-white tabular">
                      {activeThreats.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                      Critical Threats
                    </h3>
                    <p className="font-mono text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>Inspect active alerts</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </button>

                {/* Card 2: Teams On-Site */}
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'responding' ? 'none' : 'responding')}
                  className={cn(
                    'group text-left rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between h-48',
                    activeTab === 'responding' 
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' 
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Truck className="size-5" />
                    </span>
                    <span className="font-mono text-2xl font-bold text-white tabular">
                      {activeResponses.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      Teams On-Site
                    </h3>
                    <p className="font-mono text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>View response loop</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </button>

                {/* Card 3: Human Review */}
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'review' ? 'none' : 'review')}
                  className={cn(
                    'group text-left rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between h-48',
                    activeTab === 'review' 
                      ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_30px_rgba(14,165,233,0.15)]' 
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <CheckCircle2 className="size-5" />
                    </span>
                    <span className="font-mono text-2xl font-bold text-white tabular">
                      {reviewQueue.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                      Human Review Queue
                    </h3>
                    <p className="font-mono text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>Verify low confidence</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </button>

                {/* Card 4: Live Cameras */}
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'cameras' ? 'none' : 'cameras')}
                  className={cn(
                    'group text-left rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between h-48',
                    activeTab === 'cameras' 
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Radio className="size-5 animate-pulse" />
                    </span>
                    <span className="font-mono text-2xl font-bold text-white tabular">
                      {TOTAL_CAMERAS}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Live Camera Feeds
                    </h3>
                    <p className="font-mono text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>Inspect camera grid</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </button>

              </div>

              {/* EXPANDED SECTION (Shown ONLY when a card above is clicked) */}
              {activeTab !== 'none' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/[0.1] bg-black/50 p-8 backdrop-blur-2xl space-y-6 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white capitalize">
                        {activeTab === 'critical' && 'Critical Active Threats'}
                        {activeTab === 'responding' && 'Teams On-Site & Active Response'}
                        {activeTab === 'review' && 'Human-in-the-Loop Review Queue'}
                        {activeTab === 'cameras' && 'Live Multi-Zone Surveillance Grid'}
                      </h2>
                      <p className="font-mono text-xs text-slate-400 mt-1">
                        {activeTab === 'cameras' ? 'Real-time computer vision telemetry across 4 zones' : `Showing ${
                          activeTab === 'critical' ? activeThreats.length :
                          activeTab === 'responding' ? activeResponses.length : reviewQueue.length
                        } records`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('none')}
                      className="p-2.5 rounded-full bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-colors"
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  {activeTab === 'cameras' ? (
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
                  ) : (
                    <div>
                      {
                        (activeTab === 'critical' ? activeThreats :
                         activeTab === 'responding' ? activeResponses : reviewQueue).length === 0 ? (
                          <div className="py-12 text-center font-mono text-xs text-slate-500">
                            No records currently in this queue. All sectors secure.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(activeTab === 'critical' ? activeThreats :
                              activeTab === 'responding' ? activeResponses : reviewQueue).map((incident) => (
                              <ThreatCard key={incident.id} incident={incident} now={now} />
                            ))}
                          </div>
                        )
                      }
                    </div>
                  )}
                </motion.div>
              )}

            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AuditLog audit={state.audit} />
            </motion.div>
          )}

          <footer className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600 pt-12 border-t border-white/[0.06]">
            SentinelAI Autonomous Node · UBIT Code//Connect '26
          </footer>

        </main>
      </div>
    </div>
  )
}
