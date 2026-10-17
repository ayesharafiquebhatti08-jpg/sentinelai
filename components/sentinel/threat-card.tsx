'use client'

import { motion } from 'motion/react'
import { Ban, CircleCheck, Clock, Lock, MapPin, ShieldCheck, Siren, Truck, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPreciseTime, formatRelative, SEVERITY_STYLES, THREAT_ICONS } from '@/lib/sentinel/format'
import { REVIEW_THRESHOLD, SCENARIOS, ZONES } from '@/lib/sentinel/scenarios'
import { sentinel } from '@/lib/sentinel/store'
import type { Incident } from '@/lib/sentinel/types'

function ConfidenceMeter({ value }: { value: number }) {
  const tone = value < REVIEW_THRESHOLD ? 'bg-info' : value < 85 ? 'bg-warn' : 'bg-threat'
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label="AI confidence score"
      >
        <motion.div
          className={cn('h-full rounded-full', tone)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <div
          className="absolute inset-y-0 w-px bg-foreground/50"
          style={{ left: `${REVIEW_THRESHOLD}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="tabular font-mono text-xs font-semibold">{value.toFixed(1)}%</span>
    </div>
  )
}

export function ThreatCard({ incident, now }: { incident: Incident; now: number }) {
  const Icon = THREAT_ICONS[incident.type]
  const zone = ZONES[incident.zoneId]
  const sev = SEVERITY_STYLES[incident.severity]
  const isReview = incident.queue === 'review'
  const dispatched = Boolean(incident.dispatchedAt)
  const protocol = Boolean(incident.protocolAt)
  const contained = dispatched || protocol

  const banner = isReview
    ? { text: 'LOW CONFIDENCE · AWAITING HUMAN VERIFICATION', className: 'bg-info/15 text-info' }
    : contained
      ? { text: 'RESPONSE IN PROGRESS', className: 'bg-warn/15 text-warn' }
      : { text: `CRITICAL ALERT · ${SCENARIOS[incident.type].alertLabel.toUpperCase()}`, className: 'bg-threat text-white' }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className={cn(
        'overflow-hidden rounded-xl border bg-card',
        isReview ? 'border-info/25' : contained ? 'border-warn/40' : 'border-threat/50 glow-threat',
      )}
      aria-label={`${incident.title} in Zone ${incident.zoneId}`}
    >
      <div className={cn('flex items-center justify-between gap-2 px-3.5 py-1.5', banner.className)}>
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em]">
          {!isReview && !contained && <Siren className="size-3 shrink-0 animate-pulse" aria-hidden="true" />}
          <span className="truncate">{banner.text}</span>
        </span>
        <span className="shrink-0 font-mono text-[10px] opacity-80">{incident.id}</span>
      </div>

      <div className="space-y-3 p-3.5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg border',
              isReview ? 'border-info/30 bg-info/10 text-info' : 'border-threat/30 bg-threat/10 text-threat',
            )}
          >
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-snug">{incident.title}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" />
                Zone {zone.id} · {zone.name}
              </span>
              <span className="flex items-center gap-1" suppressHydrationWarning>
                <Clock className="size-3" aria-hidden="true" />
                <time dateTime={new Date(incident.detectedAt).toISOString()}>{formatPreciseTime(incident.detectedAt)}</time>
                <span className="opacity-70">({formatRelative(incident.detectedAt, now)})</span>
              </span>
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{incident.summary}</p>

        <div>
          <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>AI Confidence</span>
            <span>Threshold {REVIEW_THRESHOLD}%</span>
          </div>
          <ConfidenceMeter value={incident.confidence} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider', sev.className)}>
            {sev.label}
          </span>
          {incident.tags.map((t) => (
            <span
              key={t}
              className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground"
            >
              {t}
            </span>
          ))}
          {dispatched && (
            <span className="flex items-center gap-1 rounded border border-warn/40 bg-warn/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-warn">
              <Truck className="size-3" aria-hidden="true" />
              UNITS DEPLOYED
            </span>
          )}
          {protocol && (
            <span className="flex items-center gap-1 rounded border border-warn/40 bg-warn/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-warn">
              <ShieldCheck className="size-3" aria-hidden="true" />
              PROTOCOL ACTIVE
            </span>
          )}
        </div>

        {isReview ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <ActionButton tone="threat" icon={UserCheck} onClick={() => sentinel.escalate(incident.id)}>
              Verify & Escalate
            </ActionButton>
            <ActionButton tone="neutral" icon={Ban} onClick={() => sentinel.dismiss(incident.id)}>
              Dismiss False Alarm
            </ActionButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
            <ActionButton
              tone="warn"
              icon={Truck}
              done={dispatched}
              doneLabel="Units Deployed"
              onClick={() => sentinel.dispatch(incident.id)}
            >
              Dispatch Quick Response Team
            </ActionButton>
            <ActionButton
              tone="warn"
              icon={Lock}
              done={protocol}
              doneLabel="Protocol Active"
              onClick={() => sentinel.protocol(incident.id)}
            >
              Trigger Warning / Lockdown
            </ActionButton>
            <ActionButton tone="safe" icon={CircleCheck} onClick={() => sentinel.resolve(incident.id)}>
              Resolve Incident
            </ActionButton>
          </div>
        )}
      </div>
    </motion.article>
  )
}

const ACTION_TONES = {
  threat: 'border-threat/40 bg-threat/10 text-threat hover:bg-threat hover:text-white',
  warn: 'border-warn/35 bg-warn/10 text-warn hover:bg-warn hover:text-background',
  safe: 'border-safe/35 bg-safe/10 text-safe hover:bg-safe hover:text-background',
  neutral: 'border-border bg-muted/50 text-foreground/80 hover:bg-muted hover:text-foreground',
} as const

function ActionButton({
  tone,
  icon: Icon,
  onClick,
  children,
  done,
  doneLabel,
}: {
  tone: keyof typeof ACTION_TONES
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  children: React.ReactNode
  done?: boolean
  doneLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={done}
      className={cn(
        'flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-center text-[11px] font-medium leading-tight transition-colors focus-visible:outline-2',
        done
          ? 'cursor-default border-warn/30 bg-warn/5 text-warn/70'
          : ACTION_TONES[tone],
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{done ? doneLabel : children}</span>
    </button>
  )
}
