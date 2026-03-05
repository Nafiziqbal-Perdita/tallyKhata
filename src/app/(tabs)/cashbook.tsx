import { palette } from "@/theme/palette";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Cashbook = () => {
  const { user } = useUser();
  const router = useRouter();
  const navigation = useNavigation();
  const currentCash = 6000;

  const formatBnAmount = (value: number) => {
    return new Intl.NumberFormat("bn-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleOpenCashbookForm = (title: string, trend: "in" | "out") => {
    const params = {
      title,
      trend,
      currentCash: String(currentCash),
    };

    try {
      (navigation as any).navigate("cashbook-form", params);
    } catch {
      router.push({
        pathname: "/cashbook-form",
        params,
      });
    }
  };

  const quickActions = [
    { key: "report", icon: "document-text-outline", label: "রিপোর্ট" },
    {
      key: "transfer",
      icon: "swap-horizontal-outline",
      label: "ক্যাশবইর মিলাও",
    },
    { key: "view", icon: "eye-outline", label: "দেখুন" },
  ] as const;

  const flowItems = [
    {
      key: "cash-sale",
      icon: "trending-down-outline",
      label: "ক্যাশ বেচা",
      amount: "0.00",
      trend: "in",
    },
    {
      key: "cash-buy",
      icon: "trending-up-outline",
      label: "ক্যাশ কেনা",
      amount: "0.00",
      trend: "out",
    },
    {
      key: "expense",
      icon: "receipt-outline",
      label: "খরচ",
      amount: "0.00",
      trend: "out",
    },
    {
      key: "owner-gave",
      icon: "wallet-outline",
      label: "মালিক দিল",
      amount: "0.00",
      trend: "in",
    },
    {
      key: "owner-took",
      icon: "cash-outline",
      label: "মালিক নিল",
      amount: "0.00",
      trend: "out",
    },
  ] as const;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={flowItems}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pb-8"
        ListHeaderComponent={
          <View className="pt-3">
            <View className="flex-row items-center justify-between">
              <Pressable className="flex-row items-center gap-2">
                {user?.imageUrl ? (
                  <Image
                    source={{ uri: user?.imageUrl! }}
                    contentFit="cover"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: palette.primary + "33",
                    }}
                  />
                ) : (
                  <View className="h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary">
                    <Text className="text-background font-bold">
                      {user?.firstName?.[0]?.toUpperCase() ?? "U"}
                    </Text>
                  </View>
                )}
                <View>
                  <Text className="text-base font-semibold text-foreground">
                    Tally
                  </Text>
                  <Text className="text-xs text-foreground-muted">
                    {user?.fullName ?? user?.firstName ?? "User"}
                  </Text>
                </View>
              </Pressable>

              <View className="flex-row items-center gap-2">
                <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:opacity-90">
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={palette.foreground}
                  />
                </Pressable>
                <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:opacity-90">
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={palette.foreground}
                  />
                </Pressable>
              </View>
            </View>

            <View className="mt-4 rounded-3xl border border-border bg-surface px-4 py-4">
              <View className="flex-row">
                <View className="flex-1 items-center">
                  <Text className="text-foreground text-2xl font-bold">০</Text>
                  <Text className="mt-1 text-xs text-foreground-muted">
                    আজকের বেচা
                  </Text>
                </View>
                <View className="w-px bg-border" />
                <View className="flex-1 items-center">
                  <Text className="text-foreground text-2xl font-bold">
                    {new Intl.NumberFormat("bn-BD", {
                      maximumFractionDigits: 0,
                    }).format(currentCash)}
                  </Text>
                  <Text className="mt-1 text-xs text-foreground-muted">
                    বর্তমান ক্যাশ
                  </Text>
                </View>
              </View>

              <View className="mt-4 rounded-2xl border border-border bg-background px-4 py-3">
                <View className="flex-row items-center">
                  <View className="flex-1 items-center">
                    <Text className="text-sm text-foreground">
                      আজ পেলাম{" "}
                      <Text className="text-secondary font-semibold">০</Text>
                    </Text>
                  </View>
                  <View className="w-px bg-border" />
                  <View className="flex-1 items-center">
                    <Text className="text-sm text-foreground">
                      আজ দিলাম{" "}
                      <Text className="text-primary font-semibold">০</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-4 rounded-3xl border border-border bg-surface px-3 py-3">
             

              <View className="mt-4 flex-row">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    বাকি আদায়
                  </Text>
                  <Text className="mt-1 text-secondary font-semibold">
                    ৳ {formatBnAmount(0)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-base font-semibold text-foreground">
                    পেমেন্ট দেয়া
                  </Text>
                  <Text className="mt-1 text-primary font-semibold">
                    ৳ {formatBnAmount(0)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-4 rounded-3xl border border-border bg-surface px-4 py-1">
              <Text className="py-3 text-base font-semibold text-foreground">
                লেনদেনের ধরন
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View className="rounded-3xl border border-border bg-surface px-4">
            <Pressable
              onPress={() => handleOpenCashbookForm(item.label, item.trend)}
              className={
                "flex-row items-center py-4 active:opacity-90 " +
                (index !== flowItems.length - 1 ? "border-b border-border" : "")
              }
            >
              <View
                className={
                  "h-12 w-12 items-center justify-center rounded-full " +
                  (item.trend === "in"
                    ? "bg-secondary-light"
                    : "bg-primary-light")
                }
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={
                    item.trend === "in" ? palette.secondary : palette.primary
                  }
                />
              </View>

              <Text className="ml-4 flex-1 text-lg font-medium text-foreground">
                {item.label}
              </Text>

              <Text
                className={
                  "mr-3 text-xl font-semibold " +
                  (item.trend === "in" ? "text-secondary" : "text-primary")
                }
              >
                {item.amount}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={palette.foregroundMuted}
              />
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />
    </SafeAreaView>
  );
};

export default Cashbook;
