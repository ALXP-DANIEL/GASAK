import { Icons } from "@/components/icons";
import { BrandFeatureCard, PageHero } from "@/components/ui/brand";
import { createPageMetadata } from "@/lib/metadata";
import { ApplicationForm } from "./application-form";

export const metadata = createPageMetadata({
  title: "Recruitment",
  description: "Apply to join a GASAK squad.",
  path: "/recruitment",
});

const STEPS = [
  "Submit your application below",
  "Admin reviews and assigns you to a squad leader",
  "Trial scrims with the squad",
  "Accepted players get a portal account and squad slot",
];

export default function RecruitmentPage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-6">
        <PageHero
          eyebrow="Recruitment"
          title="Join GASAK"
          description="We are always scouting for hungry MLBB talent, from academy grinders to Mythical Glory mainstays."
          align="left"
        />
        <BrandFeatureCard
          title="How it works"
          description="From application to roster."
          footer={
            <div className="grid gap-3">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-start gap-3">
                  <Icons.Status.Success
                    size={20}
                    className="mt-0.5 shrink-0 text-primary"
                  />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Step {i + 1}.
                    </span>{" "}
                    {step}
                  </p>
                </div>
              ))}
            </div>
          }
        />
      </div>

      <ApplicationForm />
    </div>
  );
}
