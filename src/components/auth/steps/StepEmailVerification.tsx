import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { Info, MailCheck, Pencil } from 'lucide-react';
import { sendVerificationEmail } from '@/graphql/betterAuth';
import { checkEmailVerified } from '@/app/actions/auth-status';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChangeEmailForm } from '../../ChangeEmailForm';

interface EmailVerificationStepProps {
  email: string;
  onVerified: () => void | Promise<void>;
  onBack: () => void;
}

export const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({ email, onVerified, onBack }) => {
  const dict = useDictionary();
  const { open } = useNotification();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [currentEmail, setCurrentEmail] = useState(email);

  // The `email` prop can arrive empty on mount and only get populated a tick
  // later (e.g. the wizard restoring persisted form values asynchronously
  // after `currentStep` itself was already restored synchronously). Pick up
  // that late value once, without ever overwriting a deliberate change made
  // via ChangeEmailForm below.
  useEffect(() => {
    if (email && !currentEmail) {
      setCurrentEmail(email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // This effect polls for email verification status. It checks the account's
  // state directly in the database (not the local session), so it also
  // picks up verification done on another device/browser.
  useEffect(() => {
    const interval = setInterval(async () => {
      const verified = await checkEmailVerified(currentEmail);
      if (verified) {
        clearInterval(interval);
        await onVerified();
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [currentEmail, onVerified]);

  // This effect manages the resend button cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      await sendVerificationEmail(currentEmail);
      open('success', dict.notifications.verification.resentTitle, { message: dict.notifications.verification.resentMessage });
      setResendCooldown(60); // 60-second cooldown
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      open('error', 'Error', { message: 'Failed to resend email.' });
    } finally {
      setIsResending(false);
    }
  };

  const resendLabel = isResending
    ? dict.button.sending
    : resendCooldown > 0
      ? `${dict.button.resend} (${resendCooldown}s)`
      : dict.button.resend;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-card bg-primary-50 text-primary dark:bg-primary-950 dark:text-primary-300">
        <MailCheck className="size-8" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{dict.register.verifyEmailTitle}</h1>
        <p className="text-muted-foreground text-sm text-balance" dangerouslySetInnerHTML={{
          __html: dict.register.verifyEmailMessage.replace('{email}', `<strong class="text-foreground">${currentEmail}</strong>`)
        }} />
      </div>

      <Button
        onClick={handleResendEmail}
        disabled={isResending || resendCooldown > 0}
        size="xl"
        variant={resendCooldown > 0 ? "outline" : "default"}
        className={resendCooldown > 0 ? "opacity-60" : undefined}
      >
        {resendLabel}
      </Button>

      <Dialog open={isChangeEmailOpen} onOpenChange={setIsChangeEmailOpen}>
        <DialogTrigger asChild>
          <Button variant="link" size="sm" className="text-sm text-muted-foreground">
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {dict.button.changeEmail}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.changeEmail.title}</DialogTitle>
            <DialogDescription>{dict.changeEmail.description}</DialogDescription>
          </DialogHeader>
          <ChangeEmailForm currentEmail={currentEmail} onSuccess={(newEmail) => { setCurrentEmail(newEmail); setIsChangeEmailOpen(false); }} onCancel={() => setIsChangeEmailOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex items-start gap-3 rounded-card bg-muted p-4 text-left">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-5 text-muted-foreground">{dict.register.verifyEmailSpam}</p>
      </div>

      <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
        {dict.button.back}
      </Button>
    </div>
  );
};
