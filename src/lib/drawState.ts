import { prunePairWinners, type DrawPosition, type Team } from "./drawTree";

export type DrawState = {
  v: 1;
  winners: Record<string, string>;
};

function teamByIsoCode(
  positions: DrawPosition[] | null,
  isoCode: string,
): Team | null {
  const position = positions?.find((entry) => entry.isoCode === isoCode);
  if (!position) {
    return null;
  }

  return {
    isoCode: position.isoCode,
    name: position.team ?? position.isoCode,
  };
}

export function serializeDrawState(pairWinners: Record<string, Team>): string {
  const winners: Record<string, string> = {};

  for (const [key, team] of Object.entries(pairWinners)) {
    winners[key] = team.isoCode;
  }

  const state: DrawState = { v: 1, winners };
  return JSON.stringify(state, null, 2);
}

export function parseDrawState(
  raw: string,
  positions: DrawPosition[] | null,
): { pairWinners: Record<string, Team> } | { error: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    return { error: "Invalid JSON." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { error: "State must be a JSON object." };
  }

  const record = parsed as Partial<DrawState>;
  if (record.v !== 1) {
    return { error: 'Unsupported state version. Expected "v": 1.' };
  }

  if (!record.winners || typeof record.winners !== "object") {
    return { error: 'Missing or invalid "winners" object.' };
  }

  const pairWinners: Record<string, Team> = {};

  for (const [key, isoCode] of Object.entries(record.winners)) {
    if (typeof isoCode !== "string") {
      return { error: `Winner for ${key} must be an ISO code string.` };
    }

    const team = teamByIsoCode(positions, isoCode);
    if (!team) {
      return { error: `Unknown team ISO code "${isoCode}" for ${key}.` };
    }

    pairWinners[key] = team;
  }

  return {
    pairWinners: prunePairWinners(positions, pairWinners),
  };
}
