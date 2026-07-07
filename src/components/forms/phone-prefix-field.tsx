"use client";

import { formFieldStyles } from "@components/forms/form-field";
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
        <Field
          data-invalid={fieldState.invalid}
          className={formFieldStyles.fieldShell}
        >
          <FieldLabel htmlFor={field.name} className={formFieldStyles.label}>
            {label}
          </FieldLabel>
          <div className="flex rounded-md border border-border/80 bg-background/80 shadow-inner shadow-foreground/3 focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/15">
            <span className="inline-flex h-10 shrink-0 items-center border-r border-border/70 bg-muted/40 px-3 text-sm font-semibold text-foreground">
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
              className="h-10 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={field.value ?? ""}
            />
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
