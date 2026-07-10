import type { DrawState } from "./drawState";
import type { DrawPosition } from "../components/CirclePoints";

type TeamRecord = {
  fifa_code: string;
  name_en: string;
};

type GameRecord = {
  type: "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
  home_score: string;
  away_score: string;
  home_team_name_en: string;
  away_team_name_en: string;
  home_penalty_score: string;
  away_penalty_score: string;
  home_team_label: string;
  away_team_label: string;
  id: string;
  finished: "TRUE" | "FALSE";
};

const WORLD_CUP_26_BASE_PATH = "https://worldcup26.ir";

const TYPE_TO_RING_INDEX: Record<string, number> = {
  r32: 0,
  r16: 2,
  qf: 3,
  sf: 4,
  final: 5,
};

function getWinnerIsoCode(
  game: GameRecord,
  teamsMap: Record<string, string>,
): string | null {
  if (game.finished === "FALSE") {
    return null;
  }
  const homeScore =
    game.home_penalty_score && game.home_penalty_score !== "null"
      ? Number(game.home_penalty_score)
      : Number(game.home_score);
  const awayScore =
    game.away_penalty_score && game.away_penalty_score !== "null"
      ? Number(game.away_penalty_score)
      : Number(game.away_score);

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return null;
  }

  if (homeScore === awayScore) {
    return null;
  }

  const winnerName =
    homeScore > awayScore ? game.home_team_name_en : game.away_team_name_en;

  return teamsMap[winnerName] ?? null;
}

function getTeamFromGame(
  game: GameRecord | undefined,
  teamsMap: Record<string, string>,
): { isoCode: string; team: string }[] {
  if (!game) {
    return [];
  }

  const homeIsoCode = teamsMap[game.home_team_name_en];
  const awayIsoCode = teamsMap[game.away_team_name_en];

  if (!homeIsoCode || !awayIsoCode) {
    return [];
  }

  return [
    {
      isoCode: homeIsoCode,
      team: game.home_team_name_en,
    },
    {
      isoCode: awayIsoCode,
      team: game.away_team_name_en,
    },
  ];
}

export async function fetchLiveDrawState(): Promise<{
  state: DrawState;
  positions: DrawPosition[];
  beatByScores: Record<string, string>;
}> {
  const [teamsResponse, gamesResponse] = await Promise.all([
    fetch(`${WORLD_CUP_26_BASE_PATH}/get/teams`),
    fetch(`${WORLD_CUP_26_BASE_PATH}/get/games`),
  ]);

  if (!teamsResponse.ok) {
    throw new Error("Failed to load team data.");
  }

  if (!gamesResponse.ok) {
    throw new Error("Failed to load game data.");
  }

  const [teamsData, gamesData]: [
    { teams: TeamRecord[] },
    { games: GameRecord[] },
  ] = await Promise.all([teamsResponse.json(), gamesResponse.json()]);

  const teamsMap = teamsData.teams.reduce<Record<string, string>>(
    (acc, { fifa_code, name_en }) => {
      acc[name_en] = fifa_code;
      return acc;
    },
    {},
  );

  const winners: Record<string, string> = {};
  const beatByScores: Record<string, string> = {};
  const positions: DrawPosition[] = [];

  function getGameScore(game: GameRecord): string | null {
    const homeScore = Number(game.home_score);
    const awayScore = Number(game.away_score);

    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
      return null;
    }

    const baseScore = `(${homeScore}-${awayScore})`;
    const hasPenaltyScore =
      game.home_penalty_score &&
      game.home_penalty_score !== "null" &&
      game.away_penalty_score &&
      game.away_penalty_score !== "null";

    if (homeScore === awayScore && hasPenaltyScore) {
      return `${baseScore}PK:${game.home_penalty_score}-${game.away_penalty_score}`;
    }

    return baseScore;
  }

  // generate positions list by recursively iterating on source home and away teams starting with type==="final"
  const finalGameIndex = gamesData.games.findIndex(
    ({ type }) => type === "final",
  );

  let pairIndex = 0;

  const leafWalk = (index: number) => {
    if (index < 0) {
      return;
    }

    const game = gamesData.games[index];
    const homeTeamId = game.home_team_label.substring(13);
    const awayTeamId = game.away_team_label.substring(13);
    const homeTeamIndex = gamesData.games.findIndex(
      ({ id }) => id === homeTeamId,
    );
    const awayTeamIndex = gamesData.games.findIndex(
      ({ id }) => id === awayTeamId,
    );
    const winnerIsoCode = getWinnerIsoCode(game, teamsMap);
    const score = getGameScore(game);

    const ringIndex = TYPE_TO_RING_INDEX[game.type];
    // index for each ring, which increments by 2 ^ ring
    const bracketPairIndex =
      ringIndex > 0 ? pairIndex / Math.pow(2, ringIndex - 1) : pairIndex;

    if (ringIndex !== undefined && pairIndex !== undefined) {
      if (winnerIsoCode) {
        winners[`${ringIndex}-pair-${bracketPairIndex}`] = winnerIsoCode;
      }

      if (score) {
        beatByScores[`${ringIndex}-pair-${bracketPairIndex}`] = score;
      }
    }

    if (homeTeamIndex < 0 && awayTeamIndex < 0) {
      const teams = getTeamFromGame(game, teamsMap);

      teams.forEach((team) => {
        positions.push({
          position: positions.length,
          pair: pairIndex,
          isoCode: team.isoCode,
          team: team.team,
        });
      });
      pairIndex++;

      return;
    }

    leafWalk(homeTeamIndex);
    leafWalk(awayTeamIndex);
  };

  leafWalk(finalGameIndex);

  return {
    state: { v: 1, winners },
    positions,
    beatByScores,
  };
}
