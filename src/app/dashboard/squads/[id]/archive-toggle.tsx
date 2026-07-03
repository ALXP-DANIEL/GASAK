"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { setSquadArchived } from "@/server/actions/squads";

export function ArchiveToggle({
  squadId,
  archived,
}: {
  squadId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setSquadArchived(squadId, !archived);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      variant={archived ? "default" : "destructive"}
      onClick={toggle}
      disabled={pending}
    >
      {pending ? "Working…" : archived ? "Restore squad" : "Archive squad"}
    </Button>
  );
}
