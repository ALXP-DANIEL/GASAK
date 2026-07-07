"use client";

import { formFieldStyles } from "@components/forms/form-field";
import { ColorPicker, type ColorPreset } from "@components/ui/color-picker";
import { Button } from "@components/ui/shadcn/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

export function FormColorPicker<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  presets,
  fallback = "#d9a21b",
  disabled,
}: {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  description?: string;
  presets?: ColorPreset[];
  fallback?: string;
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = typeof field.value === "string" ? field.value : "";

        return (
          <Field
            data-invalid={fieldState.invalid}
            className={formFieldStyles.fieldShell}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <FieldLabel className={formFieldStyles.label}>
                  {label}
                </FieldLabel>
                {description && (
                  <FieldDescription>{description}</FieldDescription>
                )}
              </div>
              {value && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => field.onChange("")}
                >
                  Use default
                </Button>
              )}
            </div>
            <ColorPicker
              value={value || fallback}
              onChange={(next) => field.onChange(next)}
              presets={presets}
              title=""
              description=""
              className="border-border/70 bg-background/70 p-3 shadow-none"
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
