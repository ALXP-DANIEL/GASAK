import "server-only";

import { env } from "@/env";

const BASE_URL = "https://api.challonge.com/v1";

function requireApiKey() {
  if (!env.CHALLONGE_API_KEY) {
    throw new Error("Challonge is not configured — set CHALLONGE_API_KEY");
  }
  return env.CHALLONGE_API_KEY;
}

async function challongeGet<T>(path: string): Promise<T> {
  const apiKey = requireApiKey();
  const res = await fetch(
    `${BASE_URL}${path}.json?api_key=${encodeURIComponent(apiKey)}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(
      `Challonge request failed (${res.status}): ${await res.text()}`,
    );
  }
  return res.json();
}

export interface ChallongeParticipant {
  id: number;
  name: string;
  /** Group-stage matches reference these ids instead of the participant id. */
  groupPlayerIds: number[];
}

export interface ChallongeMatch {
  id: number;
  /** Positive = winners bracket, negative = losers bracket (double elim). */
  round: number;
  state: "pending" | "open" | "complete";
  player1Id: number | null;
  player2Id: number | null;
  winnerId: number | null;
  loserId: number | null;
  /** e.g. "3-1" or "2-1,1-2,2-0" for multi-set. */
  scoresCsv: string;
  startedAt: string | null;
}

export interface ChallongeTournament {
  id: number;
  name: string;
  url: string;
  fullChallongeUrl: string;
  tournamentType: string;
  state: string;
}

/**
 * `tournament` accepts a Challonge tournament id, URL slug, or
 * "subdomain-slug" for organization-hosted tournaments.
 */
export async function fetchChallongeTournament(
  tournament: string,
): Promise<ChallongeTournament> {
  const data = await challongeGet<{
    tournament: {
      id: number;
      name: string;
      url: string;
      full_challonge_url: string;
      tournament_type: string;
      state: string;
    };
  }>(`/tournaments/${encodeURIComponent(tournament)}`);
  const t = data.tournament;
  return {
    id: t.id,
    name: t.name,
    url: t.url,
    fullChallongeUrl: t.full_challonge_url,
    tournamentType: t.tournament_type,
    state: t.state,
  };
}

export async function fetchChallongeParticipants(
  tournament: string,
): Promise<ChallongeParticipant[]> {
  const data = await challongeGet<
    {
      participant: {
        id: number;
        name: string | null;
        display_name: string | null;
        group_player_ids: number[] | null;
      };
    }[]
  >(`/tournaments/${encodeURIComponent(tournament)}/participants`);
  return data.map(({ participant }) => ({
    id: participant.id,
    name: participant.display_name ?? participant.name ?? `#${participant.id}`,
    groupPlayerIds: participant.group_player_ids ?? [],
  }));
}

export async function fetchChallongeMatches(
  tournament: string,
): Promise<ChallongeMatch[]> {
  const data = await challongeGet<
    {
      match: {
        id: number;
        round: number;
        state: "pending" | "open" | "complete";
        player1_id: number | null;
        player2_id: number | null;
        winner_id: number | null;
        loser_id: number | null;
        scores_csv: string | null;
        started_at: string | null;
      };
    }[]
  >(`/tournaments/${encodeURIComponent(tournament)}/matches`);
  return data.map(({ match }) => ({
    id: match.id,
    round: match.round,
    state: match.state,
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    winnerId: match.winner_id,
    loserId: match.loser_id,
    scoresCsv: match.scores_csv ?? "",
    startedAt: match.started_at,
  }));
}
