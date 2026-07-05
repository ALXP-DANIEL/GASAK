import { z } from "zod";

export const tournamentSchema = z.object({
  name: z.string().min(2, "Tournament name is required"),
  organizer: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  prize: z.string().optional(),
  opponent: z.string().optional(),
  result: z.string().optional(),
  mvp: z.string().optional(),
  squadId: z.uuid("Pick a squad"),
});
