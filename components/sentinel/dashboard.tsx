'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Incident {
  id: string
  title: string
  zoneId: 'A' | 'B' | 'C' | 'D'
  zoneName: string
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'active' | 'review' | 'resolved' | 'acknowledged'
  confidence: number
  indicators: string[]
  recommendedAction: string
  uncertaintyNote: string
  timestamp: number
  history: { action: string; time: number; user: string }[]
  isDemoData?: boolean
}

interface SentinelState {
  hydrated: boolean
  setHydrated: (val: boolean) => void
  incidents: Incident[]
  audit: { id: string; action: string; timestamp: number }[]
  ambient: boolean
  toggleAmbient: () => void
  addIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'history'>) => string
  updateStatus: (id: string, status: Incident['status'], actionLabel: string) => void
  resetToDefaults: () => void
}

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-001',
    title: 'Unauthorized Perimeters Access Detected',
    zoneId: 'D',
    zoneName: 'Zone D · Perimeter Wall',
    category: 'Intrusion',
    priority: 'critical',
    status: 'active',
    confidence: 0.96,
    indicators: ['Thermal motion signature near barrier', 'Unscheduled night presence'],
    recommendedAction: 'Dispatch campus security patrol for visual verification.',
    uncertaintyNote: 'Shadow distortion possible under low-light floodlamps; human verification required.',
    timestamp: Date.now() - 1000 * 60 * 12,
    history: [{ action: 'Automated AI detection trigger', time: Date.now() - 1000 * 60 * 12, user: 'System' }],
    isDemoData: true,
  },
  {
    id: 'INC-2026-002',
    title: 'Loitering & Crowd Gathering',
    zoneId: 'B',
    zoneName: 'Zone B · Campus Corridor',
    category: 'Crowd Anomaly',
    priority: 'high',
    status: 'review',
    confidence: 0.82,
    indicators: ['Prolonged stationary group formation', 'Restricted hallway bottleneck'],
    recommendedAction: 'Review live feed snapshot and notify student marshals.',
    uncertaintyNote: 'Possible student club gathering after hours.',
    timestamp: Date.now() - 1000 * 60 * 45,
    history: [{ action: 'Flagged for human review queue', time: Date.now() - 1000 * 60 * 45, user: 'System' }],
    isDemoData: true,
  },
  {
    id: 'INC-2026-003',
    title: 'Normal Gate Access Verification',
    zoneId: 'A',
    zoneName: 'Zone A · Main Gate',
    category: 'Access Control',
    priority: 'low',
    status: 'resolved',
    confidence: 0.99,
    indicators: ['Standard ID badge scan verified'],
    recommendedAction: 'No further action required.',
    uncertaintyNote: 'Zero ambiguity.',
    timestamp: Date.now() - 1000 * 60 * 120,
    history: [{ action: 'Resolved automatically by system policy', time: Date.now() - 1000 * 60 * 120, user: 'System' }],
    isDemoData: true,
  },
]

export const useSentinelStore = create<SentinelState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      setHydrated: (val) => set({ hydrated: val }),
      incidents: INITIAL_INCIDENTS,
      audit: [
        { id: 'AUD-1', action: 'System initialized with demo seed data (Browser-local storage mode)', timestamp: Date.now() - 1000 * 60 * 200 }
      ],
      ambient: true,
      toggleAmbient: () => set((state) => ({ ambient: !state.ambient })),
      
      addIncident: (data) => {
        const id = `INC-${Date.now().toString().slice(-6)}`
        const newIncident: Incident = {
          ...data,
          id,
          timestamp: Date.now(),
          history: [{ action: `Incident reported manually (${data.category})`, time: Date.now(), user: 'Operator' }],
          isDemoData: false,
        }
        set((state) => ({
          incidents: [newIncident, ...state.incidents],
          audit: [{ id: `AUD-${Date.now()}`, action: `New incident reported: ${id} [${data.zoneName}]`, timestamp: Date.now() }, ...state.audit]
        }))
        return id
      },

      updateStatus: (id, status, actionLabel) => {
        set((state) => ({
          incidents: state.incidents.map((inc) => {
            if (inc.id !== id) return inc
            return {
              ...inc,
              status,
              history: [{ action: actionLabel, time: Date.now(), user: 'Operator' }, ...inc.history]
            }
          }),
          audit: [{ id: `AUD-${Date.now()}`, action: `Incident ${id} updated to ${status}: ${actionLabel}`, timestamp: Date.now() }, ...state.audit]
        }))
      },

      resetToDefaults: () => set({ incidents: INITIAL_INCIDENTS })
    }),
    {
      name: 'sentinel-ai-storage-v2',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      }
    }
  )
)
