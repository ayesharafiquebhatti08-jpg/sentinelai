'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Plus, Radio, X, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react'
import { useSentinelStore, Incident } from '@/lib/sentinel/store'

export function Dashboard() {
  const store = useSentinelStore()
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [assessmentText, setAssessmentText] = useState<string | null>(null)
  const [assessing, setAssessing] = useState(false)

  // Form state for custom text inputs
  const [formLocation, setFormLocation] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  if (!store.hydrated) return null

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setTimeout(() => {
      store.addIncident({
        title: `${formCategory || 'Incident'} reported at ${formLocation || 'Campus Area'}`,
        zoneId: 'B',
        zoneName: formLocation || 'Parking Area',
        category: formCategory || 'Fire or smoke concern',
        priority: 'high',
        status: 'review',
        confidence: 0.95,
        indicators: [formDesc || 'The reported observation near target zone'],
        recommendedAction: 'Verify observation on-site immediately.',
        uncertaintyNote: 'Public report flagged for review queue.',
      })
      setFormSubmitting(false)
      setFormLocation('')
      setFormCategory('')
      setFormDesc('')
      setShowReportModal(false)
    }, 400)
  }

  const handleDemoAssessment = () => {
    setAssessing(true)
    setTimeout(() => {
      setAssessmentText("AI Assessment: High confidence risk signature identified near target zone. Immediate dispatch recommended. Potential heat source or crowd hazard detected.")
      setAssessing(false)
    }, 600)
  }

  const zones = [
    { id: 'A', name: 'Main Entrance & Gate', cam: 'REC · CAM-01', threatText: 'VEHICLE COLLISION AT ENTRY BARRIER', confidence: '75.7%', risk: '99% Active', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80' },
    { id: 'B', name: 'Campus Corridor / Parking', cam: 'REC · CAM-02', threatText: 'SMOKE & THERMAL ANOMALY DETECTED', confidence: '70.3%', risk: '99% Active', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80' },
    { id: 'C', name: 'Server Room / Restricted Asset', cam: 'REC · CAM-03', threatText: 'UNAUTHORIZED ACCESS TO RESTRICTED ASSET', confidence: '71.4%', risk: '99% Active', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80' },
    { id: 'D', name: 'Perimeter Wall', cam: 'REC · CAM-04', threatText: 'AGGRESSIVE CROWD MOVEMENT DETECTED', confidence: '78.5%', risk: '99% Active', img: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f764e?auto=format&fit=crop&w=1200&q=80' },
  ]

  return (
    <div className="min-h-screen bg-[#030508] text-slate-100 font-sans selection:bg-rose-500/30">
      
      {/* TOP HEADER */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#030508]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500 font-bold">
            🛡️
          </div>
          <span className="font-mono text-sm tracking-widest text-white font-extrabold">
            SentinelAI <span className="text-slate-500 font-normal">// PROACTIVE THREAT PREVENTION HUB</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-600/20"
          >
            <Plus className="size-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </header>

      {/* MAIN 4-ZONE GRID */}
      <main className="max-w-[1600px] mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="relative overflow-hidden rounded-2xl border border-rose-500/50 bg-black shadow-[0_0_30px_rgba(244,63,94,0.15)] group"
            >
              {/* Top Camera Bar */}
              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent font-mono text-xs text-white/90">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold">{zone.cam}</span>
                </span>
                <span className="text-slate-400 font-mono">{new Date().toLocaleTimeString()}</span>
              </div>

              {/* Feed Visual with Diagnostic Box */}
              <div className="relative aspect-[16/9] w-full bg-black overflow-hidden">
                <img
                  src={zone.img}
                  alt={zone.name}
                  className="absolute inset-0 h-full w-full object-cover grayscale contrast-125 opacity-70"
                />
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

                {/* Center Diagnostic Threat Card */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[82%] max-w-md rounded-2xl border border-amber-500/60 bg-black/85 p-5 text-center shadow-[0_0_25px_rgba(245,158,11,0.2)] backdrop-blur-md space-y-2">
                    <div className="flex justify-center text-amber-400 mb-1">
                      <AlertCircle className="size-6 animate-pulse" />
                    </div>
                    <h3 className="font-mono font-extrabold text-white text-sm tracking-wider">
                      {zone.threatText}
                    </h3>
                    <p className="font-mono text-amber-400 font-extrabold text-lg">
                      {zone.confidence}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Zone Footer */}
              <div className="relative z-20 flex items-center justify-between border-t border-white/10 bg-black/95 p-4 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">ZONE {zone.id}</span>
                  <h4 className="text-white font-bold text-sm">{zone.name}</h4>
                </div>
                <div className="flex items-center gap-6">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-500 text-xs font-extrabold animate-pulse">
                    THREAT
                  </span>
                </div>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="grid grid-cols-3 border-t border-white/10 bg-[#06090f] p-3 font-mono text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">HEALTH</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-400" /> Online
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">LATENCY</span>
                  <span className="text-amber-400 font-bold mt-0.5 block">⚡ 12ms</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">RISK INDEX</span>
                  <span className="text-white font-bold mt-0.5 block">{zone.risk}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* INCIDENT INBOX SECTION */}
        <section className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <ShieldAlert className="size-5 text-rose-500" />
              <span>Active Incident Reports & Submissions ({store.incidents.length})</span>
            </h2>
            <span className="font-mono text-xs text-slate-400">Click any incident to open inspector template</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {store.incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => { setSelectedIncident(inc); setAssessmentText(null); }}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 p-5 space-y-3 transition-all hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-rose-400 font-bold">{inc.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-bold text-[10px]">
                    Needs Review
                  </span>
                </div>
                <h3 className="font-bold text-white group-hover:text-rose-400 transition-colors text-sm">
                  {inc.title}
                </h3>
                <p className="font-mono text-xs text-slate-400">📍 {inc.zoneName}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between pt-6 border-t border-white/10 font-mono text-[11px] text-slate-500">
          <span>SENTINELAI V2.4 · EDGE INFERENCE NODE EU-01</span>
          <span>STATE: ACTIVE MONITORING</span>
        </div>
      </main>

      {/* TEMPLATE-MATCHING INCIDENT INSPECTOR MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#090d14] border border-white/15 rounded-3xl max-w-2xl w-full p-8 space-y-8 shadow-2xl relative">
            
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-300">{selectedIncident.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/25 border border-rose-500/50 text-rose-400 font-mono text-[10px] uppercase font-bold">
                    High
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/50 text-amber-300 font-mono text-[10px] uppercase font-bold">
                    Needs Review
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white">{selectedIncident.title}</h2>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all">
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-8 font-mono text-xs">
              <div>
                <span className="text-slate-500 uppercase tracking-wider block mb-1">Source</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-200">
                  <ShieldAlert className="size-3.5 text-rose-400" />
                  Public report
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase tracking-wider block mb-1">Location</span>
                <span className="text-white font-bold">{selectedIncident.zoneName}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase tracking-wider block mb-1">Type</span>
                <span className="text-white font-bold">{selectedIncident.category}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase tracking-wider block mb-1">Created</span>
                <span className="text-white font-bold">{new Date(selectedIncident.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <span className="text-slate-500 uppercase tracking-wider block">Description</span>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-slate-200 leading-relaxed">
                {selectedIncident.indicators[0] || 'No detailed description provided.'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e1420] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                <Sparkles className="size-4" />
                <span>AI-assisted assessment</span>
              </div>
              <p className="font-mono text-xs text-slate-300 leading-relaxed">
                {assessmentText || "No assessment yet. Live AI sends only the incident type, location, description, priority, and source to the model. If live AI is unavailable, use the transparent rules-based demo."}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleDemoAssessment}
                  disabled={assessing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-sky-600/20"
                >
                  <Sparkles className="size-3.5" />
                  <span>{assessing ? 'Evaluating...' : 'Assess with live AI'}</span>
                </button>
                <button
                  onClick={handleDemoAssessment}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-mono text-xs font-bold transition-all"
                >
                  Generate demo assessment
                </button>
              </div>
            </div>

            {/* ACTIVITY HISTORY */}
            <div className="space-y-3 pt-2">
              <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block">Activity history</span>
              <div className="space-y-3 border-l border-white/10 pl-4 ml-1 font-mono text-xs">
                {selectedIncident.history.map((hist, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-sky-500 ring-4 ring-[#090d14]" />
                    <p className="text-slate-200">{hist.action}</p>
                    <span className="text-[10px] text-slate-500">{hist.user} · {new Date(selectedIncident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => { store.updateStatus(selectedIncident.id, 'resolved', 'Incident marked resolved'); setSelectedIncident(null); }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
              >
                Resolve Incident
              </button>
            </div>

          </motion.div>
        </div>
      )}

      {/* PUBLIC INCIDENT REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#090d14] border border-white/15 rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white font-mono">Public Incident Report Form</h2>
              <button onClick={() => setShowReportModal(false)} className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Location / Zone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Parking Area, Main Library Entrance..."
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Incident Problem Type / Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Fire or smoke concern, Unauthorized Entry..."
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description of Observation</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide brief details of the observation..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white resize-none focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowReportModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all">
                  {formSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  )
}
