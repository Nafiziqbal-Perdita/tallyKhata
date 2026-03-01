import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

import { AuthLoadingScreen } from "../_layout";

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <AuthLoadingScreen />;
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}