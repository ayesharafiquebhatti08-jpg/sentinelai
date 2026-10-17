export type ZoneId = 'A' | 'B' | 'C' | 'D'

export type ThreatType = 'fire' | 'intrusion' | 'accident' | 'violence'

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type Queue = 'active' | 'review'

export type Resolution = 'resolved' | 'false-alarm'

export type ActionKind =
  | 'detected'
  | 'routed-review'
  | 'escalated'
  | 'dispatch'
  | 'protocol'
  | 'resolved'
  | 'dismissed'

export interface IncidentAction {
  at: number
  kind: ActionKind
  label: string
}

export interface Incident {
  id: string
  type: ThreatType
  zoneId: ZoneId
  title: string
  summary: string
  confidence: number
  severity: Severity
  queue: Queue
  tags: string[]
  detectedAt: number
  dispatchedAt?: number
  protocolAt?: number
  resolvedAt?: number
  resolution?: Resolution
  source: 'simulation' | 'ambient' | 'seed'
  actions: IncidentAction[]
}

export interface Zone {
  id: ZoneId
  name: string
  camId: string
  image: string
  baseLatency: number
  cameras: number
  sensors: string[]
}

export interface SentinelState {
  version: number
  hydrated: boolean
  seq: number
  ambient: boolean
  incidents: Incident[]
  audit: Incident[]
}
