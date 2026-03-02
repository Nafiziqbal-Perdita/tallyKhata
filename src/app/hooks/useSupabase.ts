import { createSupabaseClient } from "@/lib/supabase";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useCallback, useMemo, useState } from "react";

const normalizeBdPhone = (rawValue: string) => {
  const digits = rawValue.replace(/[^0-9]/g, "");

  if (digits.startsWith("00880") && digits.length >= 15) {
    return `0${digits.slice(5, 15)}`;
  }

  if (digits.startsWith("880") && digits.length >= 13) {
    return `0${digits.slice(3, 13)}`;
  }

  if (digits.startsWith("01") && digits.length >= 11) {
    return digits.slice(0, 11);
  }

  if (digits.startsWith("1") && digits.length === 10) {
    return `0${digits}`;
  }

  return digits;
};

type Business = {
  id: string;
  user_id: string;
  name: string;
};

type CreateStockInput = {
  name: string;
  unit: string;
  costPerUnit: number;
  openingStock?: number;
};

type UpdateStockInput = {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  openingStock: number;
  totalSold: number;
};

type CreateCustomerSupplierInput = {
  partyType: "customer" | "supplier";
  name: string;
  phone: string;
  totalPayable?: number;
  totalReceivable?: number;
  description?: string;
  recordDate?: string;
  avatarUrl?: string | null;
};

type UpdateCustomerSupplierInput = {
  id: string;
  partyType: "customer" | "supplier";
  name: string;
  phone: string;
  totalPayable?: number;
  totalReceivable?: number;
  description?: string;
  recordDate?: string;
  avatarUrl?: string | null;
};

type DeleteCustomerSupplierInput = {
  id: string;
};

export type Stock = {
  id: string;
  user_id: string;
  business_id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  total_sold: number;
  opening_stock: number;
  created_at: string;
};

export type CustomerSupplier = {
  id: string;
  user_id: string;
  business_id: string;
  party_type: "customer" | "supplier";
  name: string;
  phone: string;
  total_payable: number;
  total_receivable: number;
  description: string | null;
  record_date: string;
  avatar_url: string | null;
  created_at: string;
};

