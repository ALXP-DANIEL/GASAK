"use client";

import { Field, FieldError, FieldLabel } from "@components/ui/shadcn/field";
import { Input } from "@components/ui/shadcn/input";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

export function PhonePrefixField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  disabled,
}: {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <div className="flex">
            <span className="inline-flex h-8 shrink-0 items-center border border-r-0 border-input bg-muted/30 px-2.5 text-xs font-medium text-muted-foreground">
              +60
            </span>
            <Input
              {...field}
              id={field.name}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="12 345 6789"
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              className="min-w-0"
              value={field.value ?? ""}
            />
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
