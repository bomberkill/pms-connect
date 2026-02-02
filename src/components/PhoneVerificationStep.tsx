import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useDictionary } from "@/hooks/use-dictionary";
// import { getAuth } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier?: import("firebase/auth").RecaptchaVerifier;
  }
}

interface PhoneVerificationStepProps {
  phoneNumber: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onResend: () => Promise<void>;
  isVerifying: boolean;
}

export function PhoneVerificationStep({ phoneNumber, value, onChange, error, onResend, isVerifying }: PhoneVerificationStepProps) {
  const dict = useDictionary();
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // const auth = getAuth();

  // Initialise le reCAPTCHA une seule fois
  // const setupRecaptcha = () => {
  //   if (!window.recaptchaVerifier) {
  //     window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
  //       size: "invisible",
  //     });
  //   }
  // };

  const handleResend = async () => {
    try {
      setLoading(true);
      setResendError(null);
      await onResend();
      setCountdown(60); // Start countdown after successful resend
    } catch (err) {
      console.error("Erreur d’envoi OTP:", err);
      setResendError(dict.auth.otp.resendError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="flex flex-col gap-6 min-w-full sm:min-w-[400px]">
      <div className="text-sm text-center">
        {dict.auth.otp.sentTo} <strong>{phoneNumber}</strong>
      </div>

      <InputOTP maxLength={6} value={value} onChange={onChange}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>

      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
      {resendError && <p className="text-red-500 text-xs text-center">{resendError}</p>}

      <Button
        type="button"
        variant="link"
        onClick={handleResend}
        disabled={loading || countdown > 0 || isVerifying}
      >
        {countdown > 0 ? `${dict.auth.otp.resendIn} ${countdown}s` : dict.auth.otp.resend}
      </Button>
      {/* Conteneur reCAPTCHA invisible */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
