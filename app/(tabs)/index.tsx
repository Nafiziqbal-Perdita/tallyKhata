import { useUser } from "@clerk/clerk-expo";
import { Text, View } from "react-native";

import { SignOutButton } from "../components/sign-out-button";

export default function TabsHomePage() {
  const { user } = useUser();

  return (
    <View className="flex-1 bg-slate-950 px-6 py-10">
      <Text className="text-3xl font-extrabold text-white">Dashboard</Text>
      <Text className="mt-2 text-sm text-slate-400">Signed in as {user?.primaryEmailAddress?.emailAddress}</Text>

      <View className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <Text className="text-lg font-semibold text-white">App is ready</Text>
        <Text className="mt-2 text-sm leading-6 text-slate-300">
          Your authentication flow is active. Build your actual features in this tabs area.
        </Text>
      </View>

      <View className="mt-6">
        <SignOutButton />
      </View>
    </View>
  );
}
