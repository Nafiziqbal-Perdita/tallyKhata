import { useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const useAuthentication = () => {
  const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
  const router = useRouter();
  const { startSSOFlow } = useSSO();

  const handleSocialAuth = async (strategy: "oauth_google" | "oauth_apple" | "oauth_facebook") => {
    if (loadingStrategy) return; // guard against concurrent flows

    setLoadingStrategy(strategy);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: Linking.createURL("/sso-callback"),
      });

      if (!createdSessionId || !setActive) {
        const provider =
          strategy === "oauth_google" ? "Google" : strategy === "oauth_apple" ? "Apple" : "Facebook";

        Alert.alert(
          "Sign-in incomplete",
          `${provider} sign-in did not complete. Please try again.`,
        );

        return;
      }

      await setActive({ session: createdSessionId });
      router.replace("/(tabs)");
    } catch (error) {
      console.log("💥 Error in social auth:", error);
      const provider =
        strategy === "oauth_google" ? "Google" : strategy === "oauth_apple" ? "Apple" : "Facebook";
      Alert.alert("Error", `Failed to sign in with ${provider}. Please try again.`);
    } finally {
      setLoadingStrategy(null);
    }
  };

  return { handleSocialAuth, loadingStrategy };
};

export default useAuthentication;