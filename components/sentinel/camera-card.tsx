'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { Signal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime, THREAT_ICONS } from '@/lib/sentinel/format'
import { SCENARIOS } from '@/lib/sentinel/scenarios'
import type { Incident, Zone } from '@/lib/sentinel/types'
import { NeonBadge, type Tone } from './neon-badge'

function jitter(seed: number, tick: number) {
  const x = Math.sin(seed * 97.13 + tick * 1.7) * 10000
  return x - Math.floor(x)
}

const CORNERS = [
  'left-3 top-3 border-l border-t',
  'right-3 top-3 border-r border-t',
  'left-3 bottom-3 border-l border-b',
  'right-3 bottom-3 border-r border-b',
]

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
  const tick = Math.floor(now / 2000)
  const latency = Math.round(zone.baseLatency + jitter(zone.id.charCodeAt(0), tick) * 14)
  const fps = 30 - Math.round(jitter(zone.id.charCodeAt(0) + 3, tick) * 2)

  const contained = Boolean(threat && (threat.dispatchedAt || threat.protocolAt))
  const ThreatIcon = threat ? THREAT_ICONS[threat.type] : null

  const status: { label: string; tone: Tone; solid?: boolean; pulse?: boolean } = threat
    ? contained
      ? { label: 'Responding', tone: 'warn', pulse: true }
      : { label: 'Threat', tone: 'threat', solid: true, pulse: true }
    : reviewCount > 0
      ? { label: 'Review', tone: 'info' }
      : { label: 'Clear', tone: 'safe' }

  const hudColor = threat ? (contained ? 'border-warn' : 'border-threat') : 'border-white/40'

  return (
    <article
      className={cn(
        'panel group relative overflow-hidden rounded-2xl transition-shadow duration-500',
        threat && !contained && 'panel-alert',
        threat && contained && 'panel-warn',
      )}
      aria-label={`Zone ${zone.id}: ${zone.name}`}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        <Image
          src={zone.image || '/placeholder.svg'}
          alt={`Live surveillance feed of ${zone.name}`}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-75 saturate-[0.55] transition-transform duration-[6000ms] group-hover:scale-105"
          priority={zone.id === 'A'}
        />
        <div className="scanlines pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="animate-scan pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-transparent via-info/10 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/55"
          aria-hidden="true"
        />
        {threat && !contained && (
          <div className="animate-threat-flash pointer-events-none absolute inset-0 bg-threat" aria-hidden="true" />
        )}

        {CORNERS.map((c) => (
          <span
            key={c}
            aria-hidden="true"
            className={cn('pointer-events-none absolute size-4 transition-colors duration-500', c, hudColor)}
          />
        ))}

        <div className="absolute left-5 top-5 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-white backdrop-blur-md">
          <span className="size-1.5 animate-pulse rounded-full bg-threat shadow-[0_0_8px_var(--threat)]" aria-hidden="true" />
          REC
        </div>
        <div
          className="absolute right-5 top-5 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] tracking-wider text-white/90 tabular backdrop-blur-md"
          suppressHydrationWarning
        >
          {now ? formatTime(now) : '--:--:--'}
        </div>

        <AnimatePresence>
          {threat && ThreatIcon && (
            <motion.div
              key={threat.id}
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border bg-black/50 px-5 py-3.5 backdrop-blur-md',
                  contained
                    ? 'border-warn/60 shadow-[0_0_32px_-6px_var(--warn)]'
                    : 'border-threat/70 shadow-[0_0_36px_-4px_var(--threat)]',
                )}
              >
                <ThreatIcon className={cn('size-6', contained ? 'text-warn' : 'text-threat')} aria-hidden="true" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                  {SCENARIOS[threat.type].alertLabel}
                </span>
                <span className="font-mono text-xs font-bold text-white/90 tabular">{threat.confidence.toFixed(1)}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-2 font-mono text-[10px] tracking-wider text-white/85">
          <span>{zone.camId}</span>
          <span className="tabular">{fps}FPS · 1080p</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Zone {zone.id}</p>
          <h3 className="mt-0.5 truncate text-[15px] font-semibold tracking-tight text-white">{zone.name}</h3>
        </div>
        <NeonBadge tone={status.tone} solid={status.solid} pulse={status.pulse} dot>
          {status.label}
        </NeonBadge>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <div className="px-5 py-3">
          <dt className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Health</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-safe">
            <span className="size-1.5 rounded-full bg-safe shadow-[0_0_8px_var(--safe)]" aria-hidden="true" />
            Online
          </dd>
        </div>
        <div className="px-5 py-3">
          <dt className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Latency</dt>
          <dd
            className={cn(
              'mt-1 flex items-center gap-1.5 font-mono text-xs font-semibold tabular',
              latency > 55 ? 'text-warn' : 'text-white',
            )}
            suppressHydrationWarning
          >
            <Signal className="size-3 text-muted-foreground" aria-hidden="true" />
            {now ? `${latency}ms` : '--'}
          </dd>
        </div>
        <div className="min-w-0 px-5 py-3">
          <dt className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Sensors</dt>
          <dd className="mt-1 truncate text-xs font-medium text-white/85">{zone.sensors.join(' · ')}</dd>
        </div>
      </dl>
    </article>
  )
}
