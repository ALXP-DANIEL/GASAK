"use client";

import { useScreen } from "@hooks/use-screen";
import { cn } from "@lib/utils";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./shadcn/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./shadcn/drawer";

export type DiawerProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  dialogContentClassName?: string;
  drawerContentClassName?: string;
  drawerHeaderClassName?: string;
  showDialogCloseButton?: boolean;
};

export function Diawer({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
  bodyClassName,
  dialogContentClassName,
  drawerContentClassName,
  drawerHeaderClassName,
  showDialogCloseButton,
}: DiawerProps) {
  const isDesktop = useScreen("desktop");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent
          showCloseButton={showDialogCloseButton}
          className={cn(className, dialogContentClassName)}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className={bodyClassName}>{children}</div>
          {footer}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent className={cn(className, drawerContentClassName)}>
        <DrawerHeader className={cn("text-left", drawerHeaderClassName)}>
          <DrawerTitle>{title}</DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : null}
        </DrawerHeader>
        <div className={cn("px-4", bodyClassName)}>{children}</div>
        {footer ? <DrawerFooter className="pt-2">{footer}</DrawerFooter> : null}
      </DrawerContent>
    </Drawer>
  );
}
