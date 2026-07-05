import type { z } from "zod";
import type { tournamentSchema } from "./schema";

export type TournamentInput = z.infer<typeof tournamentSchema>;

export type TournamentActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
};
