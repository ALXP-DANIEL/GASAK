import { PageHeader } from "@app/(dashboard)/dashboard/_components/page-surface";
import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { getDiscordSettings } from "@server/actions/discord-settings";
import { getWhatsappSettings } from "@server/actions/whatsapp-settings";
import { requireDashboardRole } from "../_components/dashboard-section";
import { DiscordSettingsCard } from "./_components/discord-settings-card";
import { WhatsappSettingsCard } from "./_components/whatsapp-settings-card";

export default async function IntegrationsPage() {
  await requireDashboardRole("admin");
  const [discordSettings, whatsappSettings] = await Promise.all([
    getDiscordSettings(),
    getWhatsappSettings(),
  ]);

  return (
    <PageSkeleton name="integrations" loading={false}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Integrations"
          kicker="System"
          icon={Icons.Domain.Integrations}
          description="Connect GASAK to external services — Discord and WhatsApp notifications."
        />
        <DiscordSettingsCard
          defaultValues={{
            recruitmentChannelId: discordSettings?.recruitmentChannelId ?? "",
            scheduleChannelId: discordSettings?.scheduleChannelId ?? "",
            birthdayChannelId: discordSettings?.birthdayChannelId ?? "",
          }}
        />
        <WhatsappSettingsCard
          defaultValues={{
            recruitmentRecipients: whatsappSettings?.recruitmentRecipients ?? "",
            scheduleRecipients: whatsappSettings?.scheduleRecipients ?? "",
            birthdayRecipients: whatsappSettings?.birthdayRecipients ?? "",
          }}
        />
      </div>
    </PageSkeleton>
  );
}
