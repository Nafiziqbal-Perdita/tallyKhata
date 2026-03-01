import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const STORAGE_KEY_PREFIX = "sb-auth-";
const SECURE_STORE_CHUNK_SIZE = 1800;

const toStorageKey = (key: string) => `${STORAGE_KEY_PREFIX}${key}`;
const toChunkCountKey = (storageKey: string) => `${storageKey}:chunk-count`;
const toChunkKey = (storageKey: string, index: number) => `${storageKey}:chunk:${index}`;

const readNativeValue = async (storageKey: string): Promise<string | null> => {
  const chunkCountKey = toChunkCountKey(storageKey);
  const chunkCountRaw = await SecureStore.getItemAsync(chunkCountKey);

  if (!chunkCountRaw) {
    return SecureStore.getItemAsync(storageKey);
  }

  const chunkCount = Number.parseInt(chunkCountRaw, 10);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0) {
    return null;
  }

  const chunks: string[] = [];
  for (let i = 0; i < chunkCount; i += 1) {
    const part = await SecureStore.getItemAsync(toChunkKey(storageKey, i));
    if (part === null) {
      return null;
    }
    chunks.push(part);
  }

  return chunks.join("");
};

const clearNativeValue = async (storageKey: string): Promise<void> => {
  const chunkCountKey = toChunkCountKey(storageKey);
  const chunkCountRaw = await SecureStore.getItemAsync(chunkCountKey);

  if (chunkCountRaw) {
    const chunkCount = Number.parseInt(chunkCountRaw, 10);
    if (Number.isFinite(chunkCount) && chunkCount > 0) {
      for (let i = 0; i < chunkCount; i += 1) {
        await SecureStore.deleteItemAsync(toChunkKey(storageKey, i));
      }
    }
    await SecureStore.deleteItemAsync(chunkCountKey);
  }

  await SecureStore.deleteItemAsync(storageKey);
};

const writeNativeValue = async (storageKey: string, value: string): Promise<void> => {
  await clearNativeValue(storageKey);

  if (value.length <= SECURE_STORE_CHUNK_SIZE) {
    await SecureStore.setItemAsync(storageKey, value);
    return;
  }

  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += SECURE_STORE_CHUNK_SIZE) {
    chunks.push(value.slice(i, i + SECURE_STORE_CHUNK_SIZE));
  }

  for (let i = 0; i < chunks.length; i += 1) {
    await SecureStore.setItemAsync(toChunkKey(storageKey, i), chunks[i]);
  }

  await SecureStore.setItemAsync(toChunkCountKey(storageKey), String(chunks.length));
};

const supabaseStorage = {
  getItem: async (key: string) => {
    const storageKey = toStorageKey(key);

    if (Platform.OS === "web") {
      return typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    }

    try {
      return await readNativeValue(storageKey);
    } catch (error) {
      console.warn("[supabaseStorage] getItem failed", { key: storageKey, error });
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    const storageKey = toStorageKey(key);

    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, value);
      }
      return;
    }

    try {
      await writeNativeValue(storageKey, value);
    } catch (error) {
      console.warn("[supabaseStorage] setItem failed", {
        key: storageKey,
        valueLength: value.length,
        error,
      });
      throw error;
    }
  },
  removeItem: async (key: string) => {
    const storageKey = toStorageKey(key);

    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
      }
      return;
    }

    try {
      await clearNativeValue(storageKey);
    } catch (error) {
      console.warn("[supabaseStorage] removeItem failed", { key: storageKey, error });
    }
  },
};

export const createSupabaseClient = (token?: string) => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL in .env");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_ANON_KEY in .env");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: supabaseStorage,
    },
  });
};
