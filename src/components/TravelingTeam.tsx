import { useLayoutEffect, useRef } from 'react'
import { easeInOutCubic, getPointOnPath, type PathPoint } from '../lib/advancePaths'

const ADVANCE_DURATION_MS = 900

type AdvanceAnimatorProps = {
  sourceSlotKey: string
  pathD: string
  startPosition: PathPoint
  onPositionChange: (sourceSlotKey: string, position: PathPoint | null) => void
  onComplete: () => void
}

export function AdvanceAnimator({
  sourceSlotKey,
  pathD,
  startPosition,
  onPositionChange,
  onComplete,
}: AdvanceAnimatorProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const onCompleteRef = useRef(onComplete)
  const onPositionChangeRef = useRef(onPositionChange)

  onCompleteRef.current = onComplete
  onPositionChangeRef.current = onPositionChange

  useLayoutEffect(() => {
    const pathElement = pathRef.current
    if (!pathElement) {
      return
    }

    onPositionChangeRef.current(sourceSlotKey, getPointOnPath(pathElement, 0))

    let frameId = 0
    const startedAt = performance.now()

    function animate(now: number) {
      const path = pathRef.current
      if (!path) {
        return
      }

      const elapsed = now - startedAt
      const linearProgress = Math.min(elapsed / ADVANCE_DURATION_MS, 1)
      const progress = easeInOutCubic(linearProgress)

      onPositionChangeRef.current(
        sourceSlotKey,
        getPointOnPath(path, progress),
      )

      if (linearProgress < 1) {
        frameId = requestAnimationFrame(animate)
        return
      }

      onPositionChangeRef.current(sourceSlotKey, null)
      onCompleteRef.current()
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
      onPositionChangeRef.current(sourceSlotKey, null)
    }
  }, [pathD, sourceSlotKey, startPosition.x, startPosition.y])

  return (
    <svg className="circle-points__path-measure" viewBox="0 0 100 100" aria-hidden="true">
      <path ref={pathRef} d={pathD} />
    </svg>
  )
}
