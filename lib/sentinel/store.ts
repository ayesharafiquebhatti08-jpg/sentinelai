'use client'

import { useState, useEffect, useCallback } from 'react'

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

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-001',
    title: 'Unauthorized Perimeter Access Detected',
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

export function useSentinelStore() {
  const [hydrated, setHydrated] = useState(false)
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS)
  const [audit, setAudit] = useState<{ id: string; action: string; timestamp: number }[]>([
    { id: 'AUD-1', action: 'System initialized with demo seed data (Browser-local storage mode)', timestamp: Date.now() - 1000 * 60 * 200 }
  ])
  const [ambient, setAmbient] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sentinel_incidents_v3')
      if (saved) {
        setIncidents(JSON.parse(saved))
      }
      const savedAudit = localStorage.getItem('sentinel_audit_v3')
      if (savedAudit) {
        setAudit(JSON.parse(savedAudit))
      }
    } catch (e) {
      console.error(e)
    }
    setHydrated(true)
  }, [])

  const saveToStorage = (newIncidents: Incident[], newAudit: any[]) => {
    try {
      localStorage.setItem('sentinel_incidents_v3', JSON.stringify(newIncidents))
      localStorage.setItem('sentinel_audit_v3', JSON.stringify(newAudit))
    } catch (e) {
      console.error(e)
    }
  }

  const addIncident = useCallback((data: Omit<Incident, 'id' | 'timestamp' | 'history'>) => {
    const id = `INC-${Date.now().toString().slice(-6)}`
    const newIncident: Incident = {
      ...data,
      id,
      timestamp: Date.now(),
      history: [{ action: `Incident reported manually (${data.category})`, time: Date.now(), user: 'Operator' }],
      isDemoData: false,
    }
    setIncidents(prev => {
      const updated = [newIncident, ...prev]
      setAudit(prevAudit => {
        const updatedAudit = [{ id: `AUD-${Date.now()}`, action: `New incident reported: ${id} [${data.zoneName}]`, timestamp: Date.now() }, ...prevAudit]
        saveToStorage(updated, updatedAudit)
        return updatedAudit
      })
      return updated
    })
    return id
  }, [])

  const updateStatus = useCallback((id: string, status: Incident['status'], actionLabel: string) => {
    setIncidents(prev => {
      const updated = prev.map(inc => {
        if (inc.id !== id) return inc
        return {
          ...inc,
          status,
          history: [{ action: actionLabel, time: Date.now(), user: 'Operator' }, ...inc.history]
        }
      })
      setAudit(prevAudit => {
        const updatedAudit = [{ id: `AUD-${Date.now()}`, action: `Incident ${id} updated to ${status}: ${actionLabel}`, timestamp: Date.now() }, ...prevAudit]
        saveToStorage(updated, updatedAudit)
        return updatedAudit
      })
      return updated
    })
  }, [])

  const toggleAmbient = () => setAmbient(prev => !prev)

  return {
    hydrated,
    setHydrated: () => {},
    incidents,
    audit,
    ambient,
    toggleAmbient,
    addIncident,
    updateStatus,
  }
}
