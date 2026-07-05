import type { z } from "zod";
import type { playerSchema } from "./schema";

export type PlayerInput = z.infer<typeof playerSchema>;
