'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { Crosshair, Signal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime, THREAT_ICONS } from '@/lib/sentinel/format'
import { SCENARIOS } from '@/lib/sentinel/scenarios'
import type { Incident, Zone } from '@/lib/sentinel/types'

function jitter(seed: number, tick: number) {
  const x = Math.sin(seed * 97.13 + tick * 1.7) * 10000
  return x - Math.floor(x)
}

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
  const latencyTone = latency > 55 ? 'text-warn' : 'text-safe'
  const fps = 30 - Math.round(jitter(zone.id.charCodeAt(0) + 3, tick) * 2)

  const contained = threat && (threat.dispatchedAt || threat.protocolAt)
  const ThreatIcon = threat ? THREAT_ICONS[threat.type] : null

  const status = threat
    ? contained
      ? { label: 'RESPONDING', className: 'bg-warn/15 text-warn border-warn/40' }
      : { label: 'THREAT', className: 'bg-threat text-white border-threat' }
    : reviewCount > 0
      ? { label: 'REVIEW', className: 'bg-info/15 text-info border-info/40' }
      : { label: 'CLEAR', className: 'bg-safe/15 text-safe border-safe/35' }

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card transition-shadow duration-500',
        threat && !contained ? 'border-threat/60 glow-threat' : threat ? 'border-warn/50 glow-warn' : 'border-border',
      )}
      aria-label={`Zone ${zone.id}: ${zone.name}`}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        <Image
          src={zone.image || '/placeholder.svg'}
          alt={`Live surveillance feed of ${zone.name}`}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-80 saturate-[0.6] transition-transform duration-[6000ms] group-hover:scale-105"
          priority={zone.id === 'A'}
        />
        <div className="scanlines pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="animate-scan pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-transparent via-info/10 to-transparent"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" aria-hidden="true" />

        {threat && !contained && (
          <div className="animate-threat-flash pointer-events-none absolute inset-0 bg-threat" aria-hidden="true" />
        )}

        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white backdrop-blur">
          <span className="size-1.5 animate-pulse rounded-full bg-threat" aria-hidden="true" />
          REC
        </div>
        <div className="absolute right-2.5 top-2.5 font-mono text-[10px] text-white/85 tabular" suppressHydrationWarning>
          {now ? formatTime(now) : '--:--:--'}
        </div>

        <AnimatePresence>
          {threat && ThreatIcon && (
            <motion.div
              key={threat.id}
              initial={{ opacity: 0, scale: 1.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-md border-2 border-dashed px-4 py-3',
                  contained ? 'border-warn' : 'border-threat',
                )}
              >
                <Crosshair
                  className={cn('absolute -left-2 -top-2 size-4', contained ? 'text-warn' : 'text-threat')}
                  aria-hidden="true"
                />
                <ThreatIcon className={cn('size-6', contained ? 'text-warn' : 'text-threat')} aria-hidden="true" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
                  {SCENARIOS[threat.type].alertLabel}
                </span>
                <span className="font-mono text-[10px] text-white/80 tabular">{threat.confidence.toFixed(1)}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-x-2.5 bottom-2 flex items-end justify-between gap-2 font-mono text-[10px] text-white/85">
          <span>{zone.camId}</span>
          <span className="tabular">
            {fps}FPS · 1080p
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Zone {zone.id}</p>
          <h3 className="truncate text-sm font-medium">{zone.name}</h3>
        </div>
        <span
          className={cn(
            'shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider',
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      <dl className="grid grid-cols-3 border-t border-border font-mono text-[10px]">
        <div className="px-3.5 py-2">
          <dt className="text-muted-foreground">HEALTH</dt>
          <dd className="mt-0.5 flex items-center gap-1 text-safe">
            <span className="size-1.5 rounded-full bg-safe" aria-hidden="true" />
            Online
          </dd>
        </div>
        <div className="border-x border-border px-3.5 py-2">
          <dt className="text-muted-foreground">LATENCY</dt>
          <dd className={cn('mt-0.5 flex items-center gap-1 tabular', latencyTone)} suppressHydrationWarning>
            <Signal className="size-3" aria-hidden="true" />
            {now ? `${latency}ms` : '--'}
          </dd>
        </div>
        <div className="px-3.5 py-2">
          <dt className="text-muted-foreground">SENSORS</dt>
          <dd className="mt-0.5 truncate text-foreground/80">{zone.sensors.join(' · ')}</dd>
        </div>
      </dl>
    </article>
  )
}
