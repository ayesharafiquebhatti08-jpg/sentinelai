'use client'

import { motion } from 'motion/react'
import { Ban, CircleCheck, Clock, Lock, MapPin, ShieldCheck, Siren, Truck, UserCheck, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPreciseTime, formatRelative, SEVERITY_STYLES, THREAT_ICONS } from '@/lib/sentinel/format'
import { REVIEW_THRESHOLD, SCENARIOS, ZONES } from '@/lib/sentinel/scenarios'
import { sentinel } from '@/lib/sentinel/store'
import type { Incident } from '@/lib/sentinel/types'
import { NeonBadge } from './neon-badge'

type CardTone = 'threat' | 'warn' | 'info' | 'safe'

const TONE_STYLES: Record<CardTone, { accent: string; tile: string; value: string; bar: string; banner: string }> = {
  threat: {
    accent: 'bg-threat shadow-[0_0_14px_var(--threat)]',
    tile: 'neon-threat',
    value: 'text-threat text-glow-threat',
    bar: 'bg-threat shadow-[0_0_10px_var(--threat)]',
    banner: 'bg-gradient-to-r from-threat via-threat/85 to-threat/45 text-white',
  },
  warn: {
    accent: 'bg-warn shadow-[0_0_14px_var(--warn)]',
    tile: 'neon-warn',
    value: 'text-warn',
    bar: 'bg-warn shadow-[0_0_10px_var(--warn)]',
    banner: 'border-b border-warn/20 bg-warn/[0.08] text-warn',
  },
  safe: {
    accent: 'bg-safe shadow-[0_0_14px_var(--safe)]',
    tile: 'neon-safe',
    value: 'text-safe',
    bar: 'bg-safe shadow-[0_0_10px_var(--safe)]',
    banner: 'border-b border-safe/20 bg-safe/[0.08] text-safe',
  },
  info: {
    accent: 'bg-info shadow-[0_0_14px_var(--info)]',
    tile: 'neon-info',
    value: 'text-info',
    bar: 'bg-info shadow-[0_0_10px_var(--info)]',
    banner: 'border-b border-info/20 bg-info/[0.08] text-info',
  },
}

