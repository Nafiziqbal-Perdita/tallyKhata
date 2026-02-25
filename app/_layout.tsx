import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import { Text, View } from "react-native";
import "../global.css";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-6">
        <Text className="mb-2 text-lg font-semibold text-white">
          Missing Clerk publishable key
        </Text>
        <Text className="text-center text-slate-300">
          Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment and restart Metro with cache
          cleared.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 ">

      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ClerkProvider>
    </SafeAreaView>
  );
}
