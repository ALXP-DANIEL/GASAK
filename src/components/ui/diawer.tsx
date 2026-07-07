"use client";

import { useScreen } from "@hooks/use-screen";
import { cn } from "@lib/utils";
import { createContext, type ReactNode, useContext } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./shadcn/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./shadcn/drawer";

const DiawerContext = createContext<{ isDesktop: boolean } | null>(null);

function useDiawerContext() {
  const ctx = useContext(DiawerContext);
  if (!ctx) {
    throw new Error("Diawer subcomponents must be used within <Diawer>");
  }
  return ctx;
}

export function Diawer({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const isDesktop = useScreen("desktop");
  const Root = isDesktop ? Dialog : Drawer;

  return (
    <DiawerContext.Provider value={{ isDesktop }}>
      <Root open={open} onOpenChange={onOpenChange}>
        {children}
      </Root>
    </DiawerContext.Provider>
  );
}

export function DiawerTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactNode;
}) {
  const { isDesktop } = useDiawerContext();
  const Trigger = isDesktop ? DialogTrigger : DrawerTrigger;
  return <Trigger asChild={asChild}>{children}</Trigger>;
}

export function DiawerContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isDesktop } = useDiawerContext();
  const Content = isDesktop ? DialogContent : DrawerContent;
  return (
    <Content
      className={cn(
        "flex flex-col overflow-hidden border-border/70 bg-card p-0 shadow-xl shadow-foreground/10",
        isDesktop && "max-h-[88dvh] sm:max-w-2xl desktop:max-w-4xl",
        !isDesktop && "h-[92dvh] max-h-[92dvh]",
        className,
      )}
    >
      {children}
    </Content>
  );
}

export function DiawerHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isDesktop } = useDiawerContext();
  const Header = isDesktop ? DialogHeader : DrawerHeader;
  return (
    <Header
      className={cn(
        "shrink-0 border-b border-border/70 bg-muted/30 px-5 py-4",
        !isDesktop && "text-left",
        className,
      )}
    >
      {children}
    </Header>
  );
}

export function DiawerTitle({ children }: { children: ReactNode }) {
  const { isDesktop } = useDiawerContext();
  const Title = isDesktop ? DialogTitle : DrawerTitle;
  return <Title>{children}</Title>;
}

export function DiawerDescription({ children }: { children: ReactNode }) {
  const { isDesktop } = useDiawerContext();
  const Description = isDesktop ? DialogDescription : DrawerDescription;
  return <Description>{children}</Description>;
}

export function DiawerBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isDesktop } = useDiawerContext();
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain p-4",
        !isDesktop && "px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DiawerFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isDesktop } = useDiawerContext();
  const Footer = isDesktop ? DialogFooter : DrawerFooter;
  return <Footer className={className}>{children}</Footer>;
}

export function DiawerClose({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactNode;
}) {
  const { isDesktop } = useDiawerContext();
  const Close = isDesktop ? DialogClose : DrawerClose;
  return <Close asChild={asChild}>{children}</Close>;
}
