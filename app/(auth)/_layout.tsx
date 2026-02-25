import { useAuth } from "@clerk/clerk-expo";
import type { Href } from "expo-router";
import { Redirect, Stack } from "expo-router";
import { Text, View } from "react-native";

const TABS_ROUTE = "/(tabs)" as Href;

export default function AuthRoutesLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <Text className="text-base font-medium text-slate-300">Preparing auth...</Text>
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href={TABS_ROUTE} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}