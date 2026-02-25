import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Pressable
      onPress={handleSignOut}
      disabled={isSigningOut}
      className="items-center rounded-xl border border-rose-400/40 bg-rose-500/10 py-3 active:bg-rose-500/20"
    >
      <Text className="text-sm font-semibold text-rose-300">
        {isSigningOut ? "Signing out..." : "Sign out"}
      </Text>
    </Pressable>
  );
};