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
  return <Content className={className}>{children}</Content>;
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
    <Header className={cn(!isDesktop && "text-left", className)}>
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
  return <div className={cn(!isDesktop && "px-4", className)}>{children}</div>;
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
