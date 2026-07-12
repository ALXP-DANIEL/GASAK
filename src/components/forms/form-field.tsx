"use client";

import {
  type ImageCropConfig,
  ImageCropDialog,
} from "@components/forms/image-crop-dialog";
import { Icons } from "@components/icons";
import { Button } from "@components/ui/shadcn/button";
import { Calendar } from "@components/ui/shadcn/calendar";
import { Checkbox } from "@components/ui/shadcn/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@components/ui/shadcn/field";
import { Input } from "@components/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/shadcn/popover";
import { RadioGroup, RadioGroupItem } from "@components/ui/shadcn/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/shadcn/select";
import { Switch } from "@components/ui/shadcn/switch";
import { Textarea } from "@components/ui/shadcn/textarea";
import { compressImage } from "@lib/compress-image";
import { format } from "date-fns";
import { useRef, useState } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

type BaseFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  hideLabel?: boolean;
  description?: string;
  disabled?: boolean;
};

const fieldShellClass =
  "group/form-field gap-2.5 rounded-md border border-border/70 bg-card/70 p-3.5 shadow-sm shadow-foreground/5 transition-colors focus-within:border-primary/60 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/15 data-[invalid=true]:border-destructive/60 data-[invalid=true]:bg-destructive/5 data-[invalid=true]:focus-within:ring-destructive/15";

const labelClass = "text-[0.7rem] font-semibold uppercase text-foreground/80";

const controlClass =
  "h-10 rounded-md border-border/80 bg-background/80 px-3 text-sm shadow-inner shadow-foreground/[0.03] transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/15 aria-invalid:border-destructive/70 aria-invalid:ring-destructive/15";

const textareaClass =
  "min-h-28 rounded-md border-border/80 bg-background/80 px-3 py-2.5 text-sm leading-6 shadow-inner shadow-foreground/[0.03] transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/15 aria-invalid:border-destructive/70 aria-invalid:ring-destructive/15";

const inlineChoiceShellClass =
  "rounded-md border border-border/70 bg-card/70 p-3.5 shadow-sm shadow-foreground/5 transition-colors data-[invalid=true]:border-destructive/60 data-[invalid=true]:bg-destructive/5";

