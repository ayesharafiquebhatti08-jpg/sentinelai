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

export const ON_SITE_DELAY_MS = 5_000   // "Units Dispatched" -> "Team On-Site & Working"
export const ARCHIVE_DELAY_MS = 1_800   // "Problem Resolved" shown, then archived

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
    dispatchedAt: pastFire.detectedAt + 38_000,
    onSiteAt: pastFire.detectedAt + 43_000,
    protocolAt: pastFire.detectedAt + 52_000,
    resolvedAt: pastFire.detectedAt + 9 * min,
    resolution: 'resolved',
    actions: [
      ...pastFire.actions,
      { at: pastFire.detectedAt + 38_000, kind: 'dispatch', label: 'Quick Response Team Bravo-2 dispatched' },
      { at: pastFire.detectedAt + 43_000, kind: 'onsite', label: 'Team on-site and working in Zone B' },
      { at: pastFire.detectedAt + 52_000, kind: 'protocol', label: 'Zone B evacuation alarm and HVAC shutdown activated' },
      { at: pastFire.detectedAt + 9 * min, kind: 'resolved', label: 'Incident resolved and archived by operator' },
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

  const pastAccident = createIncident('accident', next(), { confidence: 91.4, source: 'seed', at: now - 54 * min })
  const pastAccidentResolved: Incident = {
    ...pastAccident,
    dispatchedAt: pastAccident.detectedAt + 41_000,
    onSiteAt: pastAccident.detectedAt + 46_000,
    resolvedAt: pastAccident.detectedAt + 14 * min,
    resolution: 'resolved',
    actions: [
      ...pastAccident.actions,
      { at: pastAccident.detectedAt + 41_000, kind: 'dispatch', label: 'Quick Response Team Alpha-1 dispatched' },
      { at: pastAccident.detectedAt + 46_000, kind: 'onsite', label: 'Team on-site and working in Zone A' },
      { at: pastAccident.detectedAt + 14 * min, kind: 'resolved', label: 'Incident resolved and archived by operator' },
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
    audit: [pastAccidentResolved, pastFalseDismissed, pastFireResolved],
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
  } catch {
    // Storage may be full or disabled
  }
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
  } catch {
    // Fall through
  }
  state = buildSeedState()
  persist()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return
    try {
      state = { ...(JSON.parse(e.newValue) as SentinelState), hydrated: true }
      emit()
    } catch {
      // ignore
    }
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
    setState((s) => ({
      ...s,
      incidents: s.incidents.map((i) =>
        i.id === id && !i.dispatchedAt
          ? withAction(
              { ...i, dispatchedAt: Date.now() },
              {
                kind: 'dispatch',
                label: `Quick Response Team dispatched to Zone ${i.zoneId}`,
              },
            )
          : i,
      ),
    }))
  },

  protocol(id: string) {
    setState((s) => ({
      ...s,
      incidents: s.incidents.map((i) =>
        i.id === id && !i.protocolAt
          ? withAction(
              { ...i, protocolAt: Date.now() },
              {
                kind: 'protocol',
                label:
                  i.type === 'fire'
                    ? `Zone ${i.zoneId} evacuation alarm and suppression protocol activated`
                    : `Zone ${i.zoneId} automated warning broadcast and lockdown engaged`,
              },
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
              {
                ...i,
                queue: 'active',
                severity: 'high',
                tags: ['HUMAN VERIFIED', ...i.tags.filter((t) => t !== 'HUMAN REVIEW')],
              },
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
        (i.closingAt && now - i.closingAt >= ARCHIVE_DELAY_MS) ||
        (i.dispatchedAt && !i.onSiteAt && !i.closingAt && now - i.dispatchedAt >= ON_SITE_DELAY_MS),
    )
    if (due.length === 0) return
    setState((s) => {
      let incidents = s.incidents
      let audit = s.audit
      for (const i of due) {
        if (i.closingAt) {
          const archived = withAction(
            { ...i, resolvedAt: now, resolution: 'resolved' as const },
            {
              kind: 'resolved',
              label: 'Problem resolved and archived by operator',
            },
            now,
          )
          incidents = incidents.filter((x) => x.id !== i.id)
          audit = [archived, ...audit].slice(0, MAX_AUDIT)
        } else {
          incidents = incidents.map((x) =>
            x.id === i.id
              ? withAction(
                  { ...x, onSiteAt: now },
                  { kind: 'onsite', label: `Team on-site and working in Zone ${x.zoneId}` },
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
        {
          kind: 'dismissed',
          label: 'Operator verified footage: dismissed as false alarm',
        },
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

const HISTORICAL_EVALUATIONS = 12_480
const HISTORICAL_CORRECT = 12_318

export function computeStats(s: SentinelState) {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const today = startOfDay.getTime()

  const all = [...s.incidents, ...s.audit]
  const threatsToday = all.filter(
    (i) => i.detectedAt >= today && i.resolution !== 'false-alarm' && i.queue === 'active',
  ).length
  const resolved = s.audit.filter((i) => i.resolution === 'resolved').length

  const correct = s.audit.filter((i) => {
    const flaggedReal = i.confidence >= REVIEW_THRESHOLD
    return flaggedReal ? i.resolution === 'resolved' : i.resolution === 'false-alarm'
  }).length
  const accuracy =
    ((HISTORICAL_CORRECT + correct) / (HISTORICAL_EVALUATIONS + s.audit.length)) * 100

  return {
    threatsToday,
    resolved,
    accuracy,
    activeCount: s.incidents.filter((i) => i.queue === 'active').length,
    reviewCount: s.incidents.filter((i) => i.queue === 'review').length,
  }
}
