import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { palette } from "@/theme/palette";
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
    <NativeTabs
      backgroundColor={palette.surface}
      labelVisibilityMode="auto"
      iconColor={palette.foreground}
      indicatorColor={palette.primary}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wallet">
        <NativeTabs.Trigger.Icon sf="wallet.bifold.fill" md="wallet" />
        <NativeTabs.Trigger.Label>Wallet</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cashbook">
        <NativeTabs.Trigger.Icon sf="circle.dashed" md="money_bag" />
        <NativeTabs.Trigger.Label>Cash</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="menu">
        <NativeTabs.Trigger.Icon sf="circle.dashed" md="menu" />
        <NativeTabs.Trigger.Label>Menu</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