export const formFieldStyles = {
  fieldShell: fieldShellClass,
  label: labelClass,
  control: controlClass,
  textarea: textareaClass,
  inlineChoiceShell: inlineChoiceShellClass,
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
  inputMode?: React.ComponentProps<"input">["inputMode"];
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
  hideLabel,
  labelAddon,
  description,
  as = "input",
  type = "text",
  inputMode,
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
        <Field data-invalid={fieldState.invalid} className={fieldShellClass}>
          {labelAddon ? (
            <div className="flex items-center justify-between gap-3">
              <FieldLabel
                htmlFor={field.name}
                className={hideLabel ? "sr-only" : labelClass}
              >
                {label}
              </FieldLabel>
              {labelAddon}
            </div>
          ) : (
            <FieldLabel
              htmlFor={field.name}
              className={hideLabel ? "sr-only" : labelClass}
            >
              {label}
            </FieldLabel>
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
              className={textareaClass}
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
              inputMode={inputMode}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              className={controlClass}
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
  hideLabel,
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
        <Field data-invalid={fieldState.invalid} className={fieldShellClass}>
          <FieldLabel
            htmlFor={field.name}
            className={hideLabel ? "sr-only" : labelClass}
          >
            {label}
          </FieldLabel>
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
              className={`${controlClass} w-full`}
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
  hideLabel,
  description,
  disabled,
}: FormCheckboxProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          orientation="horizontal"
          data-invalid={fieldState.invalid}
          className={inlineChoiceShellClass}
        >
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
            <FieldLabel
              htmlFor={field.name}
              className={hideLabel ? "sr-only" : labelClass}
            >
              {label}
            </FieldLabel>
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
  hideLabel,
  description,
  disabled,
}: FormSwitchProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          orientation="horizontal"
          data-invalid={fieldState.invalid}
          className={inlineChoiceShellClass}
        >
          <FieldContent>
            <FieldLabel
              htmlFor={field.name}
              className={hideLabel ? "sr-only" : labelClass}
            >
              {label}
            </FieldLabel>
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
  hideLabel,
  description,
  disabled,
  options,
}: FormRadioGroupProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={fieldShellClass}>
          <FieldLabel className={hideLabel ? "sr-only" : labelClass}>
            {label}
          </FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <RadioGroup
            name={field.name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            className="grid gap-2"
          >
            {options.map((option) => (
              <Field key={option.value} orientation="horizontal">
                <RadioGroupItem
                  id={`${field.name}-${option.value}`}
                  value={option.value}
                  disabled={option.disabled}
                  className="mt-0.5"
                />
                <FieldLabel
                  htmlFor={`${field.name}-${option.value}`}
                  className="min-h-10 flex-1 cursor-pointer rounded-md border border-border/70 bg-background/70 px-3 py-2 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 peer-data-checked:border-primary/60 peer-data-checked:bg-primary/10 peer-data-checked:text-primary"
                >
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
  hideLabel,
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
        <Field data-invalid={fieldState.invalid} className={fieldShellClass}>
          <FieldLabel
            htmlFor={field.name}
            className={hideLabel ? "sr-only" : labelClass}
          >
            {label}
          </FieldLabel>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  id={field.name}
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                  className={`${controlClass} w-full justify-start gap-2 text-left font-normal data-[empty=true]:text-muted-foreground`}
                  data-empty={!field.value}
                >
                  <Icons.Domain.Calendar className="size-4" />
                  {field.value ? format(field.value, dateFormat) : placeholder}
                </Button>
              }
            />
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
  /** Longest edge for client-side image compression before upload. */
  imageMaxDimension?: number;
  /**
   * When set, picking a file opens a crop dialog first; the file that
   * reaches form state is always exactly `outputWidth` x `outputHeight`.
   * Only meaningful for single-file (non-`multiple`) image fields.
   */
  cropConfig?: ImageCropConfig;
};

export function FormFileInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  hideLabel,
  description,
  disabled,
  accept,
  multiple,
  imageMaxDimension = 1600,
  cropConfig,
}: FormFileInputProps<TFieldValues, TName>) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingCrop, setPendingCrop] = useState<{
    url: string;
    fileName: string;
    apply: (file: File) => void;
  } | null>(null);

  function clearInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function closeCropDialog() {
    if (pendingCrop) URL.revokeObjectURL(pendingCrop.url);
    setPendingCrop(null);
    clearInput();
  }

  return (
    <>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className={fieldShellClass}>
            <FieldLabel
              htmlFor={field.name}
              className={hideLabel ? "sr-only" : labelClass}
            >
              {label}
            </FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              type="file"
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              onBlur={field.onBlur}
              ref={(node) => {
                field.ref(node);
                inputRef.current = node;
              }}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                const file = files[0];

                if (cropConfig && !multiple && file) {
                  setPendingCrop({
                    url: URL.createObjectURL(file),
                    fileName: file.name,
                    apply: (cropped) => field.onChange(cropped),
                  });
                  return;
                }

                const compressed = await Promise.all(
                  files.map((f) => compressImage(f, imageMaxDimension)),
                );
                field.onChange(multiple ? compressed : (compressed[0] ?? null));
              }}
              aria-invalid={fieldState.invalid}
              className={controlClass}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      {cropConfig && (
        <ImageCropDialog
          open={pendingCrop !== null}
          imageUrl={pendingCrop?.url ?? null}
          fileName={pendingCrop?.fileName ?? "image"}
          config={cropConfig}
          onCancel={closeCropDialog}
          onConfirm={(file) => {
            pendingCrop?.apply(file);
            setPendingCrop(null);
            clearInput();
          }}
        />
      )}
    </>
  );
}
