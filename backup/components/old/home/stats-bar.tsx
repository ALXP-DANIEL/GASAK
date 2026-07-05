import { Icons } from "@/components/icons";

export interface HomeStats {
  squads: number;
  tournaments: number;
  players: number;
}

export function StatsBar({ stats }: { stats: HomeStats }) {
  const items = [
    {
      Icon: Icons.Stats.Squads,
      value: `${stats.squads}+`,
      label: "Active Squads",
    },
    {
      Icon: Icons.Stats.Trophies,
      value: `${stats.tournaments}+`,
      label: "Tournaments",
    },
    { Icon: Icons.Stats.Players, value: `${stats.players}+`, label: "Players" },
    { Icon: Icons.Stats.Goal, value: "1 Goal", label: "To Be The Best" },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 lg:px-8">
      <div className="grid grid-cols-2  lg:grid-cols-4 gap-0 lg:divide-x lg:divide-primary/25 lg:rounded-xl lg:border lg:border-primary/30 lg:bg-black/30 lg:py-7">
        {items.map(({ Icon, value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-2 border border-primary/30 bg-black/30 px-3 py-5 text-center lg:flex-row lg:gap-3  lg:border-none lg:bg-transparent lg:px-6 lg:py-0 lg:text-left"
          >
            <Icon
              size={28}
              weight="fill"
              className="shrink-0 text-primary lg:size-7.5"
              aria-hidden="true"
            />
            <div>
              <p className="font-heading text-xl font-bold text-primary lg:text-2xl">
                {value}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-foreground/80 lg:text-[10px]">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
