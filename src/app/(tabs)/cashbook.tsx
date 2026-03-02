import { palette } from "@/theme/palette";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Cashbook = () => {
  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-5">
      <View className="rounded-2xl border border-border bg-surface px-5 py-5">
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Ionicons name="book-outline" size={22} color={palette.primary} />
          </View>
          <View className="ml-3">
            <Text className="text-foreground text-lg font-semibold">
              Cashbook
            </Text>
            <Text className="text-foreground-muted text-xs">
              Daily in/out summary
            </Text>
          </View>
        </View>

        <View className="mt-5 rounded-xl border border-border bg-background px-4 py-4">
          <Text className="text-foreground text-base font-semibold">
            No transactions yet
          </Text>
          <Text className="mt-1 text-xs text-foreground-muted">
            Start adding income and expense records from your business flow.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Cashbook;
