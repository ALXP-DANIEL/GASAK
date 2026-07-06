import { PageHero } from "@components/ui/brand";
import { createPageMetadata } from "@lib/metadata";
import { ApplicationForm } from "./application-form";

export const metadata = createPageMetadata({
  title: "Recruitment",
  description: "Apply to join a GASAK Esports squad.",
  path: "/recruitment",
});

export default function RecruitmentPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 desktop:px-8 desktop:py-14">
      <PageHero
        eyebrow="Join GASAK"
        title="Apply to the squad"
        description="Tell us about your rank, role, and hero pool. Our recruiters review every application and reach out by email or WhatsApp."
      />
      <ApplicationForm />
    </div>
  );
}
