"use client"

import { EmailVerificationStep } from "@/components/EmailVerificationStep";
import { useDictionary, useNotification } from "@/lib/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyEmailPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const { open } = useNotification();
    const dict = useDictionary();

    if (!email) {
        // Rediriger si aucun e-mail n'est fourni
        if (typeof window !== "undefined") {
            router.replace('/login');
        }
        return null;
    }

    const handleVerified = () => {
        open("success", dict.notifications.verification.successTitle, { message: dict.notifications.verification.successMessage });
        // Une fois vérifié, on peut essayer de le connecter ou le renvoyer au login
        router.push('/login');
    };

    const handleEmailChanged = () => {
        // Redirect to login page after email change request
        router.push('/login');
    };

    const handleBack = () => {
        // Retour simple à la page de connexion
        router.push('/login');
    };

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <EmailVerificationStep email={email} onVerified={handleVerified} onBack={handleBack} />
            <EmailVerificationStep email={email} onVerified={handleVerified} onEmailChanged={handleEmailChanged} onBack={handleBack} />
        </div>
    );
}


export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailPageContent />
        </Suspense>
    )
}