"use client";

import { Switch } from "@components/ui/shadcn/switch";
import {
  MODULE_CONTROL_KEYS,
  MODULE_CONTROLS,
  type ModuleControlKey,
} from "@lib/module-controls";
import { setModuleEnabled } from "@server/actions/module-controls";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function ModuleControlsCard({
  defaults,
}: {
  defaults: Record<ModuleControlKey, boolean>;
}) {
  const [values, setValues] = useState(defaults);
  const [pending, startTransition] = useTransition();

  function toggle(key: ModuleControlKey, enabled: boolean) {
    const previous = values[key];
    setValues((current) => ({ ...current, [key]: enabled }));
    startTransition(async () => {
      const result = await setModuleEnabled(key, enabled);
      if (!result.ok) {
        setValues((current) => ({ ...current, [key]: previous }));
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
    });
  }

  return (
    <div className="grid divide-y border">
      {MODULE_CONTROL_KEYS.map((key) => {
        const control = MODULE_CONTROLS[key];
        return (
          <div
            key={key}
            className="flex items-center justify-between gap-4 bg-card p-4"
          >
            <div>
              <p className="font-heading text-sm font-bold">{control.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {control.description}
              </p>
            </div>
            <Switch
              checked={values[key]}
              disabled={pending}
              onCheckedChange={(enabled) => toggle(key, enabled)}
              aria-label={`Enable ${control.label}`}
            />
          </div>
        );
      })}
    </div>
  );
}
