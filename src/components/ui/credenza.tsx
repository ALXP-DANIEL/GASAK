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

const CredenzaContext = createContext<{ isDesktop: boolean } | null>(null);

function useCredenzaContext() {
  const ctx = useContext(CredenzaContext);
  if (!ctx) {
    throw new Error("Credenza subcomponents must be used within <Credenza>");
  }
  return ctx;
}

export function Credenza({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const isDesktop = useScreen("desktop");

  return (
    <CredenzaContext.Provider value={{ isDesktop }}>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      ) : (
        <Drawer
          open={open}
          onOpenChange={onOpenChange}
          shouldScaleBackground={false}
        >
          {children}
        </Drawer>
      )}
    </CredenzaContext.Provider>
  );
}

export function CredenzaTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactNode;
}) {
  const { isDesktop } = useCredenzaContext();
  const Trigger = isDesktop ? DialogTrigger : DrawerTrigger;
  return <Trigger asChild={asChild}>{children}</Trigger>;
}

export function CredenzaContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isDesktop } = useCredenzaContext();
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

export function CredenzaHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isDesktop } = useCredenzaContext();
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

export function CredenzaTitle({ children }: { children: ReactNode }) {
  const { isDesktop } = useCredenzaContext();
  const Title = isDesktop ? DialogTitle : DrawerTitle;
  return <Title>{children}</Title>;
}

export function CredenzaDescription({ children }: { children: ReactNode }) {
  const { isDesktop } = useCredenzaContext();
  const Description = isDesktop ? DialogDescription : DrawerDescription;
  return <Description>{children}</Description>;
}

export function CredenzaBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isDesktop } = useCredenzaContext();
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

export function CredenzaFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isDesktop } = useCredenzaContext();
  const Footer = isDesktop ? DialogFooter : DrawerFooter;
  return <Footer className={className}>{children}</Footer>;
}

export function CredenzaClose({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactNode;
}) {
  const { isDesktop } = useCredenzaContext();
  const Close = isDesktop ? DialogClose : DrawerClose;
  return <Close asChild={asChild}>{children}</Close>;
}
