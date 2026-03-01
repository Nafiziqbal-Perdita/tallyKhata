import { createSupabaseClient } from "@/lib/supabase";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useCallback, useMemo, useState } from "react";

type Business = {
    id: string;
    user_id: string;
    name: string;
};

const useSupabase = () => {
    const [loading, setLoading] = useState<boolean | null>(null);
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    const userId = user?.id;

    const setBusiness = useCallback(async () => {
        try {
            setLoading(true);

            if (!isLoaded || !isSignedIn || !userId) {
                console.log("Auth not ready yet");
                return null;
            }

            const supabase = createSupabaseClient();

            const upserted = await supabase
                .from("businesses")
                .upsert(
                    {
                        user_id: userId,
                        name: "My Shop",
                    },
                    {
                        onConflict: "user_id",
                        ignoreDuplicates: true,
                    }
                )
                .select("*");

            if (upserted.error) {
                throw upserted.error;
            }

            let business: Business | null =
                ((upserted.data?.[0] as Business | undefined) ?? undefined) ?? null;

            if (!business) {
                const refetched = await supabase
                    .from("businesses")
                    .select("*")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false })
                    .limit(1);

                if (refetched.error) {
                    throw refetched.error;
                }

                business = ((refetched.data?.[0] as Business | undefined) ?? undefined) ?? null;
            }

            if (!business) {
                throw new Error(
                    "Business upsert completed but no row was returned. Check table permissions/query filters."
                );
            }

            console.log("Final Business:", business);
            return business;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.log("Error setting business:", message);
            console.log("Error setting business (full):", error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [isLoaded, isSignedIn, userId]);

    return useMemo(
        () => ({ loading, setLoading, setBusiness }),
        [loading, setBusiness]
    );
};

export default useSupabase;