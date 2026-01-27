import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useDictionary, useNotification } from '@/lib/hooks';
import { MailCheck, Pencil } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { sendVerificationEmail } from '@/graphql/firebaseAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChangeEmailForm } from './ChangeEmailForm';

interface EmailVerificationStepProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({ email, onVerified, onBack }) => {
  const dict = useDictionary();
  const { open } = useNotification();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [currentEmail, setCurrentEmail] = useState(email);

  // This effect polls for email verification status
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          clearInterval(interval);
          onVerified();
        }
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [onVerified]);

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
      await sendVerificationEmail();
      open('success', dict.notifications.verification.resentTitle, { message: dict.notifications.verification.resentMessage });
      setResendCooldown(60); // 60-second cooldown
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      open('error', 'Error', { message: 'Failed to resend email.' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-6 w-full sm:max-w-md">
      <MailCheck className="w-16 h-16 text-blue-500" />
      <h2 className="text-2xl font-bold">{dict.register.verifyEmailTitle}</h2>
      <p className="text-muted-foreground" dangerouslySetInnerHTML={{
        __html: dict.register.verifyEmailMessage.replace('{email}', `<strong>${currentEmail}</strong>`)
      }} />

      <Dialog open={isChangeEmailOpen} onOpenChange={setIsChangeEmailOpen}>
        <DialogTrigger asChild>
          <Button variant="link" className="text-sm">
            <Pencil className="mr-2 h-4 w-4" />
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

      <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
        <Button className="flex-1" variant="outline" onClick={onBack}>
          {dict.button.back}
        </Button>
        <Button className="flex-1" onClick={handleResendEmail} disabled={isResending || resendCooldown > 0}>
          {isResending
            ? dict.button.sending
            : resendCooldown > 0
            ? `${dict.button.resend} (${resendCooldown}s)`
            : dict.button.resend}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">{dict.register.verifyEmailSpam}</p>
    </div>
  );
};
