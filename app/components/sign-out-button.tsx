import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <Pressable
      onPress={handleSignOut}
      className="items-center rounded-xl border border-rose-400/40 bg-rose-500/10 py-3 active:bg-rose-500/20"
    >
      <Text className="text-sm font-semibold text-rose-300">Sign out</Text>
    </Pressable>
  );
};