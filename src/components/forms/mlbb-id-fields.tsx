"use client";

import { formFieldStyles } from "@components/forms/form-field";
import { Field, FieldError, FieldLabel } from "@components/ui/shadcn/field";
import { Input } from "@components/ui/shadcn/input";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

/**
 * Combined "(server) player id" input — one visual field wrapping two
 * form values, styled like `PhonePrefixField`'s prefix + number shell.
 */
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
    <Controller
      control={control}
      name={serverIdName}
      render={({ field: serverField, fieldState: serverState }) => (
        <Controller
          control={control}
          name={mlbbIdName}
          render={({ field: idField, fieldState: idState }) => (
            <Field
              data-invalid={serverState.invalid || idState.invalid}
              className={formFieldStyles.fieldShell}
            >
              <FieldLabel
                htmlFor={idField.name}
                className={formFieldStyles.label}
              >
                MLBB ID
              </FieldLabel>
              <div className="flex h-10 items-center rounded-md border border-border/80 bg-background/80 shadow-inner shadow-foreground/3 transition-colors focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/15">
                <span className="pl-3 text-sm text-muted-foreground select-none">
                  (
                </span>
                <Input
                  {...serverField}
                  id={serverField.name}
                  inputMode="numeric"
                  placeholder="2001"
                  disabled={disabled}
                  aria-invalid={serverState.invalid}
                  className="h-full w-14 min-w-0 rounded-none border-0 bg-transparent px-0.5 text-center text-sm font-medium text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 dark:bg-transparent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="pr-2 text-sm text-muted-foreground select-none">
                  )
                </span>
                <span aria-hidden className="h-5 w-px shrink-0 bg-border/70" />
                <Input
                  {...idField}
                  id={idField.name}
                  inputMode="numeric"
                  placeholder="123456789"
                  disabled={disabled}
                  aria-invalid={idState.invalid}
                  className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 dark:bg-transparent"
                />
              </div>
              <FieldError errors={[serverState.error, idState.error]} />
            </Field>
          )}
        />
      )}
    />
  );
}
