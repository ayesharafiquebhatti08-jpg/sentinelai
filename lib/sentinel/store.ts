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
    id: 'SIG-1007',
    title: 'Fire or smoke concern reported at Parking Area',
    zoneId: 'B',
    zoneName: 'Parking Area',
    category: 'Fire or smoke concern',
    priority: 'high',
    status: 'review',
    confidence: 0.94,
    indicators: ['The fire and smoke near a car'],
    recommendedAction: 'Verify observation on-site immediately.',
    uncertaintyNote: 'Public report flagged for security review.',
    timestamp: Date.now() - 1000 * 60 * 12,
    history: [
      { action: 'Initial priority High assigned from incident type. Status set to Needs Review.', time: Date.now() - 1000 * 60 * 12, user: 'System' },
      { action: 'Public report submitted.', time: Date.now() - 1000 * 60 * 12, user: 'Reporter' }
    ],
    isDemoData: true,
  },
]

export function useSentinelStore() {
  const [hydrated, setHydrated] = useState(false)
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS)
  const [audit, setAudit] = useState<{ id: string; action: string; timestamp: number }[]>([
    { id: 'AUD-1', action: 'System initialized with demo seed data', timestamp: Date.now() - 1000 * 60 * 200 }
  ])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sentinel_incidents_v4')
      if (saved) {
        setIncidents(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
    setHydrated(true)
  }, [])

  const saveToStorage = (newIncidents: Incident[]) => {
    try {
      localStorage.setItem('sentinel_incidents_v4', JSON.stringify(newIncidents))
    } catch (e) {
      console.error(e)
    }
  }

  const addIncident = useCallback((data: Omit<Incident, 'id' | 'timestamp' | 'history'>) => {
    const id = `SIG-${Math.floor(1000 + Math.random() * 9000)}`
    const newIncident: Incident = {
      ...data,
      id,
      timestamp: Date.now(),
      history: [
        { action: 'Initial priority High assigned from incident type. Status set to Needs Review.', time: Date.now(), user: 'System' },
        { action: 'Public report submitted.', time: Date.now(), user: 'Reporter' }
      ],
      isDemoData: false,
    }
    setIncidents(prev => {
      const updated = [newIncident, ...prev]
      saveToStorage(updated)
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
      saveToStorage(updated)
      return updated
    })
  }, [])

  return {
    hydrated,
    setHydrated: () => {},
    incidents,
    audit,
    addIncident,
    updateStatus,
  }
}
