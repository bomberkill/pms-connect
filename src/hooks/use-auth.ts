import { useSession } from "@/lib/auth-client";

export const useAuthObserver = () => {
    const { data: session, isPending } = useSession();

    return { initialized: !isPending, authUserId: session?.user?.id ?? null };
}
