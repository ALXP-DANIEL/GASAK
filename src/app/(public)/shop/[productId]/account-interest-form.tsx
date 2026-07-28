"use client";

import { FormField } from "@components/forms/form-field";
import { PhonePrefixField } from "@components/forms/phone-prefix-field";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import { Button } from "@components/ui/shadcn/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitAccountEnquiry } from "@server/actions/account-enquiries";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(6, "Enter a valid phone number"),
  email: z.email("Enter a valid email"),
  note: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function AccountInterestForm({
  product,
}: {
  product: { id: string; name: string };
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const { control, handleSubmit, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", note: "" },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await submitAccountEnquiry({
        productId: product.id,
        ...values,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Enquiry sent");
      reset();
      setSent(true);
    });
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    // Reset back to the form once the confirmation has been dismissed.
    if (!next) setSent(false);
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button className="w-full font-semibold uppercase tracking-wider">
          I’m interested
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            {sent ? "Enquiry received" : product.name}
          </CredenzaTitle>
          <CredenzaDescription>
            {sent
              ? "The seller will message you on WhatsApp to confirm the account and send the payment QR."
              : "Leave your details and the seller will contact you on WhatsApp to arrange payment."}
          </CredenzaDescription>
        </CredenzaHeader>

        {sent ? (
          <CredenzaFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </CredenzaFooter>
        ) : (
          <>
            <CredenzaBody className="p-0">
              <form
                id="account-interest-form"
                onSubmit={handleSubmit(onSubmit)}
                className="grid gap-4 p-5"
              >
                <FormField control={control} name="name" label="Name" />
                <PhonePrefixField
                  control={control}
                  name="phone"
                  label="Phone (WhatsApp)"
                />
                <FormField
                  control={control}
                  name="email"
                  label="Email"
                  type="email"
                />
                <FormField
                  control={control}
                  name="note"
                  label="Message (optional)"
                  as="textarea"
                  rows={3}
                />
              </form>
            </CredenzaBody>
            <CredenzaFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="account-interest-form"
                disabled={pending}
              >
                {pending ? "Sending…" : "Send enquiry"}
              </Button>
            </CredenzaFooter>
          </>
        )}
      </CredenzaContent>
    </Credenza>
  );
}
