import { palette } from "@/theme/palette";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSupabase from "../hooks/useSupabase";

export default function HomeTab() {
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();
  const { setBusiness } = useSupabase();
  const [query, setQuery] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      void setBusiness();
    }
  }, [isLoaded, user, setBusiness]);

  const quickActions = useMemo(
    () => [
      { key: "multi-business", label: "মাল্টি ব্যবসা", icon: "storefront-outline" as const },
      { key: "income", label: "ইনক হিসাব", icon: "stats-chart-outline" as const },
      { key: "notes", label: "ব্যবসার নোট", icon: "document-text-outline" as const },
      { key: "group", label: "গ্রুপ তাগাদা", icon: "people-outline" as const },
      { key: "qr", label: "QR কোড", icon: "qr-code-outline" as const },
      { key: "backup", label: "ডাটা ব্যাকআপ", icon: "cloud-upload-outline" as const },
      { key: "tally-message", label: "টালি-মেসেজ", icon: "chatbubble-ellipses-outline" as const },
      { key: "cashbox", label: "ক্যাশবাক্স", icon: "cash-outline" as const },
    ],
    []
  );

  const customers = useMemo(
    () => [
      { key: "gemini", initials: "GE", name: "Gemini", days: "৮ দিন", amount: "৫৬৩,৪৫০.০০" },
      { key: "barbee", initials: "BA", name: "BarBee", days: "৭ দিন", amount: "১,৮৭১.০০" },
    ],
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28">
        {/* Header */}
        <View className="flex-row items-center justify-between pt-2">
          <Pressable className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary border border-primary/20">
              <Text className="text-background font-bold">T</Text>
            </View>
            <View>
              <Text className="text-foreground text-base font-semibold">Tally</Text>
              <Text className="text-foreground-muted text-xs">
                {user?.fullName ?? user?.firstName ?? "User"}
              </Text>
            </View>
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Pressable className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface active:opacity-90">
              <Text className="text-foreground-muted">✉</Text>
            </Pressable>
            <Pressable className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface active:opacity-90">
              <Text className="text-foreground-muted">?</Text>
            </Pressable>

            <Pressable
              onPress={handleSignOut}
              disabled={isSigningOut}
              className="h-10 flex-row items-center justify-center rounded-xl border border-border bg-surface px-3 active:opacity-90"
            >
              {isSigningOut ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color={palette.primary} />
                  <Text className="ml-2 text-foreground-muted text-xs font-semibold">
                    Signing out...
                  </Text>
                </View>
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={18} color={palette.primary} />
                  <Text className="ml-2 text-foreground-muted text-xs font-semibold">Sign out</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Banner */}
        <View className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4">
          <Text className="text-foreground text-sm font-semibold">
            রকেট ও বিকাশ থেকে QR পেমেন্ট হচ্ছে
          </Text>
          <Text className="text-foreground-muted mt-1 text-xs">
            আপনার ব্যবসার জন্য দ্রুত পেমেন্ট সংগ্রহ করুন
          </Text>
        </View>

        {/* Quick actions grid */}
        <View className="mt-5 flex-row flex-wrap justify-between">
          {quickActions.map((item) => (
            <Pressable
              key={item.key}
              className="mb-4 w-[23%] items-center"
            >
              <View className="h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <Ionicons name={item.icon} size={24} color={palette.primary} />
              </View>
              <Text className="text-foreground-muted mt-2 text-[11px] text-center">
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Totals */}
        <View className="mt-1 rounded-2xl border border-border bg-surface px-4 py-4">
          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text className="text-foreground text-xl font-bold">৫,৬৮,৩২১</Text>
              <Text className="text-foreground-muted mt-1 text-xs">মোট পাবো</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="flex-1 items-center">
              <Text className="text-foreground text-xl font-bold">০</Text>
              <Text className="text-foreground-muted mt-1 text-xs">মোট দেবো</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View className="mt-4 flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center rounded-2xl border border-border bg-surface px-4 py-3">
            <Text className="text-foreground-muted mr-2">🔎</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="খোঁজ"
              className="flex-1 text-foreground"
            />
          </View>
          <Pressable className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface active:opacity-90">
            <Text className="text-foreground-muted">≡</Text>
          </Pressable>
          <Pressable className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface active:opacity-90">
            <Text className="text-foreground-muted">⬇</Text>
          </Pressable>
        </View>

        {/* Customers header */}
        <View className="mt-5 flex-row items-center justify-between">
          <Text className="text-foreground-muted text-xs">কাস্টমার ২ / সাপ্লায়ার ০</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground-muted text-xs">পাবো</Text>
            <Text className="text-foreground-muted text-xs">/</Text>
            <Text className="text-foreground-muted text-xs">দেবো</Text>
          </View>
        </View>

        {/* Customers list */}
        <View className="mt-3 rounded-2xl border border-border bg-surface">
          {customers.map((c, idx) => (
            <View
              key={c.key}
              className={
                "flex-row items-center px-4 py-4" +
                (idx !== customers.length - 1 ? " border-b border-border" : "")
              }
            >
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/15 border border-primary/20">
                <Text className="text-foreground font-semibold">{c.initials}</Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-foreground font-semibold">{c.name}</Text>
                <Text className="text-foreground-muted mt-0.5 text-xs">{c.days}</Text>
              </View>
              <View className="items-end">
                <Text className="text-foreground font-semibold">{c.amount}</Text>
              </View>
              <Text className="text-foreground-muted ml-2">›</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating action */}
      <View className="absolute bottom-6 right-5">
        <Pressable className="flex-row items-center justify-center rounded-full bg-primary px-5 py-3 active:opacity-90">
          <Text className="text-background font-semibold">＋ নতুন কাস্টমার/সাপ্লায়ার</Text>
        </Pressable>
      </View>

      

    </SafeAreaView>
  );
}