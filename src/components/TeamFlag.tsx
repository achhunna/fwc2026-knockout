import { memo } from 'react'
import { getFlagPath } from '../lib/flags'
import type { Team } from '../lib/drawTree'

type TeamFlagProps = {
  team: Team
  className?: string
}

export const TeamFlag = memo(function TeamFlag({ team, className }: TeamFlagProps) {
  return (
    <img
      src={getFlagPath(team.isoCode)}
      alt={team.name}
      className={className}
      draggable={false}
    />
  )
})
