import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { palette } from "@/theme/palette";

import "../../global.css";

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-foreground text-center text-base font-semibold">
          Missing Clerk publishable key
        </Text>
        <Text className="text-foreground-muted mt-2 text-center text-sm">
          Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment.
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="stock" />
          <Stack.Screen name="customer_supplier" />
          <Stack.Screen name="sso-callback" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

export function AuthLoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={palette.primary} />
      <Text className="text-foreground-muted mt-3 text-sm">
        Loading session...
      </Text>
    </View>
  );
}
