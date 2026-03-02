import { palette } from "@/theme/palette";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Contacts from "expo-contacts";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSupabase from "./hooks/useSupabase";

const normalizeBdPhone = (rawValue: string) => {
  const digits = rawValue.replace(/[^0-9]/g, "");

  if (digits.startsWith("00880") && digits.length >= 15) {
    return `0${digits.slice(5, 15)}`;
  }

  if (digits.startsWith("880") && digits.length >= 13) {
    return `0${digits.slice(3, 13)}`;
  }

  if (digits.startsWith("01") && digits.length >= 11) {
    return digits.slice(0, 11);
  }

  if (digits.startsWith("1") && digits.length === 10) {
    return `0${digits}`;
  }

  return digits;
};

const CustomerSupplierScreen = () => {
  const router = useRouter();

  const generateAvatarSeed = () => Math.random().toString(36).slice(2, 10);

  const [partyType, setPartyType] = useState<"customer" | "supplier">(
    "customer",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [totalPayable, setTotalPayable] = useState("");
  const [totalReceivable, setTotalReceivable] = useState("");
  const [description, setDescription] = useState("");
  const [recordDate, setRecordDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarSeed, setAvatarSeed] = useState<string>(generateAvatarSeed);
  const [isSaving, setIsSaving] = useState(false);

  const fallbackAvatarUri = useMemo(() => {
    return `https://api.dicebear.com/7.x/lorelei/png?seed=${avatarSeed}&backgroundColor=d9d7dc,0984a5,e3954d`;
  }, [avatarSeed]);

  const { createCustomerSupplier } = useSupabase();

  const handlePhoneChange = (value: string) => {
    const normalized = normalizeBdPhone(value);
    setPhone(normalized);
  };

  const handleAmountChange = (
    value: string,
    setter: (nextValue: string) => void,
  ) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    setter(numericValue);
  };

  const handlePickFromPhonebook = async () => {
    const permission = await Contacts.requestPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert(
        "Permission required",
        "ফোনবুক থেকে আনতে contacts permission দিন",
      );
      return;
    }

    const selectedContact = await Contacts.presentContactPickerAsync();

    if (!selectedContact) {
      return;
    }

    if (selectedContact.name) {
      setName(selectedContact.name);
    }

    const firstNumber = selectedContact.phoneNumbers?.[0]?.number ?? "";
    if (firstNumber) {
      const normalized = normalizeBdPhone(firstNumber);
      setPhone(normalized.slice(0, 11));
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "ছবি বাছাই করতে gallery permission দিন",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("bn-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const isSubmitDisabled = useMemo(() => {
    const normalizedPhone = normalizeBdPhone(phone);
    const isValidPhone = /^01\d{9}$/.test(normalizedPhone);

    return name.trim().length === 0 || !isValidPhone || isSaving;
  }, [name, phone, isSaving]);

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    try {
      setIsSaving(true);

      const parsedPayableRaw = totalPayable.trim().length
        ? Number.parseFloat(totalPayable)
        : 0;
      const parsedReceivableRaw = totalReceivable.trim().length
        ? Number.parseFloat(totalReceivable)
        : 0;

      const parsedPayable =
        Number.isFinite(parsedPayableRaw) && parsedPayableRaw >= 0
          ? parsedPayableRaw
          : 0;
      const parsedReceivable =
        Number.isFinite(parsedReceivableRaw) && parsedReceivableRaw >= 0
          ? parsedReceivableRaw
          : 0;

      await createCustomerSupplier({
        partyType,
        name,
        phone: normalizeBdPhone(phone),
        totalPayable: parsedPayable,
        totalReceivable: parsedReceivable,
        description,
        recordDate: toIsoDate(recordDate),
        avatarUrl: avatarUri ?? fallbackAvatarUri,
      });

      Alert.alert("সফল", "তথ্য সফলভাবে সেভ হয়েছে");
      setName("");
      setPhone("");
      setTotalPayable("");
      setTotalReceivable("");
      setDescription("");
      setRecordDate(new Date());
      setAvatarUri(null);
      setPartyType("customer");
      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "তথ্য সেভ করা যায়নি";
      Alert.alert("ত্রুটি", message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="border-b border-border bg-surface px-5 py-4">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 h-10 w-10 items-center justify-center rounded-full active:opacity-85"
          >
            <Ionicons name="arrow-back" size={24} color={palette.foreground} />
          </Pressable>
          <Text className="text-foreground text-xl font-semibold">
            নতুন কাস্টমার/সাপ্লায়ার
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-5 pt-5 pb-8"
        >
          <View className="flex-row items-center">
            <Pressable
              onPress={handlePickImage}
              className="mr-4 h-24 w-24 items-center justify-center rounded-full border border-border bg-surface active:opacity-90"
            >
              {avatarUri || fallbackAvatarUri ? (
                <Image
                  source={{ uri: avatarUri ?? fallbackAvatarUri }}
                  contentFit="cover"
                  style={{ width: 94, height: 94, borderRadius: 999 }}
                />
              ) : (
                <Ionicons name="person" size={52} color={palette.foreground} />
              )}
              <View className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full border border-border bg-background">
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={palette.foreground}
                />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setAvatarUri(null);
                setAvatarSeed(generateAvatarSeed());
              }}
              className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:opacity-90"
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={palette.foreground}
              />
            </Pressable>

            <View className="flex-1 flex-row gap-3">
              <Pressable
                onPress={() => setPartyType("customer")}
                className={
                  "h-16 flex-1 flex-row items-center rounded-2xl border px-4 active:opacity-90 " +
                  (partyType === "customer"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface")
                }
              >
                <View
                  className={
                    "mr-3 h-6 w-6 items-center justify-center rounded-full border " +
                    (partyType === "customer"
                      ? "border-primary"
                      : "border-foreground-muted")
                  }
                >
                  {partyType === "customer" ? (
                    <View className="h-3 w-3 rounded-full bg-primary" />
                  ) : null}
                </View>
                <Text className="text-foreground text-base font-semibold">
                  কাস্টমার
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setPartyType("supplier")}
                className={
                  "h-16 flex-1 flex-row items-center rounded-2xl border px-4 active:opacity-90 " +
                  (partyType === "supplier"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface")
                }
              >
                <View
                  className={
                    "mr-3 h-6 w-6 items-center justify-center rounded-full border " +
                    (partyType === "supplier"
                      ? "border-primary"
                      : "border-foreground-muted")
                  }
                >
                  {partyType === "supplier" ? (
                    <View className="h-3 w-3 rounded-full bg-primary" />
                  ) : null}
                </View>
                <Text className="text-foreground text-base font-semibold">
                  সাপ্লায়ার
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handlePickFromPhonebook}
            className="mt-6 h-12 flex-row items-center justify-center rounded-full border border-border bg-surface active:opacity-90"
          >
            <Ionicons
              name="book-outline"
              size={22}
              color={palette.foreground}
            />
            <Text className="ml-3 text-foreground text-base font-semibold">
              ফোনবুক থেকে যোগ করি
            </Text>
          </Pressable>

          <View className="mt-6 h-16 flex-row items-center rounded-2xl border border-border bg-surface px-4">
            <Ionicons
              name="person-outline"
              size={22}
              color={palette.foreground}
            />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="নাম"
              placeholderTextColor={palette.foreground}
              returnKeyType="next"
              className="ml-3 flex-1 text-base text-foreground"
            />
          </View>

          <View className="mt-4 h-16 flex-row items-center rounded-2xl border border-border bg-surface px-4">
            <Ionicons
              name="call-outline"
              size={22}
              color={palette.foreground}
            />
            <TextInput
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="মোবাইল নম্বর"
              placeholderTextColor={palette.foreground}
              keyboardType="phone-pad"
              returnKeyType="done"
              maxLength={16}
              className="ml-3 flex-1 text-base text-foreground"
            />
          </View>

          <Text className="mt-2 text-right text-xs text-foreground-muted">
            ১১ সংখ্যার মোবাইল নম্বর দিন
          </Text>

          <View className="mt-4 h-16 flex-row items-center rounded-2xl border border-border bg-surface px-4">
            <Ionicons
              name="cash-outline"
              size={22}
              color={palette.foreground}
            />
            <TextInput
              value={totalPayable}
              onChangeText={(value) =>
                handleAmountChange(value, setTotalPayable)
              }
              placeholder="মোট আমাকে দিতে হবে"
              placeholderTextColor={palette.foreground}
              keyboardType="decimal-pad"
              className="ml-3 flex-1 text-base text-foreground"
            />
          </View>

          <View className="mt-4 h-16 flex-row items-center rounded-2xl border border-border bg-surface px-4">
            <Ionicons
              name="wallet-outline"
              size={22}
              color={palette.foreground}
            />
            <TextInput
              value={totalReceivable}
              onChangeText={(value) =>
                handleAmountChange(value, setTotalReceivable)
              }
              placeholder="মোট সে আমাকে দিবে"
              placeholderTextColor={palette.foreground}
              keyboardType="decimal-pad"
              className="ml-3 flex-1 text-base text-foreground"
            />
          </View>

          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="mt-4 h-16 flex-row items-center rounded-2xl border border-border bg-surface px-4 active:opacity-90"
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color={palette.foreground}
            />
            <Text className="ml-3 flex-1 text-base text-foreground">
              {formatDate(recordDate)}
            </Text>
          </Pressable>

          <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
            <View className="flex-row">
              <Ionicons
                name="document-text-outline"
                size={22}
                color={palette.foreground}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="বিবরণ"
                placeholderTextColor={palette.foreground}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="ml-3 min-h-24 flex-1 text-base text-foreground"
              />
            </View>
          </View>
        </ScrollView>

        {showDatePicker ? (
          <DateTimePicker
            value={recordDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);

              if (selectedDate && event.type === "set") {
                setRecordDate(selectedDate);
              }
            }}
          />
        ) : null}

        <View className="px-5 pb-6">
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            className={
              "h-12 items-center justify-center rounded-full " +
              (isSubmitDisabled ? "bg-primary/20" : "bg-primary")
            }
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={palette.background} />
            ) : (
              <Text
                className={
                  "text-base font-semibold " +
                  (isSubmitDisabled
                    ? "text-foreground-subtle"
                    : "text-background")
                }
              >
                নিশ্চিত
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CustomerSupplierScreen;
