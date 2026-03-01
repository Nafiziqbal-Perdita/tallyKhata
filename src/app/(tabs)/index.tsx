import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeTab() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)");
    } catch (error) {
      console.log("Error during sign out:", error);
      Alert.alert("Sign out failed", "Please try again.");
    } finally {
      if (isMountedRef.current) {
        setIsSigningOut(false);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-5 py-6">
      <View className="rounded-2xl border border-border bg-surface px-4 py-5">
        <Text className="text-foreground text-xl font-bold">Welcome back</Text>
        <Text className="text-foreground-muted mt-1 text-sm">
          {user?.primaryEmailAddress?.emailAddress ?? "Signed in user"}
        </Text>
      </View>

      <View className="mt-5">
        <Pressable
          onPress={handleSignOut}
          disabled={isSigningOut}
          className="h-12 flex-row items-center justify-center rounded-xl bg-primary active:opacity-90"
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-black font-semibold">Sign Out</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}