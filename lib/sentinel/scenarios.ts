import type { Incident, Severity, ThreatType, Zone, ZoneId } from './types'

export const REVIEW_THRESHOLD = 50

export const ZONES: Record<ZoneId, Zone> = {
  A: {
    id: 'A',
    name: 'Main Entrance & Gate',
    camId: 'CAM-A01',
    image: '/feeds/zone-a.png',
    baseLatency: 18,
    cameras: 14,
    sensors: ['ANPR', 'LiDAR'],
  },
  B: {
    id: 'B',
    name: 'Campus Corridor',
    camId: 'CAM-B04',
    image: '/feeds/zone-b.png',
    baseLatency: 24,
    cameras: 12,
    sensors: ['Thermal', 'Smoke'],
  },
  C: {
    id: 'C',
    name: 'Server Room / Restricted Asset',
    camId: 'CAM-C02',
    image: '/feeds/zone-c.png',
    baseLatency: 12,
    cameras: 8,
    sensors: ['Access Ctrl', 'Motion'],
  },
  D: {
    id: 'D',
    name: 'Perimeter Wall',
    camId: 'CAM-D07',
    image: '/feeds/zone-d.png',
    baseLatency: 46,
    cameras: 14,
    sensors: ['Night IR', 'Vibration'],
  },
}

export const ZONE_LIST = Object.values(ZONES)

export const TOTAL_CAMERAS = ZONE_LIST.reduce((sum, z) => sum + z.cameras, 0)

interface Scenario {
  type: ThreatType
  zoneId: ZoneId
  buttonLabel: string
  alertLabel: string
  title: string
  baseSeverity: Severity
  summaries: string[]
  uncertainSummaries: string[]
  tags: string[]
}

export const SCENARIOS: Record<ThreatType, Scenario> = {
  fire: {
    type: 'fire',
    zoneId: 'B',
    buttonLabel: 'Simulate Smoke / Fire Hazard',
    alertLabel: 'Fire Hazard',
    title: 'Smoke & Thermal Anomaly Detected',
    baseSeverity: 'critical',
    summaries: [
      'Rapid smoke density increase near corridor junction B-3. Thermal sensor reports surface temperature spike to 214°C.',
      'Visible smoke plume and flame flicker signature detected adjacent to electrical panel EP-07.',
    ],
    uncertainSummaries: [
      'Faint haze pattern near ceiling vent. Possible steam, dust, or lighting artifact.',
    ],
    tags: ['THERMAL', 'SMOKE DENSITY', 'EVAC-READY'],
  },
  intrusion: {
    type: 'intrusion',
    zoneId: 'C',
    buttonLabel: 'Simulate Unauthorized Intrusion / Theft',
    alertLabel: 'Unauthorized Intrusion',
    title: 'Unauthorized Access to Restricted Asset',
    baseSeverity: 'critical',
    summaries: [
      'Unbadged individual tailgated through secured door C-02. Rack R14 enclosure opened without work order.',
      'Access control mismatch: credential #4471 revoked 3 days ago. Subject handling hardware in aisle 2.',
    ],
    uncertainSummaries: [
      'Brief motion near rack R09 with partial occlusion. Could be scheduled maintenance staff.',
    ],
    tags: ['ACCESS VIOLATION', 'ASSET RISK', 'FACE-MATCH: NONE'],
  },
  accident: {
    type: 'accident',
    zoneId: 'A',
    buttonLabel: 'Simulate Sudden Accident / Collision',
    alertLabel: 'Vehicle Collision',
    title: 'Vehicle Collision at Entry Barrier',
    baseSeverity: 'high',
    summaries: [
      'Sudden deceleration event: vehicle impacted gate barrier at ~32 km/h. Pedestrian detected within 2m.',
      'Two-vehicle collision in entry lane 2. Occupant motion not detected for 8 seconds.',
    ],
    uncertainSummaries: [
      'Abrupt stop detected in lane 1. Possible hard braking without contact.',
    ],
    tags: ['IMPACT', 'MEDICAL-PRIORITY', 'ANPR LOGGED'],
  },
  violence: {
    type: 'violence',
    zoneId: 'D',
    buttonLabel: 'Simulate Aggressive Crowd / Violence',
    alertLabel: 'Crowd Violence',
    title: 'Aggressive Crowd Movement Detected',
    baseSeverity: 'critical',
    summaries: [
      'Crowd density surged to 4.1 persons/m² along wall section D-4. Pose model flags 3 active altercations.',
      'Rapid convergence of 20+ individuals with striking motion signatures near perimeter gate D-2.',
    ],
    uncertainSummaries: [
      'Group clustering near wall section D-6. Motion pattern consistent with sports activity.',
    ],
    tags: ['CROWD SURGE', 'POSE: AGGRESSION', 'AUDIO SPIKE'],
  },
}

export const SCENARIO_LIST = Object.values(SCENARIOS)

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const randBetween = (min: number, max: number) =>
  Math.round((min + Math.random() * (max - min)) * 10) / 10

export function severityFor(confidence: number, base: Severity): Severity {
  if (confidence < REVIEW_THRESHOLD) return 'low'
  if (confidence < 70) return 'medium'
  if (confidence < 85) return 'high'
  return base
}

export function formatIncidentId(seq: number, at: number) {
  const d = new Date(at)
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `INC-${ymd}-${String(seq).padStart(4, '0')}`
}

export function createIncident(
  type: ThreatType,
  seq: number,
  options: {
    confidence?: number
    source?: Incident['source']
    at?: number
  } = {},
): Incident {
  const scenario = SCENARIOS[type]
  const at = options.at ?? Date.now()
  const confidence = options.confidence ?? randBetween(88, 99.4)
  const severity = severityFor(confidence, scenario.baseSeverity)
  const uncertain = confidence < REVIEW_THRESHOLD
  const queue = uncertain ? 'review' : 'active'

  return {
    id: formatIncidentId(seq, at),
    type,
    zoneId: scenario.zoneId,
    title: uncertain ? `Possible ${scenario.alertLabel}` : scenario.title,
    summary: uncertain ? pick(scenario.uncertainSummaries) : pick(scenario.summaries),
    confidence,
    severity,
    queue,
    tags: uncertain ? ['LOW CONFIDENCE', 'HUMAN REVIEW'] : scenario.tags,
    detectedAt: at,
    source: options.source ?? 'simulation',
    actions: [
      {
        at,
        kind: 'detected',
        label: `AI model flagged event at ${confidence.toFixed(1)}% confidence`,
      },
      ...(uncertain
        ? [
            {
              at,
              kind: 'routed-review' as const,
              label: `Below ${REVIEW_THRESHOLD}% threshold, routed to Low-Priority Review Queue`,
            },
          ]
        : []),
    ],
  }
}

export function randomUncertainConfidence() {
  return randBetween(22, 48.9)
}

export function randomAmbientConfidence() {
  return Math.random() < 0.65 ? randBetween(24, 48.9) : randBetween(55, 82)
}

export function randomThreatType(): ThreatType {
  return pick(SCENARIO_LIST).type
}
