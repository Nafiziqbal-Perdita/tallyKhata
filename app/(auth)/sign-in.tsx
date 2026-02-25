import { useSignIn, useSSO } from "@clerk/clerk-expo";
import type { EmailCodeFactor, SignInFirstFactor } from "@clerk/types";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { TABS_ROUTE } from "../constants/routes";

WebBrowser.maybeCompleteAuthSession();

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [code, setCode] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const redirectUrl = Linking.createURL("/", {
    scheme: "tallykhataclone",
  });

  const onRequestCodePress = React.useCallback(async () => {
    if (!isLoaded || submitting) return;

    setErrorMessage("");
    setSubmitting(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
      });

      const isEmailCodeFactor = (factor: SignInFirstFactor): factor is EmailCodeFactor =>
        factor.strategy === "email_code";

      const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(isEmailCodeFactor);

      if (emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailCodeFactor.emailAddressId,
        });
        setPendingVerification(true);
      } else {
        setErrorMessage(
          "Email code sign-in is not available. Enable 'Sign-in with email verification code' in Clerk Dashboard.",
        );
      }
    } catch (err) {
      setErrorMessage("Could not send verification code. Please verify your Clerk email settings.");
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setSubmitting(false);
    }
  }, [emailAddress, isLoaded, signIn, submitting]);

  const onVerifyPress = React.useCallback(async () => {
    if (!isLoaded || submitting) return;

    setErrorMessage("");
    setSubmitting(true);
    try {
      const signInAttempt = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
        });
        router.replace(TABS_ROUTE);
      } else {
        setErrorMessage("Verification is not complete yet. Please check the code and try again.");
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      setErrorMessage("Invalid verification code. Please try again.");
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setSubmitting(false);
    }
  }, [code, isLoaded, router, setActive, signIn, submitting]);

  const onSSOPress = React.useCallback(
    async (strategy: "oauth_google" | "oauth_facebook") => {
      if (submitting) return;

      setErrorMessage("");
      setSubmitting(true);
      try {
        const { createdSessionId, setActive: setActiveFromSSO } = await startSSOFlow({
          strategy,
          redirectUrl,
        });

        if (createdSessionId) {
          await setActiveFromSSO?.({ session: createdSessionId });
          router.replace(TABS_ROUTE);
        }
      } catch (err) {
        setErrorMessage("Social sign-in failed. Please try again.");
        console.error(JSON.stringify(err, null, 2));
      } finally {
        setSubmitting(false);
      }
    },
    [redirectUrl, router, startSSOFlow, submitting],
  );

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-100">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 72, paddingBottom: 28 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="items-center">
              <View className="h-16 w-16 rounded-[24px] bg-black" />
              <Text className="mt-6 text-4xl font-extrabold tracking-tight text-black">Verify code</Text>
              <Text className="mt-2 text-center text-base text-zinc-500">
                We sent a one-time code to {emailAddress}.
              </Text>
            </View>

            {!!errorMessage && (
              <View className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <Text className="text-sm text-red-600">{errorMessage}</Text>
              </View>
            )}

            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="numeric"
              placeholder="Verification code"
              placeholderTextColor="#9ca3af"
              className="mt-8 rounded-2xl border border-zinc-300 bg-zinc-200 px-5 py-4 text-xl font-medium text-black"
            />

            <Pressable
              onPress={onVerifyPress}
              disabled={!code || submitting}
              className="mt-5 items-center rounded-2xl bg-black py-4 active:opacity-90 disabled:opacity-50"
            >
              <Text className="text-xl font-bold text-white">
                {submitting ? "Verifying..." : "Verify & continue"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-100">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center">
            <View className="h-16 w-16 rounded-[24px] bg-black" />
            <Text className="mt-6 text-center text-4xl font-extrabold tracking-tight text-black">
              Log in or sign up
            </Text>
          </View>

          {!!errorMessage && (
            <View className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{errorMessage}</Text>
            </View>
          )}

          <TextInput
            value={emailAddress}
            onChangeText={setEmailAddress}
            autoCapitalize="none"
            placeholder="Enter your email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            className="mt-8 rounded-2xl border border-zinc-300 bg-zinc-200 px-5 py-4 text-xl font-medium text-black"
          />

          <Pressable
            onPress={onRequestCodePress}
            disabled={!emailAddress || submitting}
            className="mt-5 items-center rounded-2xl bg-black py-4 active:opacity-90 disabled:opacity-50"
          >
            <Text className="text-xl font-bold text-white">
              {submitting ? "Sending code..." : "Continue"}
            </Text>
          </Pressable>

          <Text className="mt-5 text-center text-3xl text-zinc-500">or</Text>

          <View className="mt-5 gap-3">
            <Pressable
              onPress={() => onSSOPress("oauth_google")}
              disabled={submitting}
              className="flex-row items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 py-4 active:bg-zinc-200 disabled:opacity-50"
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
                <Ionicons name="logo-google" size={20} color="#202124" />
              </View>
              <Text className="ml-3 text-xl font-semibold text-black">Continue with Google</Text>
            </Pressable>

            <Pressable
              onPress={() => onSSOPress("oauth_facebook")}
              disabled={submitting}
              className="flex-row items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 py-4 active:bg-zinc-200 disabled:opacity-50"
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              </View>
              <Text className="ml-3 text-xl font-semibold text-black">Continue with Facebook</Text>
            </Pressable>
          </View>

          <View className="mt-7 flex-row items-center justify-center">
            <Text className="text-base text-zinc-600">Don&apos;t have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text className="text-base font-semibold text-black">Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
