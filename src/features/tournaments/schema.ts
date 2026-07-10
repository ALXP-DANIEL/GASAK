import {
  matchOutcomeEnum,
  tournamentFormatEnum,
  tournamentStatusEnum,
  tournamentTrackingEnum,
} from "@server/db/schema";
import { z } from "zod";

export const tournamentSchema = z.object({
  name: z.string().min(2, "Tournament name is required"),
  organizer: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  prize: z.string().optional(),
  placement: z.string().optional(),
  mvp: z.string().optional(),
  format: z.enum(tournamentFormatEnum.enumValues),
  status: z.enum(tournamentStatusEnum.enumValues),
  // Only meaningful on create — createTournament sets it once and
  // updateTournament never touches it (immutable after creation).
  tracking: z.enum(tournamentTrackingEnum.enumValues).optional(),
  challongeUrl: z.union([z.url("Enter a valid URL"), z.literal("")]).optional(),
  squadId: z.uuid("Pick a squad"),
});

export const tournamentRoundSchema = z.object({
  roundLabel: z.string().min(1, "Round label is required"),
  opponent: z.string().min(1, "Opponent is required"),
  scheduledAt: z.string().optional(),
  outcome: z.enum(matchOutcomeEnum.enumValues),
  score: z.string().optional(),
  notes: z.string().optional(),
  replayLink: z.union([z.url("Enter a valid URL"), z.literal("")]).optional(),
  eventId: z.uuid().nullable().optional(),
});
