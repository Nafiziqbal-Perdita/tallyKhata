import { palette } from "@/theme/palette";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import useCashbook, { CashbookKind } from "./hooks/useCashbook";

const keypadRows = [
  ["AC", "%", "÷", "×"],
  ["7", "8", "9", "-"],
  ["4", "5", "6", "+"],
  ["1", "2", "3", "="],
  ["⌫", "0", ".", "="],
] as const;

const operatorMap: Record<string, string> = {
  "÷": "/",
  "×": "*",
  "+": "+",
  "-": "-",
};

export default function CashbookForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createEntry, loading } = useCashbook();
  const params = useLocalSearchParams<{
    title?: string;
    trend?: "in" | "out";
    currentCash?: string;
  }>();

  const [expression, setExpression] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const transactionTitle =
    typeof params.title === "string" && params.title.trim().length > 0
      ? params.title
      : "ক্যাশ বেচা";

  const transactionTrend = params.trend === "out" ? "out" : "in";

  const currentCash = useMemo(() => {
    const parsed = Number.parseFloat(String(params.currentCash ?? "0"));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.currentCash]);

  const formattedCurrentCash = useMemo(() => {
    return new Intl.NumberFormat("bn-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(currentCash);
  }, [currentCash]);

  const amountText = expression || "0";

  const todayText = useMemo(() => {
    return new Intl.DateTimeFormat("bn-BD", {
      day: "2-digit",
      month: "long",
      year: "2-digit",
    }).format(entryDate);
  }, [entryDate]);

  const isConfirmDisabled = useMemo(() => {
    const value = Number.parseFloat(expression || "0");
    return !Number.isFinite(value) || value <= 0;
  }, [expression]);

  const kindFromTitle = useMemo<Record<string, CashbookKind>>(
    () => ({
      "ক্যাশ বেচা": "cash_sale",
      "ক্যাশ কেনা": "cash_buy",
      খরচ: "expense",
      "মালিক দিল": "owner_gave",
      "মালিক নিল": "owner_took",
    }),
    [],
  );

  const isoEntryDate = useMemo(() => {
    const year = entryDate.getFullYear();
    const month = String(entryDate.getMonth() + 1).padStart(2, "0");
    const day = String(entryDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [entryDate]);

  const evaluateExpression = (value: string) => {
    const normalized = value
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/%/g, "/100")
      .replace(/[^0-9+\-*/.()]/g, "");

    if (!normalized.trim()) {
      return "";
    }

    try {
      const result = Function(`"use strict"; return (${normalized});`)();

      if (typeof result !== "number" || !Number.isFinite(result)) {
        return "";
      }

      return String(Number(result.toFixed(2)));
    } catch {
      return value;
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === "AC") {
      setExpression("");
      return;
    }

    if (key === "⌫") {
      setExpression((previous) => previous.slice(0, -1));
      return;
    }

    if (key === "=") {
      setExpression((previous) => evaluateExpression(previous));
      return;
    }

    if (key === ".") {
      const parts = expression.split(/[+\-×÷]/);
      const lastPart = parts[parts.length - 1] ?? "";

      if (lastPart.includes(".")) {
        return;
      }
    }

    if (operatorMap[key]) {
      setExpression((previous) => {
        if (!previous) {
          return previous;
        }

        const nextValue = previous.replace(/[+\-×÷]$/, "");
        return `${nextValue}${key}`;
      });
      return;
    }

    setExpression((previous) => `${previous}${key}`);
  };

  const handleConfirm = async () => {
    try {
      const rawAmount = Number.parseFloat(
        evaluateExpression(expression || "0"),
      );

      if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
        Alert.alert("ভুল ইনপুট", "সঠিক পরিমাণ দিন");
        return;
      }

      const kind =
        kindFromTitle[transactionTitle] ??
        (transactionTrend === "in" ? "cash_sale" : "cash_buy");

      await createEntry({
        kind,
        direction: transactionTrend,
        title: transactionTitle,
        amount: rawAmount,
        note,
        imageUrl: imageUri,
        entryDate: isoEntryDate,
      });

      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "লেনদেন সেভ করা যায়নি";
      Alert.alert("সেভ ব্যর্থ", message);
    }
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setEntryDate(selectedDate);
  };

  const handlePickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("অনুমতি প্রয়োজন", "ছবি বাছাই করতে গ্যালারি অনুমতি দিন");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setImageUri(result.assets[0].uri ?? null);
    } catch {
      Alert.alert("ব্যর্থ", "ছবি নির্বাচন করা যায়নি");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="border-b border-border bg-surface px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-85"
          >
            <Ionicons name="arrow-back" size={24} color={palette.foreground} />
          </Pressable>

          <View className="flex-1 px-2">
            <Text className="text-lg font-semibold text-foreground">
              {transactionTitle}
            </Text>
            <Text className="text-sm text-foreground-muted">
              বর্তমান ক্যাশ ৳{formattedCurrentCash}
            </Text>
          </View>

          <Pressable className="h-10 flex-row items-center rounded-full border border-border bg-primary-light px-3 active:opacity-90">
            <Ionicons
              name="document-text-outline"
              size={16}
              color={palette.primary}
            />
            <Text className="ml-2 text-sm font-medium text-primary">
              রিপোর্ট
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-2xl border border-border bg-surface px-4 py-4">
          <View className="flex-row items-center">
            <Ionicons
              name="cash-outline"
              size={24}
              color={palette.foregroundMuted}
            />
            <TextInput
              value={amountText}
              editable={false}
              placeholder={transactionTrend === "in" ? "৳ পেলাম" : "৳ দিলাম"}
              placeholderTextColor={palette.foregroundSubtle}
              className="ml-3 flex-1 text-3xl font-semibold text-foreground"
            />
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
          <View className="flex-row items-center">
            <Ionicons
              name="create-outline"
              size={22}
              color={palette.foregroundMuted}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="বিবরণ"
              placeholderTextColor={palette.foregroundSubtle}
              className="ml-3 flex-1 text-base text-foreground"
            />
          </View>
        </View>

        <View className="mt-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="h-12 flex-row items-center rounded-full border border-border bg-surface px-4 active:opacity-90"
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={palette.foregroundMuted}
            />
            <Text className="ml-2 text-sm font-medium text-foreground-muted">
              {todayText}
            </Text>
          </Pressable>

          <Pressable
            onPress={handlePickImage}
            className="h-12 flex-row items-center rounded-full border border-border bg-surface px-4 active:opacity-90"
          >
            <Ionicons
              name="camera-outline"
              size={20}
              color={palette.foregroundMuted}
            />
            <Text className="ml-2 text-sm font-medium text-foreground-muted">
              {imageUri ? "ছবি বদলান" : "ছবি"}
            </Text>
          </Pressable>
        </View>

        {imageUri ? (
          <View className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
            <Image
              source={{ uri: imageUri }}
              contentFit="cover"
              style={{ width: "100%", height: 180 }}
            />
          </View>
        ) : null}
      </ScrollView>

      {showDatePicker ? (
        <DateTimePicker
          value={entryDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      ) : null}

      <View
        className="border-t border-border bg-surface px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        <Pressable
          disabled={isConfirmDisabled || loading}
          onPress={handleConfirm}
          className={
            "mb-3 h-12 items-center justify-center rounded-full " +
            (isConfirmDisabled || loading ? "bg-primary/20" : "bg-primary")
          }
        >
          <Text
            className={
              "text-lg font-semibold " +
              (isConfirmDisabled || loading
                ? "text-foreground-subtle"
                : "text-background")
            }
          >
            {loading ? "সেভ হচ্ছে..." : "নিশ্চিত"}
          </Text>
        </Pressable>

        <View className="overflow-hidden rounded-2xl border border-border">
          {keypadRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} className="flex-row">
              {row.map((keyLabel) => {
                const isOperator = ["+", "-", "×", "÷", "%", "="].includes(
                  keyLabel,
                );

                return (
                  <Pressable
                    key={`${rowIndex}-${keyLabel}`}
                    onPress={() => handleKeyPress(keyLabel)}
                    className={
                      "h-14 flex-1 items-center justify-center border-r border-t border-border active:opacity-80 " +
                      (isOperator ? "bg-primary-light" : "bg-background")
                    }
                  >
                    <Text
                      className={
                        "text-2xl font-medium " +
                        (isOperator ? "text-primary" : "text-foreground")
                      }
                    >
                      {keyLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
