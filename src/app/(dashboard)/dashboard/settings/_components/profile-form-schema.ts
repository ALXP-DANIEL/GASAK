import { rankFieldSchema, rankOrder } from "@lib/ranks";
import { z } from "zod";

const profileFormObject = z.object({
  name: z.string().min(2, "Display name is required"),
  fullName: z.string().optional(),
  nickname: z.string().optional(),
  ign: z.string().optional(),
  mlbbId: z.string().optional(),
  serverId: z.string().optional(),
  phone: z.string().optional(),
  preferredLanes: z.array(z.string()).optional(),
  currentRank: rankFieldSchema.optional(),
  peakRank: rankFieldSchema.optional(),
  avatar: z.instanceof(File).nullable(),
});

export const profileFormSchema = profileFormObject.refine(
  (data) => {
    const current = data.currentRank;
    const peak = data.peakRank;
    if (!current || !peak) return true;
    return rankOrder(current) <= rankOrder(peak);
  },
  {
    message: "Current rank can't be higher than your peak rank.",
    path: ["currentRank"],
  },
);

export type ProfileFormInput = z.infer<typeof profileFormSchema>;

type ProfileFormProfile = {
  fullName?: string | null;
  nickname?: string | null;
  ign?: string | null;
  mlbbId?: string | null;
  serverId?: string | null;
  phone?: string | null;
  preferredLanes?: readonly string[] | null;
  currentRank?: ProfileFormInput["currentRank"] | null;
  peakRank?: ProfileFormInput["peakRank"] | null;
};

/** Build `ProfileForm` default values from a user's name and player profile row. */
export function buildProfileFormDefaults(
  name: string | null | undefined,
  profile: ProfileFormProfile | null | undefined,
): Omit<ProfileFormInput, "avatar"> {
  return {
    name: name ?? "",
    fullName: profile?.fullName ?? "",
    nickname: profile?.nickname ?? "",
    ign: profile?.ign ?? "",
    mlbbId: profile?.mlbbId ?? "",
    serverId: profile?.serverId ?? "",
    phone: profile?.phone ?? "",
    preferredLanes: profile?.preferredLanes ? [...profile.preferredLanes] : [],
    currentRank: profile?.currentRank ?? undefined,
    peakRank: profile?.peakRank ?? undefined,
  };
}
