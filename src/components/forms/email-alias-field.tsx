"use client";

import { Field, FieldDescription, FieldError, FieldLabel } from "@components/ui/shadcn/field";
import { Input } from "@components/ui/shadcn/input";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

export function EmailAliasField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  domain,
  placeholder = "username",
  disabled,
}: {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  description?: string;
  domain: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              {...field}
              value={field.value ?? ""}
              id={field.name}
              placeholder={placeholder}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
            />
            <span className="shrink-0 text-sm text-muted-foreground">
              @{domain}
            </span>
          </div>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
