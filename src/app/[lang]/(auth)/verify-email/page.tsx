"use client"

import { EmailVerificationStep } from "@/components/auth/steps/StepEmailVerification";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
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



    const handleBack = () => {
        // Retour simple à la page de connexion
        router.push('/login');
    };

    return (
        <div className="container relative flex min-h-svh flex-col items-center justify-center px-4">
            <EmailVerificationStep email={email} onVerified={handleVerified} onBack={handleBack} />
        </div>
    );
}


export default function VerifyEmailPage() {
    // We can't use useDictionary here easily because it might not be inside the provider context if this page is high up, 
    // but typically it is. Assuming useDictionary is safe to use here.
    // Actually, safe to just use "Loading..." or we need to extract dict.
    // Let's assume we can fetch dict inside.
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailPageContent />
        </Suspense>
    )
}