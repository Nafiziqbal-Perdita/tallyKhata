import { palette } from "@/theme/palette";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Wallet = () => {
  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-5">
      <View className="rounded-2xl border border-border bg-surface px-5 py-5">
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Ionicons name="wallet-outline" size={22} color={palette.primary} />
          </View>
          <View className="ml-3">
            <Text className="text-foreground text-lg font-semibold">
              Wallet
            </Text>
            <Text className="text-foreground-muted text-xs">
              Simple balance overview
            </Text>
          </View>
        </View>

        <View className="mt-5 flex-row">
          <View className="flex-1 items-center">
            <Text className="text-foreground text-xl font-bold">৳ 0.00</Text>
            <Text className="mt-1 text-xs text-foreground-muted">
              Current balance
            </Text>
          </View>
          <View className="w-px bg-border" />
          <View className="flex-1 items-center">
            <Text className="text-foreground text-xl font-bold">0</Text>
            <Text className="mt-1 text-xs text-foreground-muted">Entries</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Wallet;
