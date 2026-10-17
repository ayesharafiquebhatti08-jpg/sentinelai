'use client'

import { Fragment, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Archive, ChevronDown, Download, Search, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime, formatDuration, formatTime, SEVERITY_STYLES, THREAT_ICONS } from '@/lib/sentinel/format'
import { SCENARIOS, ZONES } from '@/lib/sentinel/scenarios'
import { sentinel } from '@/lib/sentinel/store'
import type { Incident, Resolution } from '@/lib/sentinel/types'
import { NeonBadge } from './neon-badge'

type ResFilter = 'all' | Resolution

function exportCsv(rows: Incident[]) {
  const header = ['Incident ID', 'Type', 'Zone', 'Detected', 'Closed', 'Confidence', 'Severity', 'Outcome', 'Actions']
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = rows.map((r) =>
    [
      r.id,
      SCENARIOS[r.type].alertLabel,
      `Zone ${r.zoneId} - ${ZONES[r.zoneId].name}`,
      formatDateTime(r.detectedAt),
      r.resolvedAt ? formatDateTime(r.resolvedAt) : '',
      `${r.confidence.toFixed(1)}%`,
      r.severity,
      r.resolution === 'false-alarm' ? 'False Alarm' : 'Resolved',
      r.actions.map((a) => `[${formatTime(a.at)}] ${a.label}`).join(' | '),
    ]
      .map((v) => escape(String(v)))
      .join(','),
  )
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sentinelai-audit-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AuditLog({ audit }: { audit: Incident[] }) {
  const [query, setQuery] = useState('')
  const [res, setRes] = useState<ResFilter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return audit.filter((r) => {
      if (res !== 'all' && r.resolution !== res) return false
      if (!q) return true
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        ZONES[r.zoneId].name.toLowerCase().includes(q) ||
        `zone ${r.zoneId}`.toLowerCase().includes(q)
      )
    })
  }, [audit, query, res])

  const resolvedCount = audit.filter((a) => a.resolution === 'resolved').length
  const falseCount = audit.filter((a) => a.resolution === 'false-alarm').length
  const durations = audit.filter((a) => a.resolvedAt).map((a) => a.resolvedAt! - a.detectedAt)
  const avgMs = durations.length ? durations.reduce((s, d) => s + d, 0) / durations.length : 0

  return (
    <section aria-labelledby="audit-heading" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Archived Records', value: audit.length },
          { label: 'Resolved Threats', value: resolvedCount },
          { label: 'False Alarms Filtered', value: falseCount },
          { label: 'Avg. Time to Close', value: durations.length ? formatDuration(avgMs) : '—' },
        ].map((s) => (
          <div key={s.label} className="panel rounded-2xl p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{s.label}</p>
            <p className="tabular mt-3 text-3xl font-bold tracking-tight text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="panel overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 id="audit-heading" className="flex items-center gap-2 text-sm font-semibold">
              <Archive className="size-4 text-muted-foreground" aria-hidden="true" />
              Incident History & Audit Log
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Immutable record of closed incidents and operator actions for compliance review.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <label htmlFor="audit-search" className="sr-only">
                Search audit log
              </label>
              <input
                id="audit-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ID, zone, type…"
                className="h-8 w-full rounded-md border border-input bg-background/60 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus-visible:outline-2 sm:w-56"
              />
            </div>
            <div className="flex gap-1 rounded-md bg-background/60 p-0.5" role="group" aria-label="Filter by outcome">
              {(
                [
                  ['all', 'All'],
                  ['resolved', 'Resolved'],
                  ['false-alarm', 'False Alarm'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={res === id}
                  onClick={() => setRes(id)}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs transition-colors',
                    res === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => exportCsv(rows)}
                disabled={rows.length === 0}
                className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 text-xs transition-colors hover:bg-muted disabled:opacity-40 sm:flex-none"
              >
                <Download className="size-3.5" aria-hidden="true" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all archived audit records? This cannot be undone.')) sentinel.clearAudit()
                }}
                disabled={audit.length === 0}
                className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 text-xs text-muted-foreground transition-colors hover:border-threat/40 hover:text-threat disabled:opacity-40"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Clear</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-border bg-background/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Incident</th>
                <th scope="col" className="px-5 py-3 font-medium">Zone</th>
                <th scope="col" className="px-5 py-3 font-medium">Detected</th>
                <th scope="col" className="px-5 py-3 font-medium">Confidence</th>
                <th scope="col" className="px-5 py-3 font-medium">Actions Taken</th>
                <th scope="col" className="px-5 py-3 font-medium">Outcome</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Details</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const Icon = THREAT_ICONS[r.type]
                const open = expanded === r.id
                const sev = SEVERITY_STYLES[r.severity]
                const responseActions = r.actions.filter((a) => a.kind === 'dispatch' || a.kind === 'protocol' || a.kind === 'escalated')
                return (
                  <Fragment key={r.id}>
                    <tr className="border-b border-border/60 transition-colors hover:bg-muted/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{r.title}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{r.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        <span className="font-mono text-foreground">{r.zoneId}</span> · {ZONES[r.zoneId].name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-muted-foreground tabular">
                        {formatDateTime(r.detectedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="tabular font-mono">{r.confidence.toFixed(1)}%</span>
                          <NeonBadge tone={sev.tone} size="xs">
                            {sev.label.split(' ')[0]}
                          </NeonBadge>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {responseActions.length === 0 ? (
                            <span className="text-muted-foreground">Manual review only</span>
                          ) : (
                            responseActions.map((a, idx) => (
                              <span key={idx} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground/80">
                                {a.kind === 'dispatch' ? 'QRT Dispatched' : a.kind === 'protocol' ? 'Protocol' : 'Escalated'}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {r.resolution === 'false-alarm' ? (
                          <NeonBadge tone="info" size="xs" dot>
                            False Alarm
                          </NeonBadge>
                        ) : (
                          <NeonBadge tone="safe" size="xs" dot>
                            Resolved
                          </NeonBadge>
                        )}
                        {r.resolvedAt && (
                          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                            in {formatDuration(r.resolvedAt - r.detectedAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setExpanded(open ? null : r.id)}
                          aria-expanded={open}
                          aria-controls={`timeline-${r.id}`}
                          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
                          <span className="sr-only">{open ? 'Hide' : 'Show'} timeline for {r.id}</span>
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence initial={false}>
                      {open && (
                        <tr id={`timeline-${r.id}`} className="border-b border-border/60 bg-background/40">
                          <td colSpan={7} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <ol className="relative ml-8 space-y-2.5 border-l border-border py-4 pl-5">
                                {r.actions.map((a, idx) => (
                                  <li key={idx} className="relative">
                                    <span
                                      className={cn(
                                        'absolute -left-[25px] top-1 size-2 rounded-full ring-4 ring-background',
                                        a.kind === 'resolved'
                                          ? 'bg-safe'
                                          : a.kind === 'dismissed' || a.kind === 'routed-review'
                                            ? 'bg-info'
                                            : a.kind === 'detected'
                                              ? 'bg-threat'
                                              : 'bg-warn',
                                      )}
                                      aria-hidden="true"
                                    />
                                    <p className="font-mono text-[10px] text-muted-foreground tabular">{formatDateTime(a.at)}</p>
                                    <p className="text-xs">{a.label}</p>
                                  </li>
                                ))}
                              </ol>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Archive className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">No archived incidents</p>
              <p className="text-xs text-muted-foreground">Resolved and dismissed incidents will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
