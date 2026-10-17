'use client'

import { useSyncExternalStore } from 'react'
import {
  createIncident,
  randomAmbientConfidence,
  randomThreatType,
  randomUncertainConfidence,
  REVIEW_THRESHOLD,
} from './scenarios'
import type { Incident, IncidentAction, SentinelState, ThreatType } from './types'

const STORAGE_KEY = 'sentinelai:state:v1'
const STATE_VERSION = 1
const MAX_AUDIT = 250
const MAX_ACTIVE = 40

export const ON_SITE_DELAY_MS = 3_000     // 3s: Units Dispatched -> Team On-Site
export const RESOLVING_DELAY_MS = 3_000  // 3s: Team On-Site -> Resolving Issue
export const RESOLVE_HOLD_MS = 2_500     // 2.5s: Problem Resolved shown before archiving

const EMPTY_STATE: SentinelState = {
  version: STATE_VERSION,
  hydrated: false,
  seq: 0,
  ambient: true,
  incidents: [],
  audit: [],
}

function buildSeedState(): SentinelState {
  const now = Date.now()
  const min = 60_000
  let seq = 0
  const next = () => ++seq

  const pastFire = createIncident('fire', next(), { confidence: 96.2, source: 'seed', at: now - 142 * min })
  const pastFireResolved: Incident = {
    ...pastFire,
    dispatchedAt: pastFire.detectedAt + 4_000,
    onSiteAt: pastFire.detectedAt + 7_000,
    resolvingAt: pastFire.detectedAt + 10_000,
    closingAt: pastFire.detectedAt + 13_000,
    resolvedAt: pastFire.detectedAt + 9 * min,
    resolution: 'resolved',
    actions: [
      ...pastFire.actions,
      { at: pastFire.detectedAt + 4_000, kind: 'dispatch', label: 'Quick Response Team Bravo-2 dispatched (Response: 4.0s)' },
      { at: pastFire.detectedAt + 7_000, kind: 'onsite', label: 'Team arrived on-site in Zone B' },
      { at: pastFire.detectedAt + 10_000, kind: 'resolving', label: 'Team actively resolving the issue' },
      { at: pastFire.detectedAt + 13_000, kind: 'resolved', label: 'Problem resolved and archived' },
    ],
  }

  const pastFalse = createIncident('violence', next(), { confidence: 34.6, source: 'seed', at: now - 96 * min })
  const pastFalseDismissed: Incident = {
    ...pastFalse,
    resolvedAt: pastFalse.detectedAt + 2 * min,
    resolution: 'false-alarm',
    actions: [
      ...pastFalse.actions,
      { at: pastFalse.detectedAt + 2 * min, kind: 'dismissed', label: 'Operator verified footage: dismissed as false alarm' },
    ],
  }

  const activeIntrusion = createIncident('intrusion', next(), { confidence: 94.8, source: 'seed', at: now - 3 * min })
  const reviewItem = createIncident('fire', next(), { confidence: 41.3, source: 'seed', at: now - 7 * min })

  return {
    version: STATE_VERSION,
    hydrated: true,
    seq,
    ambient: true,
    incidents: [activeIntrusion, reviewItem],
    audit: [pastFalseDismissed, pastFireResolved],
  }
}

let state: SentinelState = EMPTY_STATE
const listeners = new Set<() => void>()
let initialized = false

function emit() {
  for (const l of listeners) l()
}

function persist() {
  try {
    const { hydrated: _h, ...rest } = state
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch {}
}

function setState(updater: (prev: SentinelState) => SentinelState) {
  state = updater(state)
  persist()
  emit()
}

function init() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Omit<SentinelState, 'hydrated'>
      if (parsed.version === STATE_VERSION && Array.isArray(parsed.incidents) && Array.isArray(parsed.audit)) {
        state = { ...parsed, hydrated: true }
        return
      }
    }
  } catch {}
  state = buildSeedState()
  persist()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return
    try {
      state = { ...(JSON.parse(e.newValue) as SentinelState), hydrated: true }
      emit()
    } catch {}
  })
}

function subscribe(listener: () => void) {
  init()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  init()
  return state
}

function getServerSnapshot() {
  return EMPTY_STATE
}

export function useSentinel() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

function withAction(incident: Incident, action: Omit<IncidentAction, 'at'>, at = Date.now()): Incident {
  return { ...incident, actions: [...incident.actions, { ...action, at }] }
}

function addIncident(build: (seq: number) => Incident) {
  const seq = state.seq + 1
  const incident = build(seq)
  setState((s) => ({
    ...s,
    seq,
    incidents: [incident, ...s.incidents].slice(0, MAX_ACTIVE),
  }))
  return incident
}

