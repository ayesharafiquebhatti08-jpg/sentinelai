'use client'

import { motion } from 'motion/react'
import { Activity, ShieldAlert, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPreciseTime, SEVERITY_STYLES, THREAT_ICONS } from '@/lib/sentinel/format'
import { ZONES, type Zone } from '@/lib/sentinel/scenarios'
import type { Incident } from '@/lib/sentinel/types'
import { NeonBadge, type Tone } from './neon-badge'

export function CameraCard({
  zone,
  now,
  threat,
  reviewCount,
}: {
  zone: Zone
  now: number
  threat?: Incident
  reviewCount: number
}) {
  const Icon = threat ? THREAT_ICONS[threat.type] : Video
  const sev = threat ? SEVERITY_STYLES[threat.severity] : null

  const dispatched = Boolean(threat?.dispatchedAt)
  const onSite = Boolean(threat?.onSiteAt)
  const closing = Boolean(threat?.closingAt)
  const contained = dispatched || threat?.protocolAt

  const status: { label: string; tone: Tone; solid?: boolean; pulse?: boolean } = threat
    ? closing
      ? { label: 'Resolved', tone: 'safe' }
      : onSite
        ? { label: 'On-Site', tone: 'warn', pulse: true }
        : contained
          ? { label: 'Units Dispatched', tone: 'warn', pulse: true }
          : { label: 'Threat', tone: 'threat', solid: true, pulse: true }
    : reviewCount > 0
      ? { label: 'Review', tone: 'info' }
      : { label: 'Clear', tone: 'safe' }

  const hudColor = threat
    ? closing
      ? 'border-safe'
      : onSite
        ? 'border-warn'
        : contained
          ? 'border-warn'
          : 'border-threat'
    : 'border-white/40'

  return (
    <article
      className={cn(
        'panel relative flex flex-col overflow-hidden rounded-2xl border',
        threat ? (threat.severity === 'critical' ? 'panel-alert' : 'panel-warn') : 'border-border',
      )}
      aria-label={`Camera feed for Zone ${zone.id} - ${zone.name}`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/60">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-luminosity filter contrast-125"
          style={{ backgroundImage: `url(${zone.image})` }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        <div className="absolute inset-x-3 top-3 flex items-center justify-between font-mono text-[10px]">
          <span className="flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 text-white/90 backdrop-blur-md">
            <span className="size-2 rounded-full bg-threat animate-pulse" aria-hidden="true" />
            <span className="font-bold tracking-wider">REC</span>
          </span>
          <span className="rounded bg-black/60 px-2 py-0.5 text-white/80 backdrop-blur-md tabular tracking-widest" suppressHydrationWarning>
            {formatPreciseTime(now)}
          </span>
        </div>

        {threat && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'relative flex max-w-[280px] flex-col items-center gap-1.5 rounded-2xl border bg-black/85 px-5 py-3 text-center backdrop-blur-xl shadow-2xl',
                threat.severity === 'critical' ? 'border-threat/60 shadow-[0_0_30px_rgba(239,68,68,0.25)]' : 'border-warn/60 shadow-[0_0_30px_rgba(245,158,11,0.25)]',
              )}
            >
              <span className={cn('flex size-9 items-center justify-center rounded-xl', threat.severity === 'critical' ? 'neon-threat' : 'neon-warn')}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                {threat.title}
              </span>
              <span className={cn('tabular font-mono text-sm font-bold', threat.severity === 'critical' ? 'text-threat' : 'text-warn')}>
                {threat.confidence.toFixed(1)}%
              </span>
            </motion.div>
          </div>
        )}

        <div className={cn('absolute inset-0 pointer-events-none border-2 transition-colors duration-500', hudColor)} aria-hidden="true" />
        <div className="absolute bottom-2 left-2 font-mono text-[10px] tracking-wider text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
          {zone.code}
        </div>
        <div className="absolute bottom-2 right-2 font-mono text-[10px] tracking-wider text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
          29FPS · 1080p
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-black/30 px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Zone {zone.id}
          </p>
          <h3 className="truncate text-sm font-semibold tracking-tight text-white">{zone.name}</h3>
        </div>
        <NeonBadge tone={status.tone} size="sm" solid={status.solid} pulse={status.pulse}>
          {status.label}
        </NeonBadge>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-black/50 px-4 py-2 font-mono text-[10px]">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Health</p>
          <p className="mt-0.5 flex items-center gap-1 font-semibold text-safe">
            <span className="size-1.5 rounded-full bg-safe" aria-hidden="true" /> Online
          </p>
        </div>
        <div className="pl-4">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Latency</p>
          <p className="mt-0.5 font-semibold text-white/90">⚡ {zone.latency}ms</p>
        </div>
        <div className="pl-4">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Sensors</p>
          <p className="truncate mt-0.5 font-semibold text-white/80">{zone.sensors}</p>
        </div>
      </div>
    </article>
  )
}
