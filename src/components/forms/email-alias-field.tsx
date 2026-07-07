"use client";

import { formFieldStyles } from "@components/forms/form-field";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
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
        <Field
          data-invalid={fieldState.invalid}
          className={formFieldStyles.fieldShell}
        >
          <FieldLabel htmlFor={field.name} className={formFieldStyles.label}>
            {label}
          </FieldLabel>
          <div className="flex items-center rounded-md border border-border/80 bg-background/80 shadow-inner shadow-foreground/3 focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/15">
            <Input
              {...field}
              value={field.value ?? ""}
              id={field.name}
              placeholder={placeholder}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <span className="shrink-0 border-l border-border/70 px-3 text-sm font-medium text-muted-foreground">
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
