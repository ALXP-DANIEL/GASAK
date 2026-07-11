"use client";

import { Icons } from "@components/icons";
import { Button } from "@components/ui/shadcn/button";
import { type ReactNode, useEffect } from "react";
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from "react-zoom-pan-pinch";

const MIN_SCALE = 0.15;
const MAX_SCALE = 2.5;

const plusIcon = <Icons.Actions.Add className="size-4" weight="bold" />;
const minusIcon = <Icons.Actions.Minus className="size-4" weight="bold" />;
const fitIcon = <Icons.Actions.Fit className="size-4" weight="bold" />;

function fitView(
  instance: ReturnType<typeof useControls>["instance"],
  centerView: ReturnType<typeof useControls>["centerView"],
  animationTime = 300,
) {
  const wrapper = instance.wrapperComponent;
  const content = instance.contentComponent;
  if (!wrapper || !content) return;
  const wW = wrapper.clientWidth;
  const wH = wrapper.clientHeight;
  const cW = content.offsetWidth;
  const cH = content.offsetHeight;
  if (cW === 0 || cH === 0) return;
  const scale = Math.min(wW / cW, wH / cH, 1);
  centerView(scale, animationTime);
}

function AutoFit() {
  const { instance, centerView } = useControls();
  useEffect(() => {
    const id = window.setTimeout(() => fitView(instance, centerView, 0), 0);
    const onResize = () => fitView(instance, centerView, 200);
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", onResize);
    };
  }, [instance, centerView]);
  return null;
}

function Controls() {
  const { zoomIn, zoomOut, instance, centerView } = useControls();
  return (
    <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5 rounded-lg border border-border/70 bg-background/90 p-1.5 shadow-md backdrop-blur">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Zoom in"
        onClick={() => zoomIn(0.3)}
      >
        {plusIcon}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Zoom out"
        onClick={() => zoomOut(0.3)}
      >
        {minusIcon}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Fit to screen"
        onClick={() => fitView(instance, centerView)}
      >
        {fitIcon}
      </Button>
    </div>
  );
}

export function OrgChartPanZoom({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[70vh] min-h-105 w-full overflow-hidden rounded-xl border border-border/70 bg-muted/20">
      <TransformWrapper
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        initialScale={1}
        centerOnInit
        limitToBounds={false}
        wheel={{ step: 0.15 }}
        pinch={{ step: 5 }}
        doubleClick={{ step: 0.7 }}
      >
        <AutoFit />
        <Controls />
        <TransformComponent
          wrapperClass="!h-full !w-full"
          contentClass="!w-max"
        >
          {children}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
