import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { AuthLoadingScreen } from "../_layout";

export default function TabLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <AuthLoadingScreen />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wallet">
        <NativeTabs.Trigger.Icon sf="wallet.bifold.fill" md="wallet" />
        <NativeTabs.Trigger.Label>Wallet</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
