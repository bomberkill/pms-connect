import { createClient } from "@supabase/supabase-js";
import { auth } from "./firebase";

export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {    
        accessToken: async () => {
            return (await auth.currentUser?.getIdToken(/* forceRefresh */ true)) ?? null
        },
    }
);