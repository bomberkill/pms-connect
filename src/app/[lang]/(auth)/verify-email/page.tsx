"use client"

import { EmailVerificationStep } from "@/components/auth/steps/StepEmailVerification";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyEmailPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    const { open } = useNotification();
    const dict = useDictionary();

    // Coming from the link in the verification email: consume the token
    // directly instead of showing the "check your inbox" polling UI below.
    const [isConsumingToken, setIsConsumingToken] = useState(!!token);

    useEffect(() => {
        if (!token) return;
        authClient.verifyEmail({ query: { token } })
            .then(({ error }) => {
                if (error) {
                    open("error", dict.globalErrors.default, { message: error.message || dict.globalErrors.defaultDescription });
                    router.replace('/login');
                    return;
                }
                open("success", dict.notifications.verification.successTitle, { message: dict.notifications.verification.successMessage });
                router.replace('/login');
            })
            .finally(() => setIsConsumingToken(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Redirect if neither a token (from the emailed link) nor an email (from
    // the "check your inbox" redirect) is present. Done in an effect, not
    // during render, so we don't setState-on-Router while this component is
    // still rendering.
    useEffect(() => {
        if (!isConsumingToken && !token && !email) {
            router.replace('/login');
        }
    }, [isConsumingToken, token, email, router]);

    if (isConsumingToken) {
        return (
            <div className="container relative flex min-h-svh flex-col items-center justify-center px-4">
                <p className="text-muted-foreground">{dict.button.sending}</p>
            </div>
        );
    }

    if (!email) {
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