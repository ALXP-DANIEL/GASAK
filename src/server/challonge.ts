import "server-only";

import { env } from "@/env";

/**
 * Challonge's v1 REST API is deprecated and undocumented (redirects to v2.1
 * docs), though still routable as of writing. This client targets the
 * current v2.1 API instead — JSON:API response shape, and auth via the
 * "Authorization-Type: v1" header (a v1-style personal API key still works
 * here, it's just sent differently than the old `?api_key=` query param).
 * Shapes below were confirmed against live v2.1 responses, not docs alone —
 * Challonge's hosted docs mix stale v1 and v2.1 examples inconsistently.
 */
const BASE_URL = "https://api.challonge.com/v2.1";

function requireApiKey() {
  if (!env.CHALLONGE_API_KEY) {
    throw new Error("Challonge is not configured — set CHALLONGE_API_KEY");
  }
  return env.CHALLONGE_API_KEY;
}

async function challongeGet<T>(path: string): Promise<T> {
  const apiKey = requireApiKey();
  const res = await fetch(`${BASE_URL}${path}.json`, {
    headers: {
      "Authorization-Type": "v1",
      Authorization: apiKey,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Challonge request failed (${res.status}): ${await res.text()}`,
    );
  }
  return res.json();
}

interface JsonApiResource<TAttrs> {
  id: string;
  attributes: TAttrs;
}

export interface ChallongeParticipant {
  id: string;
  name: string;
  /**
   * Group-stage matches reference per-group player ids instead of the
   * top-level participant id in v1. v2.1's participant payload doesn't
   * expose an equivalent field (only a single `group_id`), so this is
   * always empty for now — group-stage tournaments may not sync correctly
   * until Challonge documents the v2.1 equivalent.
   */
  groupPlayerIds: string[];
}

export interface ChallongeMatch {
  id: string;
  /** Positive = winners bracket, negative = losers bracket (double elim). */
  round: number;
  state: "pending" | "open" | "complete";
  participantIds: string[];
  winnerId: string | null;
  /** e.g. "2 - 1" */
  scores: string;
  startedAt: string | null;
}

export interface ChallongeTournament {
  id: string;
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
    data: JsonApiResource<{
      name: string;
      url: string;
      full_challonge_url: string;
      tournament_type: string;
      state: string;
    }>;
  }>(`/tournaments/${encodeURIComponent(tournament)}`);
  const t = data.data;
  return {
    id: t.id,
    name: t.attributes.name,
    url: t.attributes.url,
    fullChallongeUrl: t.attributes.full_challonge_url,
    tournamentType: t.attributes.tournament_type,
    state: t.attributes.state,
  };
}

export async function fetchChallongeParticipants(
  tournament: string,
): Promise<ChallongeParticipant[]> {
  const data = await challongeGet<{
    data: JsonApiResource<{ name: string }>[];
  }>(`/tournaments/${encodeURIComponent(tournament)}/participants`);
  return data.data.map((p) => ({
    id: p.id,
    name: p.attributes.name,
    groupPlayerIds: [],
  }));
}

export async function fetchChallongeMatches(
  tournament: string,
): Promise<ChallongeMatch[]> {
  const data = await challongeGet<{
    data: JsonApiResource<{
      round: number;
      state: "pending" | "open" | "complete";
      scores: string | null;
      winner_id: number | string | null;
      points_by_participant: { participant_id: number | string }[];
      timestamps: { started_at: string | null };
    }>[];
  }>(`/tournaments/${encodeURIComponent(tournament)}/matches`);
  return data.data.map((m) => ({
    id: m.id,
    round: m.attributes.round,
    state: m.attributes.state,
    participantIds: m.attributes.points_by_participant.map((p) =>
      String(p.participant_id),
    ),
    winnerId:
      m.attributes.winner_id !== null ? String(m.attributes.winner_id) : null,
    scores: m.attributes.scores ?? "",
    startedAt: m.attributes.timestamps?.started_at ?? null,
  }));
}