export const sentinel = {
  simulate(type: ThreatType) {
    return addIncident((seq) => createIncident(type, seq))
  },

  simulateUncertain(type: ThreatType = randomThreatType()) {
    return addIncident((seq) => createIncident(type, seq, { confidence: randomUncertainConfidence() }))
  },

  ambientTick() {
    return addIncident((seq) =>
      createIncident(randomThreatType(), seq, {
        confidence: randomAmbientConfidence(),
        source: 'ambient',
      }),
    )
  },

  dispatch(id: string) {
    const now = Date.now()
    setState((s) => ({
      ...s,
      incidents: s.incidents.map((i) => {
        if (i.id === id && !i.dispatchedAt) {
          const responseTimeSec = ((now - i.detectedAt) / 1000).toFixed(1)
          return withAction(
            { ...i, dispatchedAt: now },
            { kind: 'dispatch', label: `Quick Response Team dispatched to Zone ${i.zoneId} (Response time: ${responseTimeSec}s)` },
            now,
          )
        }
        return i
      }),
    }))
  },

  protocol(id: string) {
    setState((s) => ({
      ...s,
      incidents: s.incidents.map((i) =>
        i.id === id && !i.protocolAt
          ? withAction(
              { ...i, protocolAt: Date.now() },
              { kind: 'protocol', label: `Safety protocol activated in Zone ${i.zoneId}` },
            )
          : i,
      ),
    }))
  },

  escalate(id: string) {
    setState((s) => ({
      ...s,
      incidents: s.incidents.map((i) =>
        i.id === id && i.queue === 'review'
          ? withAction(
              { ...i, queue: 'active', severity: 'high', tags: ['HUMAN VERIFIED', ...i.tags.filter((t) => t !== 'HUMAN REVIEW')] },
              { kind: 'escalated', label: 'Operator verified footage and escalated to active threat' },
            )
          : i,
      ),
    }))
  },

  resolve(id: string) {
    setState((s) => ({
      ...s,
      incidents: s.incidents.map((i) =>
        i.id === id && !i.closingAt ? { ...i, closingAt: Date.now() } : i,
      ),
    }))
  },

  advanceLifecycle() {
    const now = Date.now()
    const due = state.incidents.filter(
      (i) =>
        (i.closingAt && now - i.closingAt >= RESOLVE_HOLD_MS) ||
        (i.resolvingAt && !i.closingAt && now - i.resolvingAt >= RESOLVING_DELAY_MS) ||
        (i.onSiteAt && !i.resolvingAt && !i.closingAt && now - i.onSiteAt >= RESOLVING_DELAY_MS) ||
        (i.dispatchedAt && !i.onSiteAt && !i.resolvingAt && !i.closingAt && now - i.dispatchedAt >= ON_SITE_DELAY_MS),
    )
    if (due.length === 0) return

    setState((s) => {
      let incidents = s.incidents
      let audit = s.audit
      for (const i of due) {
        if (i.closingAt) {
          const archived = withAction(
            { ...i, resolvedAt: now, resolution: 'resolved' as const },
            { kind: 'resolved', label: 'Problem resolved and archived' },
            now,
          )
          incidents = incidents.filter((x) => x.id !== i.id)
          audit = [archived, ...audit].slice(0, MAX_AUDIT)
        } else if (i.resolvingAt && !i.closingAt) {
          incidents = incidents.map((x) =>
            x.id === i.id
              ? withAction(
                  { ...x, closingAt: now },
                  { kind: 'resolved', label: 'Problem resolved successfully' },
                  now,
                )
              : x,
          )
        } else if (i.onSiteAt && !i.resolvingAt) {
          incidents = incidents.map((x) =>
            x.id === i.id
              ? withAction(
                  { ...x, resolvingAt: now },
                  { kind: 'resolving', label: 'Team actively resolving the issue' },
                  now,
                )
              : x,
          )
        } else if (i.dispatchedAt && !i.onSiteAt) {
          incidents = incidents.map((x) =>
            x.id === i.id
              ? withAction(
                  { ...x, onSiteAt: now },
                  { kind: 'onsite', label: `Team arrived on-site in Zone ${x.zoneId}` },
                  now,
                )
              : x,
          )
        }
      }
      return { ...s, incidents, audit }
    })
  },

  dismiss(id: string) {
    setState((s) => {
      const target = s.incidents.find((i) => i.id === id)
      if (!target) return s
      const now = Date.now()
      const archived = withAction(
        { ...target, resolvedAt: now, resolution: 'false-alarm' },
        { kind: 'dismissed', label: 'Operator verified footage: dismissed as false alarm' },
        now,
      )
      return {
        ...s,
        incidents: s.incidents.filter((i) => i.id !== id),
        audit: [archived, ...s.audit].slice(0, MAX_AUDIT),
      }
    })
  },

  setAmbient(ambient: boolean) {
    setState((s) => ({ ...s, ambient }))
  },

  clearAudit() {
    setState((s) => ({ ...s, audit: [] }))
  },

  resetDemo() {
    state = buildSeedState()
    persist()
    emit()
  },
}

export function computeStats(s: SentinelState) {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const today = startOfDay.getTime()

  const all = [...s.incidents, ...s.audit]
  const threatsToday = all.filter(
    (i) => i.detectedAt >= today && i.resolution !== 'false-alarm' && i.queue === 'active',
  ).length
  const resolved = s.audit.filter((i) => i.resolution === 'resolved').length

  // Calculate average response time from audit log items that have dispatch time
  const dispatchedItems = s.audit.filter((i) => i.dispatchedAt)
  let avgResponseSec = 3.8 // benchmark default
  if (dispatchedItems.length > 0) {
    const totalSec = dispatchedItems.reduce((acc, i) => acc + ((i.dispatchedAt! - i.detectedAt) / 1000), 0)
    avgResponseSec = Number((totalSec / dispatchedItems.length).toFixed(1))
  }

  return {
    threatsToday,
    resolved,
    avgResponseSec,
    activeCount: s.incidents.filter((i) => i.queue === 'active').length,
    reviewCount: s.incidents.filter((i) => i.queue === 'review').length,
  }
}
