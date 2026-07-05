import { z } from "zod";

export const playerSchema = z.object({
  displayName: z.string().min(1),
});