export function ThreatCard({ incident, now }: { incident: Incident; now: number }) {
  const Icon = THREAT_ICONS[incident.type]
  const zone = ZONES[incident.zoneId]
  const sev = SEVERITY_STYLES[incident.severity]
  const isReview = incident.queue === 'review'
  const dispatched = Boolean(incident.dispatchedAt)
  const protocol = Boolean(incident.protocolAt)
  const onSite = Boolean(incident.onSiteAt)
  const closing = Boolean(incident.closingAt)
  const contained = dispatched || protocol
  const tone: CardTone = isReview ? 'info' : closing ? 'safe' : contained ? 'warn' : 'threat'
  const t = TONE_STYLES[tone]

  const bannerText = isReview
    ? 'Low Confidence · Awaiting Human Verification'
    : closing
      ? 'Problem Resolved · Archiving to Audit Log'
      : onSite
        ? 'Team On-Site · Response In Progress'
        : dispatched
          ? 'Units Dispatched · Response In Progress'
          : contained
            ? 'Response In Progress'
            : `Critical Alert · ${SCENARIOS[incident.type].alertLabel}`

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className={cn(
        'panel relative overflow-hidden rounded-2xl',
        tone === 'threat' && 'panel-alert',
        tone === 'warn' && 'panel-warn',
      )}
      aria-label={`${incident.title} in Zone ${incident.zoneId}`}
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 z-10 w-[3px]', t.accent)} />

      <div className={cn('relative flex items-center justify-between gap-3 overflow-hidden px-5 py-2', t.banner)}>
        {tone === 'threat' && (
          <span
            aria-hidden="true"
            className="animate-threat-flash pointer-events-none absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"
          />
        )}
        <span className="relative flex min-w-0 items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
          {tone === 'threat' && <Siren className="size-3.5 shrink-0 animate-pulse" aria-hidden="true" />}
          <span className="truncate">{bannerText}</span>
        </span>
        <span className="relative shrink-0 font-mono text-[10px] font-medium tracking-wider opacity-80">{incident.id}</span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3.5">
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', t.tile)}>
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-white">{incident.title}</h3>
            <div className="mt-1.5 flex flex-col gap-1 font-mono text-[11px] text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  Zone {zone.id} · {zone.name}
                </span>
              </span>
              <span className="flex items-center gap-1.5" suppressHydrationWarning>
                <Clock className="size-3 shrink-0" aria-hidden="true" />
                <time dateTime={new Date(incident.detectedAt).toISOString()} className="text-white/80">
                  {formatPreciseTime(incident.detectedAt)}
                </time>
                <span className="opacity-70">· {formatRelative(incident.detectedAt, now)}</span>
              </span>
            </div>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-muted-foreground">{incident.summary}</p>

        <div className="rounded-xl border border-border bg-black/25 p-3.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">AI Confidence</p>
              <p className={cn('tabular mt-1 text-2xl font-bold leading-none tracking-tight', t.value)}>
                {incident.confidence.toFixed(1)}%
              </p>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Threshold {REVIEW_THRESHOLD}%
            </p>
          </div>
          <div
            className="relative mt-3 h-1 rounded-full bg-white/[0.07]"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={incident.confidence}
            aria-label="AI confidence score"
          >
            <motion.div
              className={cn('h-full rounded-full', t.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${incident.confidence}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <span
              className="absolute -top-1 h-3 w-px bg-white/50"
              style={{ left: `${REVIEW_THRESHOLD}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <NeonBadge tone={sev.tone} size="xs" solid={incident.severity === 'critical' && tone === 'threat'}>
            {sev.label}
          </NeonBadge>
          {incident.tags.map((tag) => (
            <NeonBadge key={tag} tone="neutral" size="xs">
              {tag}
            </NeonBadge>
          ))}
          {closing ? (
            <NeonBadge tone="safe" size="xs" icon={CircleCheck}>
              Problem Resolved
            </NeonBadge>
          ) : onSite ? (
            <NeonBadge tone="warn" size="xs" icon={Wrench}>
              Team On-Site &amp; Working
            </NeonBadge>
          ) : dispatched ? (
            <NeonBadge tone="warn" size="xs" icon={Truck}>
              Units Dispatched
            </NeonBadge>
          ) : null}
          {protocol && (
            <NeonBadge tone="warn" size="xs" icon={ShieldCheck}>
              Protocol Active
            </NeonBadge>
          )}
        </div>

        {dispatched && <ResponseSteps stage={closing ? 2 : onSite ? 1 : 0} />}

        <div className="border-t border-border pt-4">
          {isReview ? (
            <div className="grid grid-cols-2 gap-2.5">
              <ActionButton tone="threat" icon={UserCheck} onClick={() => sentinel.escalate(incident.id)}>
                Verify & Escalate
              </ActionButton>
              <ActionButton tone="neutral" icon={Ban} onClick={() => sentinel.dismiss(incident.id)}>
                Dismiss False Alarm
              </ActionButton>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <ActionButton
                tone="warn"
                icon={Truck}
                done={dispatched}
                doneLabel={onSite ? 'Team On-Site & Working' : 'Units Dispatched'}
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
              <ActionButton
                tone="safe"
                icon={CircleCheck}
                done={closing}
                doneLabel="Problem Resolved"
                onClick={() => sentinel.resolve(incident.id)}
                className="col-span-2"
              >
                Resolve Incident
              </ActionButton>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}

const ACTION_TONES = {
  threat:
    'border-threat/45 bg-gradient-to-b from-threat/30 to-threat/10 text-white hover:border-threat hover:from-threat hover:to-threat/80 hover:shadow-[0_0_26px_-6px_var(--threat)]',
  warn: 'border-warn/30 bg-gradient-to-b from-warn/15 to-warn/[0.04] text-warn hover:border-warn/60 hover:from-warn/25 hover:to-warn/10 hover:shadow-[0_0_24px_-8px_var(--warn)]',
  safe: 'border-safe/30 bg-gradient-to-b from-safe/15 to-safe/[0.04] text-safe hover:border-safe/60 hover:from-safe/25 hover:to-safe/10 hover:shadow-[0_0_24px_-8px_var(--safe)]',
  neutral:
    'border-border bg-gradient-to-b from-white/[0.06] to-white/[0.02] text-white/85 hover:border-white/20 hover:from-white/[0.1] hover:text-white',
} as const

function ActionButton({
  tone,
  icon: Icon,
  onClick,
  children,
  done,
  doneLabel,
  className,
}: {
  tone: keyof typeof ACTION_TONES
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  children: React.ReactNode
  done?: boolean
  doneLabel?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={done}
      className={cn(
        'flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-xs font-semibold leading-tight transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 enabled:active:scale-[0.98]',
        done
          ? tone === 'safe'
            ? 'cursor-default border-safe/40 bg-safe/15 text-safe'
            : 'cursor-default border-warn/25 bg-warn/[0.06] text-warn/75'
          : ACTION_TONES[tone],
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{done ? doneLabel : children}</span>
    </button>
  )
}

const RESPONSE_STEPS = ['Units Dispatched', 'Team On-Site & Working', 'Problem Resolved'] as const

function ResponseSteps({ stage }: { stage: 0 | 1 | 2 }) {
  return (
    <div className="rounded-xl border border-border bg-black/25 px-4 py-3.5" role="list" aria-label="Response progress">
      <div className="flex items-center">
        {RESPONSE_STEPS.map((label, i) => {
          const reached = i <= stage
          const current = i === stage && stage < 2
          const done = i === 2 && stage === 2
          return (
            <div key={label} role="listitem" aria-label={label} className={cn('flex items-center', i < 2 && 'flex-1')}>
              <span
                className={cn(
                  'size-2.5 shrink-0 rounded-full transition-all duration-500',
                  !reached && 'bg-white/15',
                  reached && !done && 'bg-warn shadow-[0_0_10px_var(--warn)]',
                  done && 'bg-safe shadow-[0_0_10px_var(--safe)]',
                  current && 'animate-pulse',
                )}
              />
              {i < 2 && (
                <span className="relative mx-2 h-px flex-1 overflow-hidden bg-white/10">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-warn/70"
                    initial={false}
                    animate={{ width: i < stage ? '100%' : '0%' }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em]">
        {RESPONSE_STEPS.map((label, i) => (
          <span key={label} className={cn(i <= stage ? (i === 2 ? 'text-safe' : 'text-warn') : 'text-muted-foreground/60')}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
