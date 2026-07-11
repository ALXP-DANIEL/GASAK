import { Reveal } from "@components/motion/reveal";
import { cn } from "@lib/utils";
import { DashboardPanel } from "../../_components/page-surface";

export type FormResult = {
  id: string;
  opponent: string;
  result: string | null;
  date: Date;
};

function resultKind(result: string | null) {
  if (result && /^won?\b/i.test(result)) return "win" as const;
  if (result && /^lost?\b/i.test(result)) return "loss" as const;
  return "open" as const;
}

const TILE_TONES = {
  win: "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  loss: "border-destructive/50 bg-destructive/15 text-destructive",
  open: "border-border bg-muted text-muted-foreground",
} as const;

const TILE_LETTERS = { win: "W", loss: "L", open: "–" } as const;

/**
 * Scoreboard form guide — the last N results as skewed W/L tiles, oldest on
 * the left so the streak reads chronologically.
 */
export function FormStrip({ matches }: { matches: FormResult[] }) {
  const recent = [...matches]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10)
    .reverse();

  if (recent.length === 0) return null;

  let streak = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    const kind = resultKind(recent[i].result);
    if (kind === "open") continue;
    if (streak === 0) {
      streak = kind === "win" ? 1 : -1;
    } else if (streak > 0 && kind === "win") {
      streak++;
    } else if (streak < 0 && kind === "loss") {
      streak--;
    } else {
      break;
    }
  }

  return (
    <DashboardPanel
      title="Recent Form"
      description="Last 10 results, oldest to newest"
      action={
        streak !== 0 ? (
          <span
            className={cn(
              "font-heading text-sm font-bold uppercase tracking-wide",
              streak > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive",
            )}
          >
            {Math.abs(streak)}
            {streak > 0 ? "W" : "L"} streak
          </span>
        ) : undefined
      }
      contentClassName="flex flex-wrap items-center gap-1.5 p-4"
    >
      {recent.map((match, index) => {
        const kind = resultKind(match.result);
        return (
          <Reveal key={match.id} delay={index * 0.05}>
            <span
              title={`vs ${match.opponent} — ${match.result ?? "no result"}`}
              className={cn(
                "grid size-9 -skew-x-6 place-items-center border font-heading text-sm font-bold",
                TILE_TONES[kind],
              )}
            >
              <span className="skew-x-6">{TILE_LETTERS[kind]}</span>
            </span>
          </Reveal>
        );
      })}
    </DashboardPanel>
  );
}
