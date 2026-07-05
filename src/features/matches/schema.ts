import { z } from "zod";

export const matchSchema = z.object({
  squadId: z.uuid("Pick a squad"),
  opponent: z.string().min(1, "Opponent is required"),
  date: z.string().min(1, "Date is required"),
  result: z.string().optional(),
  notes: z.string().optional(),
  replayLink: z.union([z.url("Enter a valid URL"), z.literal("")]).optional(),
});
