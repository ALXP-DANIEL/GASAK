import type { z } from "zod";
import type { teamSchema } from "./schema";

export type TeamInput = z.infer<typeof teamSchema>;
