import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import { TABS_ROUTE } from "./constants/routes";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <Text className="text-base font-medium text-slate-300">Checking session...</Text>
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href={TABS_ROUTE} />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}