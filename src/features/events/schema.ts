import { eventTypeEnum } from "@server/db/schema";
import { z } from "zod";

/** Sentinel value for the "Organization-wide" option in the squad select. */
export const ORG_WIDE = "org";

export const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  type: z.enum(eventTypeEnum.enumValues),
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().optional(),
  location: z.string().optional(),
  squadId: z.string().min(1, "Pick a squad"),
});
