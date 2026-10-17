'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { ShieldAlert, Plus, Search, Radio, X, Sparkles, Clock, MapPin, AlertCircle } from 'lucide-react'
import { useSentinelStore, Incident } from '@/lib/sentinel/store'

export function Dashboard() {
  const store = useSentinelStore()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
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

  // Computed Accurate Metrics from real incident array
  const totalIncidents = store.incidents.length
  const activeCount = store.incidents.filter(i => i.status === 'active').length
  const reviewCount = store.incidents.filter(i => i.status === 'review').length
  const resolvedCount = store.incidents.filter(i => i.status === 'resolved').length

  const filteredIncidents = store.incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(search.toLowerCase()) || inc.id.toLowerCase().includes(search.toLowerCase()) || inc.zoneName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || inc.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setTimeout(() => {
      store.addIncident({
        title: formDesc.slice(0, 45) || formCategory || 'Reported Incident',
        zoneId: 'B',
        zoneName: formLocation || 'Parking Area',
        category: formCategory || 'Fire or smoke concern',
        priority: 'high',
        status: 'review',
        confidence: 0.92,
        indicators: [formDesc || 'Reported observation from public input'],
        recommendedAction: 'Verify observation on-site immediately.',
        uncertaintyNote: 'Public report requires physical security verification.',
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

  return (
    <div className="min-h-screen bg-[#030508] text-slate-100 selection:bg-rose-500/35 selection:text-white font-sans">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#030508] to-[#010203]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-10">
        
        {/* HEADER & BANNER */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs uppercase tracking-widest mb-2">
              <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
              UBIT Code//Connect '26 · Threat Prevention MVP
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              SENTINEL<span className="text-rose-500">AI</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-600/20"
            >
              <Plus className="size-4" />
              <span>Report Incident</span>
            </button>
            <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 font-mono text-[11px] text-slate-400">
              AI Status: <span className="text-amber-400 font-bold">Deterministic Demo Fallback</span>
            </div>
          </div>
        </header>

        {/* METRICS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">Active Threats</span>
            <p className="text-3xl font-extrabold font-mono text-rose-500 mt-1">{activeCount}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">Review Queue</span>
            <p className="text-3xl font-extrabold font-mono text-amber-400 mt-1">{reviewCount}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">Resolved</span>
            <p className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">{resolvedCount}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">Total Tracked</span>
            <p className="text-3xl font-extrabold font-mono text-white mt-1">{totalIncidents}</p>
          </div>
        </div>

        {/* 4 CAMERA FEEDS (PRIMARY MONITORING VIEW) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="size-5 text-rose-500 animate-pulse" />
              <span>Simulated Surveillance Matrix (4 Zones)</span>
            </h2>
            <span className="font-mono text-[11px] text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Demo Feeds · Simulated Computer Vision Overlays Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 'A', name: 'Zone A · Main Gate', status: 'Normal', risk: '44', alert: false, img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80' },
              { id: 'B', name: 'Zone B · Parking Area', status: activeCount > 0 ? 'ACTIVE THREAT ALARM' : 'Threat Alarming', risk: '81', alert: true, img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80' },
              { id: 'C', name: 'Zone C · Server Room', status: 'Normal', risk: '58', alert: false, img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80' },
              { id: 'D', name: 'Zone D · Perimeter Wall', status: 'Threat Alarming', risk: '99', alert: true, img: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f764e?auto=format&fit=crop&w=800&q=80' },
            ].map((cam) => (
              <div key={cam.id} className={`relative rounded-2xl overflow-hidden border bg-black/60 backdrop-blur-md ${cam.alert ? 'border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'border-white/10'}`}>
                <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent font-mono text-[10px]">
                  <span className="flex items-center gap-1.5 text-white">
                    <span className={`size-2 rounded-full ${cam.alert ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                    CAM-0{cam.id === 'A' ? 1 : cam.id === 'B' ? 2 : cam.id === 'C' ? 3 : 4}
                  </span>
                  <span className="text-slate-400">REC</span>
                </div>

                <div className="relative aspect-[16/10] bg-black overflow-hidden">
                  <img src={cam.img} alt={cam.name} className={`w-full h-full object-cover ${cam.alert ? 'contrast-125 sepia-[0.3]' : 'grayscale contrast-110'}`} />
                  {cam.alert && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-36 h-24 border-2 border-rose-500 bg-rose-500/10 rounded flex items-start justify-between p-1.5 font-mono text-[8px] text-white">
                        <span className="bg-rose-500 px-1 py-0.5 rounded font-bold">THREAT {cam.risk}%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-black/90 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">{cam.name}</h3>
                    <p className={`font-mono text-[10px] ${cam.alert ? 'text-rose-400' : 'text-emerald-400'}`}>{cam.status}</p>
                  </div>
                  <span className={`font-mono text-sm font-bold ${cam.alert ? 'text-rose-500' : 'text-amber-400'}`}>{cam.risk}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* UNIFIED INCIDENT INBOX */}
        <section className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="size-5 text-rose-500" />
              <span>Unified Incident Inbox</span>
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search incidents or IDs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2 font-mono text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 font-mono text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="review">Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredIncidents.length === 0 ? (
              <div className="col-span-3 py-16 text-center font-mono text-xs text-slate-500 bg-white/[0.01] rounded-2xl border border-white/5">
                No matching incidents found in inbox.
              </div>
            ) : (
              filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => { setSelectedIncident(incident); setAssessmentText(null); }}
                  className="group cursor-pointer rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 p-5 space-y-4 transition-all hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-400">{incident.id}</span>
                    <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] uppercase font-bold ${
                      incident.status === 'active' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      incident.status === 'review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {incident.status === 'review' ? 'Needs Review' : incident.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white group-hover:text-rose-400 transition-colors">{incident.title}</h3>
                    <p className="font-mono text-xs text-slate-400 mt-1">{incident.zoneName}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between font-mono text-[11px] text-slate-400">
                    <span>Conf: {Math.round(incident.confidence * 100)}%</span>
                    <span>{new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* TEMPLATE-MATCHING INCIDENT DETAILS INSPECTOR MODAL */}
        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#090d14] border border-white/15 rounded-3xl max-w-2xl w-full p-8 space-y-8 shadow-2xl relative">
              
              {/* TOP HEADER */}
              <div className="flex items-start justify-between border-b border-white/10 pb-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-300">{selectedIncident.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-[10px] uppercase font-bold">
                      High Priority
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] uppercase font-bold">
                      Needs Review
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white">{selectedIncident.title}</h2>
                </div>
                <button onClick={() => setSelectedIncident(null)} className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all">
                  <X className="size-5" />
                </button>
              </div>

              {/* GRID INFO */}
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

              {/* DESCRIPTION */}
              <div className="space-y-2 font-mono text-xs">
                <span className="text-slate-500 uppercase tracking-wider block">Description</span>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-slate-200 leading-relaxed">
                  {selectedIncident.indicators[1] || selectedIncident.indicators[0] || 'No detailed description provided.'}
                </div>
              </div>

              {/* AI-ASSISTED ASSESSMENT BOX */}
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
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-sky-500 ring-4 ring-[#090d14]" />
                    <p className="text-slate-200">Initial priority High assigned from incident type. Status set to Needs Review.</p>
                    <span className="text-[10px] text-slate-500">System · {new Date(selectedIncident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-rose-500 ring-4 ring-[#090d14]" />
                    <p className="text-slate-200">Public report submitted.</p>
                    <span className="text-[10px] text-slate-500">Reporter · {new Date(selectedIncident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
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
                <h2 className="text-lg font-bold text-white">Public Incident Report Form</h2>
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

        {/* FOOTER & DISCLAIMER */}
        <footer className="pt-12 border-t border-white/[0.06] text-center font-mono text-[10px] text-slate-500 space-y-2">
          <p>SentinelAI Autonomous Node · UBIT Code//Connect '26 Threat Prevention Prototype</p>
          <p className="text-slate-600 max-w-xl mx-auto">
            Disclaimer: This prototype demonstrates automated edge threat detection and response workflows. It does not replace campus authorities, human security personnel, or emergency services. All data is persisted locally in the browser.
          </p>
        </footer>

      </div>
    </div>
  )
}
