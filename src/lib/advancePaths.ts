import { NEXT_RING, getPairIndex, type PlayableRing } from './drawTree'

export type PathPoint = {
  x: number
  y: number
}

type BuildAdvancePathArgs = {
  ringIndex: PlayableRing
  winnerSlotIndex: number
  ringPoints: PathPoint[][]
  getRingRadius: (ringIndex: number) => number
  getPairArcMidpoint: (pairIndex: number, ringIndex: number) => PathPoint
}

export function buildAdvancePath({
  ringIndex,
  winnerSlotIndex,
  ringPoints,
  getRingRadius,
  getPairArcMidpoint,
}: BuildAdvancePathArgs): string | null {
  const pairIndex = getPairIndex(winnerSlotIndex)
  const nextRing = NEXT_RING[ringIndex]

  if (nextRing === null) {
    return null
  }

  const start = ringPoints[ringIndex][winnerSlotIndex]
  const destination = ringPoints[nextRing][pairIndex]
  const isSecondInPair = winnerSlotIndex % 2 === 1
  const sweep = isSecondInPair ? 0 : 1

  if (ringIndex === 0) {
    const bridge = ringPoints[1][winnerSlotIndex]
    const midpoint = getPairArcMidpoint(pairIndex, 1)
    const radius = getRingRadius(1)

    return [
      `M ${start.x} ${start.y}`,
      `L ${bridge.x} ${bridge.y}`,
      `A ${radius} ${radius} 0 0 ${sweep} ${midpoint.x} ${midpoint.y}`,
      `L ${destination.x} ${destination.y}`,
    ].join(' ')
  }

  const midpoint = getPairArcMidpoint(pairIndex, ringIndex)
  const radius = getRingRadius(ringIndex)

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 0 ${sweep} ${midpoint.x} ${midpoint.y}`,
    `L ${destination.x} ${destination.y}`,
  ].join(' ')
}

export function getPointOnPath(pathElement: SVGPathElement, progress: number): PathPoint {
  const length = pathElement.getTotalLength()
  const point = pathElement.getPointAtLength(length * progress)

  return { x: point.x, y: point.y }
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}
