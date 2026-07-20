"use client";

import { Icons } from "@components/icons";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import { Button } from "@components/ui/shadcn/button";
import { PersonalEmailVerification } from "@features/auth/components/personal-email-verification";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Shown to signed-in accounts that predate personal emails: their @gasak.my
 * login has no inbox, so until a personal email is verified, password resets
 * have nowhere to go. Banner stays until the address is confirmed.
 */
export function PersonalEmailPrompt() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 border border-primary/40 bg-primary/5 p-3 pl-4 text-sm corner-cut">
      <Icons.Contact.Email
        className="size-4 shrink-0 text-primary"
        aria-hidden
      />
      <p className="min-w-0 flex-1 text-foreground/90">
        <span className="font-semibold">Add a personal email.</span>{" "}
        <span className="text-muted-foreground">
          Your @gasak.my login has no inbox — without one, password resets can't
          reach you.
        </span>
      </p>
      <Credenza open={open} onOpenChange={setOpen}>
        <CredenzaTrigger asChild>
          <Button size="sm">Add email</Button>
        </CredenzaTrigger>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Add your personal email</CredenzaTitle>
            <CredenzaDescription>
              We'll send a 6-digit code to confirm the inbox is yours.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="pb-4 desktop:pb-0">
            <PersonalEmailVerification
              onVerified={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </div>
  );
}
