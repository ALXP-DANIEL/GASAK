"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { LANE_LABELS, MLBB_RANKS } from "@/lib/labels";
import { submitApplication } from "@/server/actions/public";
import { laneEnum } from "@/server/db/schema";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.email("Enter a valid email"),
  phone: z.string().min(6, "Enter a valid phone number"),
  ign: z.string().min(1, "IGN is required"),
  mlbbId: z.string().min(4, "Enter a valid MLBB ID"),
  serverId: z.string().min(1, "Server ID is required"),
  currentRank: z.string().min(1, "Select your current rank"),
  preferredLane: z.enum(laneEnum.enumValues, "Select your preferred lane"),
  heroPool: z.string().min(2, "List a few of your best heroes"),
  previousTeam: z.string().optional(),
  introduction: z.string().min(10, "Tell us a bit about yourself"),
});

type Values = z.infer<typeof schema>;

export function ApplicationForm() {
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await submitApplication(values);
      if (result.ok) {
        setSubmitted(true);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application received 🎉</CardTitle>
          <CardDescription>
            Thanks for applying to GASAK. Our admins will review your
            application and reach out by email or WhatsApp.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const fieldError = (name: keyof Values) =>
    errors[name] && (
      <p className="text-sm text-destructive">{errors[name]?.message}</p>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application form</CardTitle>
        <CardDescription>
          All fields are required unless marked optional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" {...register("fullName")} />
              {fieldError("fullName")}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {fieldError("email")}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (WhatsApp)</Label>
              <Input id="phone" placeholder="+60…" {...register("phone")} />
              {fieldError("phone")}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ign">In-game name (IGN)</Label>
              <Input id="ign" {...register("ign")} />
              {fieldError("ign")}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mlbbId">MLBB ID</Label>
              <Input id="mlbbId" inputMode="numeric" {...register("mlbbId")} />
              {fieldError("mlbbId")}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serverId">Server ID</Label>
              <Input
                id="serverId"
                inputMode="numeric"
                {...register("serverId")}
              />
              {fieldError("serverId")}
            </div>
            <div className="grid gap-2">
              <Label>Current rank</Label>
              <Select
                onValueChange={(v) =>
                  setValue("currentRank", v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  {MLBB_RANKS.map((rank) => (
                    <SelectItem key={rank} value={rank}>
                      {rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("currentRank")}
            </div>
            <div className="grid gap-2">
              <Label>Preferred lane</Label>
              <Select
                onValueChange={(v) =>
                  setValue("preferredLane", v as Values["preferredLane"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lane" />
                </SelectTrigger>
                <SelectContent>
                  {laneEnum.enumValues.map((lane) => (
                    <SelectItem key={lane} value={lane}>
                      {LANE_LABELS[lane]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("preferredLane")}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="heroPool">Hero pool</Label>
            <Input
              id="heroPool"
              placeholder="e.g. Ling, Fanny, Lancelot, Hayabusa"
              {...register("heroPool")}
            />
            {fieldError("heroPool")}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="previousTeam">Previous team (optional)</Label>
            <Input id="previousTeam" {...register("previousTeam")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="introduction">Short introduction</Label>
            <Textarea
              id="introduction"
              rows={4}
              placeholder="Playstyle, availability, goals…"
              {...register("introduction")}
            />
            {fieldError("introduction")}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
