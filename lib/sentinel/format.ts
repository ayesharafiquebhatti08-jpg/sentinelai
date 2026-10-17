'use client'

import { useSyncExternalStore } from 'react'
import { CarFront, Flame, ShieldAlert, Users, type LucideIcon } from 'lucide-react'
import type { Severity, ThreatType } from './types'

let now = Date.now()
const clockListeners = new Set<() => void>()
let clockTimer: ReturnType<typeof setInterval> | null = null

function subscribeClock(listener: () => void) {
  clockListeners.add(listener)
  if (!clockTimer) {
    now = Date.now()
    clockTimer = setInterval(() => {
      now = Date.now()
      for (const l of clockListeners) l()
    }, 1000)
  }
  return () => {
    clockListeners.delete(listener)
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer)
      clockTimer = null
    }
  }
}

export function useNow() {
  return useSyncExternalStore(
    subscribeClock,
    () => now,
    () => 0,
  )
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function formatPreciseTime(ts: number) {
  const d = new Date(ts)
  return `${formatTime(ts)}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

export function formatDateTime(ts: number) {
  const d = new Date(ts)
  const date = d.toLocaleDateString('en-CA')
  return `${date} ${formatTime(ts)}`
}

export function formatRelative(ts: number, current: number) {
  if (!current) return '—'
  const diff = Math.max(0, Math.floor((current - ts) / 1000))
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m ago`
}

export function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export const THREAT_ICONS: Record<ThreatType, LucideIcon> = {
  fire: Flame,
  intrusion: ShieldAlert,
  accident: CarFront,
  violence: Users,
}

export const SEVERITY_STYLES: Record<Severity, { label: string; tone: 'threat' | 'warn' | 'info' }> = {
  critical: { label: 'CRITICAL', tone: 'threat' },
  high: { label: 'HIGH', tone: 'threat' },
  medium: { label: 'MEDIUM', tone: 'warn' },
  low: { label: 'LOW · REVIEW', tone: 'info' },
}
