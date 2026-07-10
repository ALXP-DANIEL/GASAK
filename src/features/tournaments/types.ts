import type { z } from "zod";
import type { tournamentRoundSchema, tournamentSchema } from "./schema";

export type TournamentInput = z.infer<typeof tournamentSchema>;
export type TournamentRoundInput = z.infer<typeof tournamentRoundSchema>;
