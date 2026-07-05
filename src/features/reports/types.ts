import type { z } from "zod";
import type { reportSchema } from "./schema";

export type ReportInput = z.infer<typeof reportSchema>;
