import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
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
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Join GASAK</h1>
          <p className="mt-2 text-muted-foreground">
            We are always scouting for hungry MLBB talent — from Epic grinders
            for the academy to Mythical Glory mainstays.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
            <CardDescription>From application to roster.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-start gap-3">
                <CheckCircle
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
          </CardContent>
        </Card>
      </div>

      <ApplicationForm />
    </div>
  );
}
