"use client";

import { Icons } from "@components/icons";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@components/ui/shadcn/sidebar";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@components/ui/shadcn/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/shadcn/tooltip";
import { ORG_ROLE_LABELS, SQUAD_ROLE_LABELS } from "@lib/labels";
import type { OrgRole, SquadRole } from "@server/db";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  parseSidebarFocus,
  SIDEBAR_FOCUS_COOKIE,
  type SidebarFocus,
} from "./sidebar-focus";

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function useSidebarFocus() {
  const router = useRouter();
  const [focus, setFocus] = useState<SidebarFocus>("manage");

  useEffect(() => {
    setFocus(parseSidebarFocus(readCookie(SIDEBAR_FOCUS_COOKIE)));
  }, []);

  function setAndPersist(next: SidebarFocus) {
    setFocus(next);
    // biome-ignore lint/suspicious/noDocumentCookie: stored server-side too (dashboard home reads it via next/headers cookies())
    document.cookie = `${SIDEBAR_FOCUS_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Server components (e.g. the dashboard home page) read the cookie, so
    // they need a refresh to reflect the new focus.
    router.refresh();
  }

  return [focus, setAndPersist] as const;
}

export function SidebarFocusToggle({
  focus,
  onChange,
  orgRole,
  squadRole,
}: {
  focus: SidebarFocus;
  onChange: (focus: SidebarFocus) => void;
  orgRole: OrgRole;
  squadRole: SquadRole;
}) {
  const orgLabel = ORG_ROLE_LABELS[orgRole];
  const squadLabel = SQUAD_ROLE_LABELS[squadRole];
  const currentLabel = focus === "manage" ? orgLabel : squadLabel;
  const nextFocus: SidebarFocus = focus === "manage" ? "player" : "manage";
  const nextLabel = focus === "manage" ? squadLabel : orgLabel;

  return (
    <div className="grid">
      {/* Expanded: full labeled toggle — crossfades out when the sidebar collapses to icons. */}
      <ToggleGroup
        type="single"
        value={focus}
        onValueChange={(value) => {
          if (value) onChange(value as SidebarFocus);
        }}
        variant="outline"
        size="sm"
        className="col-start-1 row-start-1 w-full opacity-100 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0"
      >
        <ToggleGroupItem value="manage" className="flex-1 gap-1.5">
          <Icons.Domain.Recruitment size={14} />
          {orgLabel}
        </ToggleGroupItem>
        <ToggleGroupItem value="player" className="flex-1 gap-1.5">
          <Icons.Domain.Players size={14} />
          {squadLabel}
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Collapsed: compact swap button, same SidebarMenu/Item/Button tree as
          every other nav icon so it lines up with them exactly. */}
      <SidebarMenu className="pointer-events-none col-start-1 row-start-1 opacity-0 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:opacity-100">
        <SidebarMenuItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                onClick={() => onChange(nextFocus)}
                aria-label={`Currently ${currentLabel} — switch to ${nextLabel}`}
              >
                <Icons.Actions.SwitchFocus size={14} />
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">
              {currentLabel} — switch to {nextLabel}
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
