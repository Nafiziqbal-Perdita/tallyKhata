import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

import { AuthLoadingScreen } from "./_layout";

export default function SSOCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <AuthLoadingScreen />;
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}
