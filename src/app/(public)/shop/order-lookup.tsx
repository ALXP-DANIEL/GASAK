"use client";

import { Button } from "@components/ui/shadcn/button";
import { Input } from "@components/ui/shadcn/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderLookup() {
  const router = useRouter();
  const [orderNo, setOrderNo] = useState("");

  return (
    <form
      className="flex w-full max-w-xs items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (orderNo.trim()) {
          router.push(`/shop/order/${orderNo.trim().toUpperCase()}`);
        }
      }}
    >
      <Input
        placeholder="Track order e.g. GSK-A1B2C3"
        value={orderNo}
        onChange={(e) => setOrderNo(e.target.value)}
      />
      <Button type="submit" variant="outline">
        Track
      </Button>
    </form>
  );
}
