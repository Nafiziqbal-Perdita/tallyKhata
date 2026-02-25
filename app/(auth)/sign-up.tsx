import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { TABS_ROUTE } from "../constants/routes";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const onSignUpPress = React.useCallback(async () => {
    if (!isLoaded || submitting) return;

    setErrorMessage("");
    setSubmitting(true);
    try {
      await signUp.create({ emailAddress });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      setErrorMessage("Could not start sign up. Please verify Clerk email sign-up settings.");
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setSubmitting(false);
    }
  }, [emailAddress, isLoaded, signUp, submitting]);

  const onVerifyPress = React.useCallback(async () => {
    if (!isLoaded || submitting) return;

    setErrorMessage("");
    setSubmitting(true);
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace(TABS_ROUTE);
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
        setErrorMessage("Verification is not complete yet. Please check the code and try again.");
      }
    } catch (err) {
      setErrorMessage("Verification failed. Please check the code and try again.");
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setSubmitting(false);
    }
  }, [code, isLoaded, router, setActive, signUp, submitting]);

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
                Enter the verification code sent to your inbox.
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
                {submitting ? "Checking..." : "Verify & continue"}
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
              Create an account
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
            keyboardType="email-address"
            placeholder="Enter your email"
            placeholderTextColor="#9ca3af"
            className="mt-8 rounded-2xl border border-zinc-300 bg-zinc-200 px-5 py-4 text-xl font-medium text-black"
          />

          <Pressable
            onPress={onSignUpPress}
            disabled={!emailAddress || submitting}
            className="mt-5 items-center rounded-2xl bg-black py-4 active:opacity-90 disabled:opacity-50"
          >
            <Text className="text-xl font-bold text-white">
              {submitting ? "Please wait..." : "Continue"}
            </Text>
          </Pressable>

          <View className="mt-7 flex-row items-center justify-center">
            <Text className="text-base text-zinc-600">Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <Text className="text-base font-semibold text-black">Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
