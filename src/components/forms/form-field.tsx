"use client";

import { format } from "date-fns";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/shadcn/button";
import { Calendar } from "@/components/ui/shadcn/calendar";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/shadcn/field";
import { Input } from "@/components/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/shadcn/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/shadcn/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Switch } from "@/components/ui/shadcn/switch";
import { Textarea } from "@/components/ui/shadcn/textarea";

type BaseFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type FormFieldOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/* -------------------------------------------------------------------------- */
/* FormField — text-like inputs (input, email, password, number, datetime…)   */
/* -------------------------------------------------------------------------- */

type FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName> & {
  /** Rendered on the opposite end of the label row, e.g. a "Forgot password?" link. */
  labelAddon?: React.ReactNode;
  as?: "input" | "textarea";
  type?: React.ComponentProps<"input">["type"];
  placeholder?: string;
  autoComplete?: string;
  rows?: number;
};

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  labelAddon,
  description,
  as = "input",
  type = "text",
  placeholder,
  autoComplete,
  disabled,
  rows,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          {labelAddon ? (
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
              {labelAddon}
            </div>
          ) : (
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          )}
          {as === "textarea" ? (
            <Textarea
              {...field}
              value={field.value ?? ""}
              id={field.name}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              aria-invalid={fieldState.invalid}
            />
          ) : (
            <Input
              {...field}
              value={field.value ?? ""}
              onChange={
                type === "number"
                  ? (e) =>
                      field.onChange(
                        e.target.value === "" ? "" : e.target.valueAsNumber,
                      )
                  : field.onChange
              }
              id={field.name}
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
            />
          )}
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* FormSelect                                                                 */
/* -------------------------------------------------------------------------- */

type FormSelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName> & {
  options: FormFieldOption[];
  placeholder?: string;
};

export function FormSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  disabled,
  options,
  placeholder,
}: FormSelectProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Select
            name={field.name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger
              id={field.name}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              className="w-full"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* FormCheckbox                                                               */
/* -------------------------------------------------------------------------- */

type FormCheckboxProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName>;

export function FormCheckbox<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  disabled,
}: FormCheckboxProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
          <Checkbox
            id={field.name}
            name={field.name}
            checked={!!field.value}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
          />
          <FieldContent>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </FieldContent>
        </Field>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* FormSwitch                                                                 */
/* -------------------------------------------------------------------------- */

type FormSwitchProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName>;

export function FormSwitch<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  disabled,
}: FormSwitchProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
          <FieldContent>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </FieldContent>
          <Switch
            id={field.name}
            name={field.name}
            checked={!!field.value}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
          />
        </Field>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* FormRadioGroup                                                             */
/* -------------------------------------------------------------------------- */

type FormRadioGroupProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName> & {
  options: FormFieldOption[];
};

export function FormRadioGroup<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  disabled,
  options,
}: FormRadioGroupProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <RadioGroup
            name={field.name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
          >
            {options.map((option) => (
              <Field
                key={option.value}
                orientation="horizontal"
                data-invalid={fieldState.invalid}
              >
                <RadioGroupItem
                  id={`${field.name}-${option.value}`}
                  value={option.value}
                  disabled={option.disabled}
                />
                <FieldLabel htmlFor={`${field.name}-${option.value}`}>
                  {option.label}
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* FormDatePicker — calendar popover bound to a Date value                    */
/* -------------------------------------------------------------------------- */

type FormDatePickerProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName> & {
  placeholder?: string;
  /** date-fns format string used for the trigger label. */
  dateFormat?: string;
  fromDate?: Date;
  toDate?: Date;
};

export function FormDatePicker<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  disabled,
  placeholder = "Pick a date",
  dateFormat = "PPP",
  fromDate,
  toDate,
}: FormDatePickerProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id={field.name}
                type="button"
                variant="outline"
                disabled={disabled}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
                className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                data-empty={!field.value}
              >
                <Icons.Domain.Calendar className="size-4" />
                {field.value ? format(field.value, dateFormat) : placeholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ?? undefined}
                onSelect={field.onChange}
                disabled={[
                  ...(fromDate ? [{ before: fromDate }] : []),
                  ...(toDate ? [{ after: toDate }] : []),
                ]}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* FormFileInput — binds File (or File[] with multiple) into form state       */
/* -------------------------------------------------------------------------- */

type FormFileInputProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseFieldProps<TFieldValues, TName> & {
  accept?: string;
  multiple?: boolean;
};

export function FormFileInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  disabled,
  accept,
  multiple,
}: FormFileInputProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            id={field.name}
            name={field.name}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onBlur={field.onBlur}
            ref={field.ref}
            onChange={(e) => {
              const files = e.target.files;
              field.onChange(
                multiple ? Array.from(files ?? []) : (files?.[0] ?? null),
              );
            }}
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
