import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { Text, View } from "react-native";
import { TABS_ROUTE } from "../constants/routes";

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