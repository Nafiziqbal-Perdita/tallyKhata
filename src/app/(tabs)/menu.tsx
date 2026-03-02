import { palette } from "@/theme/palette";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Menu = () => {
  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-5">
      <View className="rounded-2xl border border-border bg-surface px-5 py-5">
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Ionicons name="menu-outline" size={22} color={palette.primary} />
          </View>
          <View className="ml-3">
            <Text className="text-foreground text-lg font-semibold">Menu</Text>
            <Text className="text-foreground-muted text-xs">
              Preferences & utility shortcuts
            </Text>
          </View>
        </View>

        <View className="mt-5 gap-3">
          <View className="rounded-xl border border-border bg-background px-4 py-3">
            <Text className="text-foreground font-medium">
              Business profile
            </Text>
          </View>
          <View className="rounded-xl border border-border bg-background px-4 py-3">
            <Text className="text-foreground font-medium">App preferences</Text>
          </View>
          <View className="rounded-xl border border-border bg-background px-4 py-3">
            <Text className="text-foreground font-medium">Help & support</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Menu;
