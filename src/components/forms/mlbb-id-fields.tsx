"use client";

import { FormField } from "@components/forms/form-field";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

export function MlbbIdFields<
  TFieldValues extends FieldValues,
  TMlbbName extends FieldPath<TFieldValues>,
  TServerName extends FieldPath<TFieldValues>,
>({
  control,
  mlbbIdName,
  serverIdName,
  disabled,
}: {
  control: Control<TFieldValues>;
  mlbbIdName: TMlbbName;
  serverIdName: TServerName;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 desktop:grid-cols-[8rem_minmax(0,1fr)]">
      <FormField
        control={control}
        name={serverIdName}
        label="Server ID"
        inputMode="numeric"
        placeholder="(2001)"
        disabled={disabled}
      />
      <FormField
        control={control}
        name={mlbbIdName}
        label="Player ID"
        inputMode="numeric"
        placeholder="123456789"
        disabled={disabled}
      />
    </div>
  );
}
