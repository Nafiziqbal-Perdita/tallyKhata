import { palette } from "@/theme/palette";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import useSupabase, { type CustomerSupplier } from "../hooks/useSupabase";

type EditableCustomerPayload = {
  partyType: "customer" | "supplier";
  name: string;
  phone: string;
  totalPayable: number;
  totalReceivable: number;
  description: string;
  recordDate: string;
};

type EditCustomerModalProps = {
  visible: boolean;
  customer: CustomerSupplier | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: EditableCustomerPayload) => Promise<void>;
};

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

const formatAmount = (value: number) => {
  return new Intl.NumberFormat("bn-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "NA";
  }

  const first = words[0]?.[0] ?? "";
  const second = words[1]?.[0] ?? words[0]?.[1] ?? "";

  return `${first}${second}`.toUpperCase();
};

const getDaysAgoText = (recordDate: string) => {
  const parsed = new Date(recordDate);

  if (Number.isNaN(parsed.getTime())) {
    return "তারিখ নেই";
  }

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfRecord = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );

  const diff = Math.max(
    0,
    Math.floor(
      (startOfToday.getTime() - startOfRecord.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  return `${diff} দিন`;
};

function EditCustomerModal({
  visible,
  customer,
  saving,
  onClose,
  onSave,
}: EditCustomerModalProps) {
  const [partyType, setPartyType] = useState<"customer" | "supplier">(
    "customer",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [totalPayable, setTotalPayable] = useState("0");
  const [totalReceivable, setTotalReceivable] = useState("0");
  const [description, setDescription] = useState("");
  const [recordDate, setRecordDate] = useState("");

  useEffect(() => {
    if (!customer) {
      return;
    }

    setPartyType(customer.party_type);
    setName(customer.name);
    setPhone(customer.phone);
    setTotalPayable(String(customer.total_payable ?? 0));
    setTotalReceivable(String(customer.total_receivable ?? 0));
    setDescription(customer.description ?? "");
    setRecordDate(
      customer.record_date ?? new Date().toISOString().slice(0, 10),
    );
  }, [customer]);

  const submitDisabled = useMemo(() => {
    const isValidPhone = /^01\d{9}$/.test(normalizeBdPhone(phone));
    const payable = Number.parseFloat(totalPayable || "0");
    const receivable = Number.parseFloat(totalReceivable || "0");
    const hasValidDate = /^\d{4}-\d{2}-\d{2}$/.test(recordDate.trim());

    return (
      !customer ||
      saving ||
      name.trim().length === 0 ||
      !isValidPhone ||
      !Number.isFinite(payable) ||
      payable < 0 ||
      !Number.isFinite(receivable) ||
      receivable < 0 ||
      !hasValidDate
    );
  }, [
    customer,
    name,
    phone,
    recordDate,
    saving,
    totalPayable,
    totalReceivable,
  ]);

  const handleSave = async () => {
    if (submitDisabled) {
      return;
    }

    await onSave({
      partyType,
      name: name.trim(),
      phone: normalizeBdPhone(phone),
      totalPayable: Math.max(0, Number.parseFloat(totalPayable || "0") || 0),
      totalReceivable: Math.max(
        0,
        Number.parseFloat(totalReceivable || "0") || 0,
      ),
      description: description.trim(),
      recordDate: recordDate.trim(),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable className="flex-1 bg-black/18" onPress={onClose} />

        <View className="max-h-[90%] rounded-t-3xl border-t border-border bg-background px-5 pb-8 pt-4">
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-border" />

          <Text className="mb-4 text-center text-base font-semibold text-foreground">
            কাস্টমার/সাপ্লায়ার সম্পাদনা
          </Text>

          <View className="mb-4 flex-row gap-3">
            <Pressable
              onPress={() => setPartyType("customer")}
              className={
                "h-11 flex-1 items-center justify-center rounded-2xl border " +
                (partyType === "customer"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface")
              }
            >
              <Text className="text-foreground font-medium">কাস্টমার</Text>
            </Pressable>
            <Pressable
              onPress={() => setPartyType("supplier")}
              className={
                "h-11 flex-1 items-center justify-center rounded-2xl border " +
                (partyType === "supplier"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface")
              }
            >
              <Text className="text-foreground font-medium">সাপ্লায়ার</Text>
            </Pressable>
          </View>

          <View className="mb-3 h-12 justify-center rounded-2xl border border-border bg-surface px-4">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="নাম"
              placeholderTextColor={palette.foreground}
              className="text-foreground"
            />
          </View>

          <View className="mb-3 h-12 justify-center rounded-2xl border border-border bg-surface px-4">
            <TextInput
              value={phone}
              onChangeText={(value) => setPhone(normalizeBdPhone(value))}
              placeholder="মোবাইল নাম্বার"
              placeholderTextColor={palette.foreground}
              keyboardType="phone-pad"
              className="text-foreground"
            />
          </View>

          <View className="mb-3 flex-row gap-3">
            <View className="flex-1 h-12 flex-row items-center rounded-2xl border border-border bg-surface px-4">
              <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={18}
                  color={palette.primary}
                />
              </View>
              <TextInput
                value={totalReceivable}
                onChangeText={(value) =>
                  setTotalReceivable(value.replace(/[^0-9.]/g, ""))
                }
                placeholder="মোট পাবো"
                placeholderTextColor={palette.foreground}
                keyboardType="numeric"
                className="flex-1 text-foreground"
              />
            </View>
            <View className="flex-1 h-12 flex-row items-center rounded-2xl border border-border bg-surface px-4">
              <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={18}
                  color={palette.primary}
                />
              </View>
              <TextInput
                value={totalPayable}
                onChangeText={(value) =>
                  setTotalPayable(value.replace(/[^0-9.]/g, ""))
                }
                placeholder="মোট দেবো"
                placeholderTextColor={palette.foreground}
                keyboardType="numeric"
                className="flex-1 text-foreground"
              />
            </View>
          </View>

          <View className="mb-3 h-12 justify-center rounded-2xl border border-border bg-surface px-4">
            <TextInput
              value={recordDate}
              onChangeText={setRecordDate}
              placeholder="তারিখ (YYYY-MM-DD)"
              placeholderTextColor={palette.foreground}
              className="text-foreground"
            />
          </View>

          <View className="mb-4 rounded-2xl border border-border bg-surface px-4 py-3">
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="বিবরণ"
              placeholderTextColor={palette.foreground}
              multiline
              className="min-h-[72px] text-foreground"
              textAlignVertical="top"
            />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="h-12 flex-1 items-center justify-center rounded-2xl border border-border bg-surface active:opacity-90"
            >
              <Text className="text-foreground font-semibold">বাতিল</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={submitDisabled}
              className={
                "h-12 flex-1 items-center justify-center rounded-2xl active:opacity-90 " +
                (submitDisabled ? "bg-primary/40" : "bg-primary")
              }
            >
              {saving ? (
                <ActivityIndicator size="small" color={palette.background} />
              ) : (
                <Text className="text-background font-semibold">আপডেট সেভ</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function HomeTab() {
  const { signOut } = useAuth();
  const navigation = useNavigation();

  const { user, isLoaded } = useUser();
  const {
    setBusiness,
    getCustomerSuppliers,
    updateCustomerSupplier,
    deleteCustomerSupplier,
    loading,
  } = useSupabase();
  const [query, setQuery] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(
    null,
  );
  const [customers, setCustomers] = useState<CustomerSupplier[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const loadCustomers = useCallback(async () => {
    try {
      const rows = await getCustomerSuppliers();
      setCustomers(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "লোড করা যায়নি";
      Alert.alert("ত্রুটি", message);
    }
  }, [getCustomerSuppliers]);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      void setBusiness();
      void loadCustomers();
    }
  }, [isLoaded, user, setBusiness, loadCustomers]);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) {
      return null;
    }

    return customers.find((item) => item.id === selectedCustomerId) ?? null;
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      return customers;
    }

    return customers.filter((item) => {
      const searchIndex = [
        item.name,
        item.phone,
        item.party_type,
        item.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchIndex.includes(trimmed);
    });
  }, [customers, query]);

  const totals = useMemo(() => {
    const totalReceivable = customers.reduce(
      (sum, row) => sum + Number(row.total_receivable || 0),
      0,
    );
    const totalPayable = customers.reduce(
      (sum, row) => sum + Number(row.total_payable || 0),
      0,
    );
    const customerCount = customers.filter(
      (row) => row.party_type === "customer",
    ).length;
    const supplierCount = customers.filter(
      (row) => row.party_type === "supplier",
    ).length;

    return { totalReceivable, totalPayable, customerCount, supplierCount };
  }, [customers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadCustomers();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveEdit = async (payload: EditableCustomerPayload) => {
    if (!selectedCustomer) {
      return;
    }

    try {
      setIsEditSaving(true);

      await updateCustomerSupplier({
        id: selectedCustomer.id,
        partyType: payload.partyType,
        name: payload.name,
        phone: payload.phone,
        totalPayable: payload.totalPayable,
        totalReceivable: payload.totalReceivable,
        description: payload.description,
        recordDate: payload.recordDate,
      });

      await loadCustomers();
      setSelectedCustomerId(null);
      Alert.alert("সফল", "তথ্য আপডেট হয়েছে");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "তথ্য আপডেট করা যায়নি";
      Alert.alert("ত্রুটি", message);
    } finally {
      setIsEditSaving(false);
    }
  };

  const performDeleteCustomer = useCallback(
    async (id: string) => {
      if (deletingCustomerId) {
        return;
      }

      try {
        setDeletingCustomerId(id);

        await deleteCustomerSupplier({ id });
        setCustomers((previous) => previous.filter((row) => row.id !== id));

        if (selectedCustomerId === id) {
          setSelectedCustomerId(null);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "তালিকা থেকে মুছা যায়নি";
        Alert.alert("ত্রুটি", message);
      } finally {
        setDeletingCustomerId(null);
      }
    },
    [deleteCustomerSupplier, deletingCustomerId, selectedCustomerId],
  );

  const handleDeleteCustomer = useCallback(
    (id: string) => {
      Alert.alert(
        "ডিলিট নিশ্চিত করুন",
        "এই কাস্টমার/সাপ্লায়ার তালিকা থেকে মুছে ফেলতে চান?",
        [
          {
            text: "বাতিল",
            style: "cancel",
          },
          {
            text: "ডিলিট",
            style: "destructive",
            onPress: () => {
              void performDeleteCustomer(id);
            },
          },
        ],
      );
    },
    [performDeleteCustomer],
  );

  const quickActions = useMemo(
    () => [
      {
        key: "multi-business",
        label: "মাল্টি ব্যবসা",
        icon: "storefront-outline" as const,
      },
      {
        key: "stock",
        label: "স্টক হিসাব",
        icon: "stats-chart-outline" as const,
      },
      {
        key: "notes",
        label: "ব্যবসার নোট",
        icon: "document-text-outline" as const,
      },
      { key: "group", label: "গ্রুপ তাগাদা", icon: "people-outline" as const },
      { key: "qr", label: "QR কোড", icon: "qr-code-outline" as const },
      {
        key: "backup",
        label: "ডাটা ব্যাকআপ",
        icon: "cloud-upload-outline" as const,
      },
      {
        key: "tally-message",
        label: "টালি-মেসেজ",
        icon: "chatbubble-ellipses-outline" as const,
      },
      { key: "cashbox", label: "ক্যাশবাক্স", icon: "cash-outline" as const },
    ],
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        extraData={selectedCustomerId}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between pt-2">
              <Pressable className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary">
                  <Text className="text-background font-bold">T</Text>
                </View>
                <View>
                  <Text className="text-base font-semibold text-foreground">
                    Tally
                  </Text>
                  <Text className="text-xs text-foreground-muted">
                    {user?.fullName ?? user?.firstName ?? "User"}
                  </Text>
                </View>
              </Pressable>

              <View className="flex-row items-center gap-2">
                <Pressable className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface active:opacity-90">
                  <Text className="text-foreground-muted">✉</Text>
                </Pressable>
                <Pressable className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface active:opacity-90">
                  <Text className="text-foreground-muted">?</Text>
                </Pressable>

                <Pressable
                  onPress={handleSignOut}
                  disabled={isSigningOut}
                  className="h-10 flex-row items-center justify-center rounded-xl border border-border bg-surface px-3 active:opacity-90"
                >
                  {isSigningOut ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color={palette.primary} />
                      <Text className="ml-2 text-xs font-semibold text-foreground-muted">
                        Signing out...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons
                        name="log-out-outline"
                        size={18}
                        color={palette.primary}
                      />
                      <Text className="ml-2 text-xs font-semibold text-foreground-muted">
                        Sign out
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            <View className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4">
              <Text className="text-sm font-semibold text-foreground">
                রকেট ও বিকাশ থেকে QR পেমেন্ট হচ্ছে
              </Text>
              <Text className="mt-1 text-xs text-foreground-muted">
                আপনার ব্যবসার জন্য দ্রুত পেমেন্ট সংগ্রহ করুন
              </Text>
            </View>

            <View className="mt-5 flex-row flex-wrap justify-between">
              {quickActions.map((item) => (
                <Pressable
                  key={item.key}
                  className="mb-4 w-[23%] items-center"
                  onPress={() => {
                    if (item.key === "stock") {
                      (navigation as any).navigate("stock");
                      return;
                    }
                  }}
                >
                  <View className="h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={palette.primary}
                    />
                  </View>
                  <Text className="mt-2 text-center text-[11px] text-foreground-muted">
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-1 rounded-2xl border border-border bg-surface px-4 py-4">
              <View className="flex-row">
                <View className="flex-1 items-center">
                  <Text className="text-xl font-bold text-foreground">
                    {formatAmount(totals.totalReceivable)}
                  </Text>
                  <Text className="mt-1 text-xs text-foreground-muted">
                    মোট পাবো
                  </Text>
                </View>
                <View className="w-px bg-border" />
                <View className="flex-1 items-center">
                  <Text className="text-xl font-bold text-foreground">
                    {formatAmount(totals.totalPayable)}
                  </Text>
                  <Text className="mt-1 text-xs text-foreground-muted">
                    মোট দেবো
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-4 flex-row items-center gap-3">
              <View className="flex-1 flex-row items-center rounded-2xl border border-border bg-surface px-4 py-3">
                <Text className="mr-2 text-foreground-muted">🔎</Text>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="খোঁজ"
                  placeholderTextColor={palette.foreground}
                  className="flex-1 text-foreground"
                />
              </View>
              <Pressable
                onPress={() => setQuery("")}
                className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface active:opacity-90"
              >
                <Text className="text-foreground-muted">✕</Text>
              </Pressable>
              <Pressable
                onPress={handleRefresh}
                className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface active:opacity-90"
              >
                <Text className="text-foreground-muted">↻</Text>
              </Pressable>
            </View>

            <View className="mt-5 flex-row items-center justify-between">
              <Text className="text-xs text-foreground-muted">
                কাস্টমার {totals.customerCount} / সাপ্লায়ার{" "}
                {totals.supplierCount}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-foreground-muted">পাবো</Text>
                <Text className="text-xs text-foreground-muted">/</Text>
                <Text className="text-xs text-foreground-muted">দেবো</Text>
              </View>
            </View>

            <View className="mt-3 rounded-2xl border border-border bg-surface" />
          </View>
        }
        renderItem={({ item, index }) => {
          const isLast = index === filteredCustomers.length - 1;

          return (
            <Swipeable
              overshootRight={false}
              renderRightActions={() => (
                <Pressable
                  onPress={() => void handleDeleteCustomer(item.id)}
                  disabled={deletingCustomerId === item.id}
                  className={
                    "ml-2 w-20 items-center justify-center rounded-2xl active:opacity-90 " +
                    (deletingCustomerId === item.id
                      ? "bg-primary/40"
                      : "bg-primary")
                  }
                >
                  {deletingCustomerId === item.id ? (
                    <ActivityIndicator
                      size="small"
                      color={palette.background}
                    />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color={palette.background}
                    />
                  )}
                </Pressable>
              )}
            >
              <Pressable
                onPress={() => setSelectedCustomerId(item.id)}
                className={
                  "flex-row items-center border-l border-r border-border bg-surface px-4 py-4 active:opacity-90 " +
                  (isLast ? "rounded-b-2xl border-b" : "border-b")
                }
              >
                <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/15">
                  {item.avatar_url ? (
                    <Image
                      source={{ uri: item.avatar_url }}
                      contentFit="cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Text className="font-semibold text-foreground">
                      {getInitials(item.name)}
                    </Text>
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-foreground">
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-foreground-muted">
                    {getDaysAgoText(item.record_date)} • {item.phone}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="font-semibold text-foreground">
                    {item.party_type === "customer"
                      ? formatAmount(item.total_receivable)
                      : formatAmount(item.total_payable)}
                  </Text>
                  <Text className="text-xs text-foreground-muted">
                    {item.party_type === "customer" ? "পাবো" : "দেবো"}
                  </Text>
                </View>
                <Text className="ml-2 text-foreground-muted">›</Text>
              </Pressable>
            </Swipeable>
          );
        }}
        ListEmptyComponent={
          <View className="rounded-b-2xl border border-t-0 border-border bg-surface px-4 py-8">
            <Text className="text-center text-sm text-foreground-muted">
              {loading
                ? "তালিকা লোড হচ্ছে..."
                : "কোনো কাস্টমার/সাপ্লায়ার পাওয়া যায়নি"}
            </Text>
          </View>
        }
      />

      {/* Floating action */}
      <View className="absolute bottom-6 right-5">
        <Pressable
          onPress={() => (navigation as any).navigate("customer_supplier")}
          className="flex-row items-center justify-center rounded-full bg-primary px-5 py-3 active:opacity-90"
        >
          <Text className="text-background font-semibold">
            ＋ নতুন কাস্টমার/সাপ্লায়ার
          </Text>
        </Pressable>
      </View>

      <EditCustomerModal
        visible={Boolean(selectedCustomer)}
        customer={selectedCustomer}
        saving={isEditSaving}
        onClose={() => {
          if (!isEditSaving) {
            setSelectedCustomerId(null);
          }
        }}
        onSave={handleSaveEdit}
      />
    </SafeAreaView>
  );
}
