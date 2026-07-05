import type { z } from "zod";
import type { matchSchema } from "./schema";

export type MatchInput = z.infer<typeof matchSchema>;
