import useSupabase from "@/app/hooks/useSupabase";
import { useCallback, useMemo, useState } from "react";

export type CashbookKind =
  | "cash_sale"
  | "cash_buy"
  | "expense"
  | "owner_gave"
  | "owner_took";

export type CashbookDirection = "in" | "out";

export type CashbookEntry = {
  id: string;
  user_id: string;
  business_id: string;
  kind: CashbookKind;
  direction: CashbookDirection;
  title: string;
  amount: number;
  note: string | null;
  image_url: string | null;
  entry_date: string;
  created_at: string;
};

export type CashbookOverview = {
  currentCash: number;
  todayIn: number;
  todayOut: number;
};

export type CashbookKindTotals = Record<CashbookKind, number>;

export type CreateCashbookEntryInput = {
  kind: CashbookKind;
  direction: CashbookDirection;
  title: string;
  amount: number;
  note?: string;
  imageUrl?: string | null;
  entryDate?: string;
};

const DEFAULT_KIND_TOTALS: CashbookKindTotals = {
  cash_sale: 0,
  cash_buy: 0,
  expense: 0,
  owner_gave: 0,
  owner_took: 0,
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
};

const useCashbook = () => {
  const { getSupabaseContext } = useSupabase();
  const [loading, setLoading] = useState<boolean>(false);

  const createEntry = useCallback(
    async ({
      kind,
      direction,
      title,
      amount,
      note,
      imageUrl,
      entryDate,
    }: CreateCashbookEntryInput) => {
      try {
        setLoading(true);

        const cleanedTitle = title.trim();

        if (!cleanedTitle) {
          throw new Error("লেনদেনের নাম দিন");
        }

        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("সঠিক পরিমাণ দিন");
        }

        const { userId, businessId, supabase } = await getSupabaseContext();

        const inserted = await supabase
          .from("cashbook_entries")
          .insert({
            user_id: userId,
            business_id: businessId,
            kind,
            direction,
            title: cleanedTitle,
            amount: Number(amount.toFixed(2)),
            note: note?.trim() || null,
            image_url: imageUrl ?? null,
            entry_date: entryDate ?? new Date().toISOString().slice(0, 10),
          })
          .select(
            "id, user_id, business_id, kind, direction, title, amount, note, image_url, entry_date, created_at",
          )
          .single();

        if (inserted.error) {
          throw new Error(inserted.error.message);
        }

        return {
          ...inserted.data,
          amount: toNumber(inserted.data?.amount),
        } as CashbookEntry;
      } finally {
        setLoading(false);
      }
    },
    [getSupabaseContext],
  );

  const getOverview = useCallback(async (): Promise<CashbookOverview> => {
    try {
      setLoading(true);

      const { userId, businessId, supabase } = await getSupabaseContext();

      const overviewResult = await supabase.rpc("get_cashbook_overview", {
        p_user_id: userId,
        p_business_id: businessId,
      });

      if (overviewResult.error) {
        throw new Error(overviewResult.error.message);
      }

      const first = overviewResult.data?.[0];

      return {
        currentCash: toNumber(first?.current_cash),
        todayIn: toNumber(first?.today_in),
        todayOut: toNumber(first?.today_out),
      };
    } finally {
      setLoading(false);
    }
  }, [getSupabaseContext]);

  const getKindTotals = useCallback(async (): Promise<CashbookKindTotals> => {
    try {
      setLoading(true);

      const { userId, businessId, supabase } = await getSupabaseContext();

      const result = await supabase
        .from("cashbook_entries")
        .select("kind, amount")
        .eq("user_id", userId)
        .eq("business_id", businessId)
        .eq("is_active", true);

      if (result.error) {
        throw new Error(result.error.message);
      }

      const totals = { ...DEFAULT_KIND_TOTALS };

      (result.data ?? []).forEach((row) => {
        const key = row.kind as CashbookKind;

        if (totals[key] === undefined) {
          return;
        }

        totals[key] += toNumber(row.amount);
      });

      return totals;
    } finally {
      setLoading(false);
    }
  }, [getSupabaseContext]);

  return useMemo(
    () => ({
      loading,
      createEntry,
      getOverview,
      getKindTotals,
    }),
    [createEntry, getKindTotals, getOverview, loading],
  );
};

export default useCashbook;
