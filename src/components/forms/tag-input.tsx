"use client";

import { formFieldStyles } from "@components/forms/form-field";
import { Icons } from "@components/icons";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
import { cn } from "@lib/utils";
import { useState } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

/**
 * Chip-style multi-value input — type a value, hit Enter/comma to add it as
 * a removable tag. Backs a `string[]` form field. Used for variant option
 * values (e.g. Size: S, M, L) instead of a raw comma-separated text field.
 */
export function TagInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  hideLabel,
  description,
  placeholder,
  disabled,
}: {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  hideLabel?: boolean;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const tags: string[] = Array.isArray(field.value) ? field.value : [];

        function commitDraft() {
          const value = draft.trim();
          setDraft("");
          if (!value || tags.includes(value)) return;
          field.onChange([...tags, value]);
        }

        function removeTag(index: number) {
          field.onChange(tags.filter((_, i) => i !== index));
        }

        return (
          <Field
            data-invalid={fieldState.invalid}
            className={formFieldStyles.fieldShell}
          >
            <FieldLabel
              htmlFor={field.name}
              className={hideLabel ? "sr-only" : formFieldStyles.label}
            >
              {label}
            </FieldLabel>
            <div
              className={cn(
                formFieldStyles.control,
                "flex h-auto min-h-10 flex-wrap items-center gap-1.5 py-1.5",
              )}
            >
              {tags.map((tag, index) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {tag}
                  {!disabled && (
                    <button
                      type="button"
                      aria-label={`Remove ${tag}`}
                      onClick={() => removeTag(index)}
                      className="text-primary/70 hover:text-primary"
                    >
                      <Icons.Layout.Navigation.Close size={11} />
                    </button>
                  )}
                </span>
              ))}
              <input
                id={field.name}
                value={draft}
                disabled={disabled}
                placeholder={tags.length === 0 ? placeholder : undefined}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  commitDraft();
                  field.onBlur();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    commitDraft();
                  } else if (e.key === "Backspace" && !draft && tags.length) {
                    removeTag(tags.length - 1);
                  }
                }}
                aria-invalid={fieldState.invalid}
                className="min-w-24 flex-1 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