const useSupabase = () => {
  const [loading, setLoading] = useState<boolean | null>(null);
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const userId = user?.id;

  const getOrCreateBusiness = useCallback(async () => {
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
          },
        )
        .select("*");

      if (upserted.error) {
        throw upserted.error;
      }

      let business: Business | null =
        (upserted.data?.[0] as Business | undefined) ?? null;

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

        business = (refetched.data?.[0] as Business | undefined) ?? null;
      }

      if (!business) {
        throw new Error(
          "Business upsert completed but no row was returned. Check table permissions/query filters.",
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

  const setBusiness = useCallback(async () => {
    return getOrCreateBusiness();
  }, [getOrCreateBusiness]);

  const getBusiness = useCallback(async () => {
    try {
      if (!isLoaded || !isSignedIn || !userId) {
        console.log("Auth not ready yet");
        return null;
      }

      const supabase = createSupabaseClient();

      const result = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (result.error) {
        throw result.error;
      }

      return (result.data?.[0] as Business | undefined) ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log("Error getting business:", message);
      console.log("Error getting business (full):", error);
      return null;
    }
  }, [isLoaded, isSignedIn, userId]);

  const createStock = useCallback(
    async ({ name, unit, costPerUnit, openingStock = 0 }: CreateStockInput) => {
      try {
        setLoading(true);

        if (!isLoaded || !isSignedIn || !userId) {
          throw new Error("Authentication is not ready");
        }

        const cleanedName = name.trim();
        const cleanedUnit = unit.trim();

        if (!cleanedName) {
          throw new Error("Stock name is required");
        }

        if (!cleanedUnit) {
          throw new Error("Stock unit is required");
        }

        if (!Number.isFinite(costPerUnit) || costPerUnit <= 0) {
          throw new Error("Cost per unit must be greater than 0");
        }

        if (!Number.isFinite(openingStock) || openingStock < 0) {
          throw new Error("Opening stock cannot be negative");
        }

        const business = await getOrCreateBusiness();

        if (!business?.id) {
          throw new Error("Business not found for this user");
        }

        const supabase = createSupabaseClient();
        const totalCost = Number((costPerUnit * openingStock).toFixed(2));

        const inserted = await supabase
          .from("stocks")
          .insert({
            user_id: userId,
            business_id: business.id,
            name: cleanedName,
            unit: cleanedUnit,
            cost_per_unit: costPerUnit,
            opening_stock: openingStock,
            total_cost: totalCost,
            total_sold: 0,
          })
          .select(
            "id, user_id, business_id, name, unit, cost_per_unit, total_cost, total_sold, opening_stock, created_at",
          )
          .single();

        if (inserted.error) {
          throw inserted.error;
        }

        return inserted.data as Stock;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log("Error creating stock:", message);
        console.log("Error creating stock (full):", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getOrCreateBusiness, isLoaded, isSignedIn, userId],
  );

  const getStocks = useCallback(async () => {
    try {
      setLoading(true);

      if (!isLoaded || !isSignedIn || !userId) {
        return [] as Stock[];
      }

      const business = await getBusiness();

      if (!business?.id) {
        return [] as Stock[];
      }

      const supabase = createSupabaseClient();

      const result = await supabase
        .from("stocks")
        .select(
          "id, user_id, business_id, name, unit, cost_per_unit, total_cost, total_sold, opening_stock, created_at",
        )
        .eq("user_id", userId)
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []) as Stock[];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log("Error fetching stocks:", message);
      console.log("Error fetching stocks (full):", error);
      return [] as Stock[];
    } finally {
      setLoading(false);
    }
  }, [getBusiness, isLoaded, isSignedIn, userId]);

  const updateStock = useCallback(
    async ({
      id,
      name,
      unit,
      costPerUnit,
      openingStock,
      totalSold,
    }: UpdateStockInput) => {
      try {
        setLoading(true);

        if (!isLoaded || !isSignedIn || !userId) {
          throw new Error("Authentication is not ready");
        }

        const cleanedName = name.trim();
        const cleanedUnit = unit.trim();

        if (!id.trim()) {
          throw new Error("Stock id is required");
        }

        if (!cleanedName) {
          throw new Error("Stock name is required");
        }

        if (!cleanedUnit) {
          throw new Error("Stock unit is required");
        }

        if (!Number.isFinite(costPerUnit) || costPerUnit <= 0) {
          throw new Error("Cost per unit must be greater than 0");
        }

        if (!Number.isFinite(openingStock) || openingStock < 0) {
          throw new Error("Opening stock cannot be negative");
        }

        if (!Number.isFinite(totalSold) || totalSold < 0) {
          throw new Error("Total sold cannot be negative");
        }

        const business = await getOrCreateBusiness();

        if (!business?.id) {
          throw new Error("Business not found for this user");
        }

        const supabase = createSupabaseClient();
        const totalCost = Number((costPerUnit * openingStock).toFixed(2));

        const updated = await supabase
          .from("stocks")
          .update({
            name: cleanedName,
            unit: cleanedUnit,
            cost_per_unit: costPerUnit,
            opening_stock: openingStock,
            total_cost: totalCost,
            total_sold: totalSold,
          })
          .eq("id", id)
          .eq("user_id", userId)
          .eq("business_id", business.id)
          .select(
            "id, user_id, business_id, name, unit, cost_per_unit, total_cost, total_sold, opening_stock, created_at",
          )
          .single();

        if (updated.error) {
          throw updated.error;
        }

        return updated.data as Stock;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log("Error updating stock:", message);
        console.log("Error updating stock (full):", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getOrCreateBusiness, isLoaded, isSignedIn, userId],
  );

  const createCustomerSupplier = useCallback(
    async ({
      partyType,
      name,
      phone,
      totalPayable = 0,
      totalReceivable = 0,
      description,
      recordDate,
      avatarUrl,
    }: CreateCustomerSupplierInput) => {
      try {
        setLoading(true);

        if (!isLoaded || !isSignedIn || !userId) {
          throw new Error("Authentication is not ready");
        }

        const cleanedName = name.trim();
        const cleanedPhone = normalizeBdPhone(phone);

        if (!cleanedName) {
          throw new Error("Name is required");
        }

        if (!/^01\d{9}$/.test(cleanedPhone)) {
          throw new Error("Valid phone number is required");
        }

        if (!Number.isFinite(totalPayable) || totalPayable < 0) {
          throw new Error("Total payable cannot be negative");
        }

        if (!Number.isFinite(totalReceivable) || totalReceivable < 0) {
          throw new Error("Total receivable cannot be negative");
        }

        const business = await getOrCreateBusiness();

        if (!business?.id) {
          throw new Error("Business not found for this user");
        }

        const supabase = createSupabaseClient();

        const inserted = await supabase
          .from("customer_suppliers")
          .insert({
            user_id: userId,
            business_id: business.id,
            party_type: partyType,
            name: cleanedName,
            phone: cleanedPhone,
            total_payable: Number(totalPayable.toFixed(2)),
            total_receivable: Number(totalReceivable.toFixed(2)),
            description: description?.trim() || null,
            record_date: recordDate ?? new Date().toISOString().slice(0, 10),
            avatar_url: avatarUrl ?? null,
          })
          .select(
            "id, user_id, business_id, party_type, name, phone, total_payable, total_receivable, description, record_date, avatar_url, created_at",
          )
          .single();

        if (inserted.error) {
          throw inserted.error;
        }

        return inserted.data as CustomerSupplier;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log("Error creating customer/supplier:", message);
        console.log("Error creating customer/supplier (full):", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getOrCreateBusiness, isLoaded, isSignedIn, userId],
  );

  const getCustomerSuppliers = useCallback(async () => {
    try {
      setLoading(true);

      if (!isLoaded || !isSignedIn || !userId) {
        return [] as CustomerSupplier[];
      }

      const business = await getBusiness();

      if (!business?.id) {
        return [] as CustomerSupplier[];
      }

      const supabase = createSupabaseClient();

      const result = await supabase
        .from("customer_suppliers")
        .select(
          "id, user_id, business_id, party_type, name, phone, total_payable, total_receivable, description, record_date, avatar_url, created_at",
        )
        .eq("user_id", userId)
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []) as CustomerSupplier[];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log("Error fetching customer/suppliers:", message);
      console.log("Error fetching customer/suppliers (full):", error);
      return [] as CustomerSupplier[];
    } finally {
      setLoading(false);
    }
  }, [getBusiness, isLoaded, isSignedIn, userId]);

  const updateCustomerSupplier = useCallback(
    async ({
      id,
      partyType,
      name,
      phone,
      totalPayable = 0,
      totalReceivable = 0,
      description,
      recordDate,
      avatarUrl,
    }: UpdateCustomerSupplierInput) => {
      try {
        setLoading(true);

        if (!isLoaded || !isSignedIn || !userId) {
          throw new Error("Authentication is not ready");
        }

        const cleanedId = id.trim();
        const cleanedName = name.trim();
        const cleanedPhone = normalizeBdPhone(phone);

        if (!cleanedId) {
          throw new Error("Customer/Supplier id is required");
        }

        if (!cleanedName) {
          throw new Error("Name is required");
        }

        if (!/^01\d{9}$/.test(cleanedPhone)) {
          throw new Error("Valid phone number is required");
        }

        if (!Number.isFinite(totalPayable) || totalPayable < 0) {
          throw new Error("Total payable cannot be negative");
        }

        if (!Number.isFinite(totalReceivable) || totalReceivable < 0) {
          throw new Error("Total receivable cannot be negative");
        }

        const business = await getOrCreateBusiness();

        if (!business?.id) {
          throw new Error("Business not found for this user");
        }

        const supabase = createSupabaseClient();

        const updatePayload: {
          party_type: "customer" | "supplier";
          name: string;
          phone: string;
          total_payable: number;
          total_receivable: number;
          description?: string | null;
          record_date?: string;
          avatar_url?: string | null;
        } = {
          party_type: partyType,
          name: cleanedName,
          phone: cleanedPhone,
          total_payable: Number(totalPayable.toFixed(2)),
          total_receivable: Number(totalReceivable.toFixed(2)),
        };

        if (description !== undefined) {
          updatePayload.description = description.trim() || null;
        }

        if (recordDate !== undefined) {
          updatePayload.record_date = recordDate;
        }

        if (avatarUrl !== undefined) {
          updatePayload.avatar_url = avatarUrl;
        }

        const updated = await supabase
          .from("customer_suppliers")
          .update(updatePayload)
          .eq("id", cleanedId)
          .eq("user_id", userId)
          .eq("business_id", business.id)
          .select(
            "id, user_id, business_id, party_type, name, phone, total_payable, total_receivable, description, record_date, avatar_url, created_at",
          )
          .single();

        if (updated.error) {
          throw updated.error;
        }

        return updated.data as CustomerSupplier;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log("Error updating customer/supplier:", message);
        console.log("Error updating customer/supplier (full):", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getOrCreateBusiness, isLoaded, isSignedIn, userId],
  );

  const deleteCustomerSupplier = useCallback(
    async ({ id }: DeleteCustomerSupplierInput) => {
      try {
        setLoading(true);

        if (!isLoaded || !isSignedIn || !userId) {
          throw new Error("Authentication is not ready");
        }

        const cleanedId = id.trim();

        if (!cleanedId) {
          throw new Error("Customer/Supplier id is required");
        }

        const business = await getOrCreateBusiness();

        if (!business?.id) {
          throw new Error("Business not found for this user");
        }

        const supabase = createSupabaseClient();

        const deleted = await supabase
          .from("customer_suppliers")
          .update({ is_active: false })
          .eq("id", cleanedId)
          .eq("user_id", userId)
          .eq("business_id", business.id)
          .select("id")
          .single();

        if (deleted.error) {
          throw deleted.error;
        }

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log("Error deleting customer/supplier:", message);
        console.log("Error deleting customer/supplier (full):", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getOrCreateBusiness, isLoaded, isSignedIn, userId],
  );

  return useMemo(
    () => ({
      loading,
      setLoading,
      setBusiness,
      createStock,
      getStocks,
      updateStock,
      createCustomerSupplier,
      getCustomerSuppliers,
      updateCustomerSupplier,
      deleteCustomerSupplier,
    }),
    [
      loading,
      setBusiness,
      createStock,
      getStocks,
      updateStock,
      createCustomerSupplier,
      getCustomerSuppliers,
      updateCustomerSupplier,
      deleteCustomerSupplier,
    ],
  );
};

export default useSupabase;
