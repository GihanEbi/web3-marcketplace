"use client";

import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { withdrawApplication } from "@/services";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string | null;
  jobTitle?: string;
  companyName?: string;
}

/** Confirmation + service call for withdrawing an application. */
export function WithdrawDialog({ open, onOpenChange, applicationId, jobTitle, companyName }: WithdrawDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Withdraw this application?"
      description={
        <>
          You are about to withdraw your application for <strong>{jobTitle ?? "this role"}</strong>
          {companyName ? <> at {companyName}</> : null}. The employer will be notified and you can apply again later if the role is still open.
        </>
      }
      confirmLabel="Withdraw application"
      destructive
      onConfirm={async () => {
        if (!applicationId) return;
        try {
          await withdrawApplication(applicationId);
          toast.success("Application withdrawn");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not withdraw the application");
        }
      }}
    />
  );
}
