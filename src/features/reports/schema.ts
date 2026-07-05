import { z } from "zod";

export const reportSchema = z.object({
  range: z.string().optional(),
});
