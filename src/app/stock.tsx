import { palette } from "@/theme/palette";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSupabase, { type Stock } from "./hooks/useSupabase";

const StockScreen = () => {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [openingStock, setOpeningStock] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [unitPickerTarget, setUnitPickerTarget] = useState<
    "create" | "edit" | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState<string | null>(null);
  const [editCostPerUnit, setEditCostPerUnit] = useState("");
  const [editOpeningStock, setEditOpeningStock] = useState("");
  const [editTotalCost, setEditTotalCost] = useState("");
  const [editTotalSold, setEditTotalSold] = useState("");

  const { createStock, getStocks, updateStock } = useSupabase();

  const unitOptions = ["পিস", "কেজি", "লিটার", "ডজন", "বক্স", "প্যাকেট"];
  const parsedCostPerUnit = Number.parseFloat(costPerUnit);
  const parsedOpeningStock = openingStock.trim().length
    ? Number.parseFloat(openingStock)
    : 0;
  const hasValidCostPerUnit =
    Number.isFinite(parsedCostPerUnit) && parsedCostPerUnit > 0;
  const hasValidOpeningStock =
    Number.isFinite(parsedOpeningStock) && parsedOpeningStock >= 0;
  const isSubmitDisabled =
    productName.trim().length === 0 ||
    !selectedUnit ||
    !hasValidCostPerUnit ||
    !hasValidOpeningStock ||
    isSaving;

  const parsedEditCostPerUnit = Number.parseFloat(editCostPerUnit);
  const parsedEditOpeningStock = editOpeningStock.trim().length
    ? Number.parseFloat(editOpeningStock)
    : 0;
  const parsedEditTotalCost = editTotalCost.trim().length
    ? Number.parseFloat(editTotalCost)
    : 0;
  const parsedEditTotalSold = editTotalSold.trim().length
    ? Number.parseFloat(editTotalSold)
    : 0;

  const isEditSubmitDisabled =
    !editingStockId ||
    editName.trim().length === 0 ||
    !editUnit ||
    !Number.isFinite(parsedEditCostPerUnit) ||
    parsedEditCostPerUnit <= 0 ||
    !Number.isFinite(parsedEditOpeningStock) ||
    parsedEditOpeningStock < 0 ||
    !Number.isFinite(parsedEditTotalCost) ||
    parsedEditTotalCost < 0 ||
    !Number.isFinite(parsedEditTotalSold) ||
    parsedEditTotalSold < 0 ||
    isUpdating;

  const loadStocks = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await getStocks();
      setStocks(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "স্টক লিস্ট লোড করা যায়নি";
      console.log("Error loading stocks:", error);
      Alert.alert("ত্রুটি", message);
    } finally {
      setIsRefreshing(false);
    }
  }, [getStocks]);

  useEffect(() => {
    void loadStocks();
  }, [loadStocks]);

  const totals = useMemo(() => {
    const totalCost = stocks.reduce(
      (sum, item) => sum + Number(item.total_cost ?? 0),
      0,
    );
    const totalSold = stocks.reduce(
      (sum, item) => sum + Number(item.total_sold ?? 0),
      0,
    );
    const balance = totalCost - totalSold;

    return {
      count: stocks.length,
      totalCost,
      totalSold,
      balance,
    };
  }, [stocks]);

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("bn-BD", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSaveStock = async () => {
    if (isSubmitDisabled || !selectedUnit) {
      return;
    }

    try {
      setIsSaving(true);

      await createStock({
        name: productName,
        unit: selectedUnit,
        costPerUnit: parsedCostPerUnit,
        openingStock: parsedOpeningStock,
      });

      Alert.alert("সফল", "স্টক সফলভাবে যোগ করা হয়েছে");
      setProductName("");
      setCostPerUnit("");
      setOpeningStock("");
      setSelectedUnit(null);
      await loadStocks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "স্টক সেভ করা যায়নি";
      Alert.alert("ত্রুটি", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (stock: Stock) => {
    setEditingStockId(stock.id);
    setEditName(stock.name);
    setEditUnit(stock.unit);
    setEditCostPerUnit(String(stock.cost_per_unit ?? 0));
    setEditOpeningStock(String(stock.opening_stock ?? 0));
    setEditTotalCost(String(stock.total_cost ?? 0));
    setEditTotalSold(String(stock.total_sold ?? 0));
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStockId(null);
  };

  const handleUpdateStock = async () => {
    if (isEditSubmitDisabled || !editingStockId || !editUnit) {
      return;
    }

    try {
      setIsUpdating(true);

      await updateStock({
        id: editingStockId,
        name: editName,
        unit: editUnit,
        costPerUnit: parsedEditCostPerUnit,
        openingStock: parsedEditOpeningStock,
        totalSold: parsedEditTotalSold,
      });

      Alert.alert("সফল", "স্টক আপডেট করা হয়েছে");
      handleCloseEditModal();
      await loadStocks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "স্টক আপডেট করা যায়নি";
      Alert.alert("ত্রুটি", message);
    } finally {
      setIsUpdating(false);
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
            স্টক আইটেম
          </Text>
        </View>
      </View>

      <FlatList
        data={stocks}
        keyExtractor={(item) => item.id}
        refreshing={isRefreshing}
        onRefresh={loadStocks}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={
          <View className="pt-6">
            <View className="gap-5">
              <View className="h-20 flex-row items-center rounded-2xl border border-border bg-surface px-4">
                <Ionicons
                  name="cube-outline"
                  size={24}
                  color={palette.foreground}
                />
                <TextInput
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="প্রোডাক্ট এর নাম"
                  placeholderTextColor={palette.foreground}
                  className="ml-3 flex-1 text-base text-foreground"
                />
              </View>

              <Pressable
                onPress={() => setUnitPickerTarget("create")}
                className="h-20 flex-row items-center rounded-2xl border border-border bg-surface px-4 active:opacity-90"
              >
                <Ionicons
                  name="albums-outline"
                  size={24}
                  color={palette.foreground}
                />
                <Text
                  className={
                    "ml-3 flex-1 text-base " +
                    (selectedUnit ? "text-foreground" : "text-foreground-muted")
                  }
                >
                  {selectedUnit ?? "প্রোডাক্ট এর ইউনিট"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={24}
                  color={palette.foreground}
                />
              </Pressable>

              <View className="h-20 flex-row items-center rounded-2xl border border-border bg-surface px-4">
                <Ionicons
                  name="cash-outline"
                  size={24}
                  color={palette.foreground}
                />
                <TextInput
                  value={costPerUnit}
                  onChangeText={setCostPerUnit}
                  placeholder="প্রতি ইউনিট খরচ"
                  placeholderTextColor={palette.foreground}
                  keyboardType="decimal-pad"
                  className="ml-3 flex-1 text-base text-foreground"
                />
              </View>

              <View className="h-20 flex-row items-center rounded-2xl border border-border bg-surface px-4">
                <Ionicons
                  name="layers-outline"
                  size={24}
                  color={palette.foreground}
                />
                <TextInput
                  value={openingStock}
                  onChangeText={setOpeningStock}
                  placeholder="ওপেনিং স্টক (ঐচ্ছিক)"
                  placeholderTextColor={palette.foreground}
                  keyboardType="decimal-pad"
                  className="ml-3 flex-1 text-base text-foreground"
                />
              </View>

              <Pressable
                disabled={isSubmitDisabled}
                onPress={handleSaveStock}
                className={
                  "h-14 items-center justify-center rounded-full " +
                  (isSubmitDisabled ? "bg-primary/20" : "bg-primary")
                }
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={palette.background} />
                ) : (
                  <Text
                    className={
                      "text-lg font-semibold " +
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

            <View className="mt-6 rounded-2xl border border-border bg-surface p-4">
              <Text className="text-foreground text-base font-semibold">
                স্টক সারাংশ
              </Text>
              <Text className="mt-1 text-foreground-muted text-xs">
                মোট আইটেম: {totals.count}
              </Text>

              <View className="mt-3 flex-row">
                <View className="flex-1 items-center">
                  <Text className="text-foreground text-lg font-semibold">
                    ৳ {formatAmount(totals.totalCost)}
                  </Text>
                  <Text className="text-foreground-muted text-xs">মোট খরচ</Text>
                </View>
                <View className="w-px bg-border" />
                <View className="flex-1 items-center">
                  <Text className="text-foreground text-lg font-semibold">
                    ৳ {formatAmount(totals.totalSold)}
                  </Text>
                  <Text className="text-foreground-muted text-xs">
                    মোট বিক্রি
                  </Text>
                </View>
                <View className="w-px bg-border" />
                <View className="flex-1 items-center">
                  <Text className="text-foreground text-lg font-semibold">
                    ৳ {formatAmount(totals.balance)}
                  </Text>
                  <Text className="text-foreground-muted text-xs">
                    ব্যালেন্স
                  </Text>
                </View>
              </View>
            </View>

            <Text className="mt-6 mb-3 text-foreground text-base font-semibold">
              স্টক লিস্ট
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-2xl border border-border bg-surface p-4">
            <Text className="text-center text-foreground-muted">
              কোনো স্টক পাওয়া যায়নি
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const balance =
            Number(item.total_cost ?? 0) - Number(item.total_sold ?? 0);

          return (
            <Pressable
              onPress={() => handleOpenEditModal(item)}
              className="mb-3 rounded-2xl border border-border bg-surface px-4 py-4 active:opacity-90"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-foreground text-base font-semibold">
                    {item.name}
                  </Text>
                  <Text className="mt-1 text-foreground-muted text-xs">
                    ইউনিট: {item.unit} • ওপেনিং: {item.opening_stock}
                  </Text>
                </View>
                <Text className="text-foreground-muted text-xs">
                  ৳ {formatAmount(item.cost_per_unit)}/ইউনিট
                </Text>
              </View>

              <View className="mt-3 flex-row">
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">
                    ৳ {formatAmount(item.total_cost)}
                  </Text>
                  <Text className="text-foreground-muted text-[11px]">
                    মোট খরচ
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">
                    ৳ {formatAmount(item.total_sold)}
                  </Text>
                  <Text className="text-foreground-muted text-[11px]">
                    মোট বিক্রি
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">
                    ৳ {formatAmount(balance)}
                  </Text>
                  <Text className="text-foreground-muted text-[11px]">
                    ব্যালেন্স
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={unitPickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setUnitPickerTarget(null)}
      >
        <View className="flex-1 justify-end bg-black/45">
          <Pressable
            className="flex-1"
            onPress={() => setUnitPickerTarget(null)}
          />

          <View className="rounded-t-3xl border-t border-border bg-surface px-5 pb-6 pt-4">
            <View className="mb-4 self-center h-1.5 w-12 rounded-full bg-foreground-subtle" />
            <Text className="mb-4 text-foreground text-base font-semibold">
              ইউনিট নির্বাচন করুন
            </Text>

            <View className="gap-2">
              {unitOptions.map((unit) => {
                const currentUnit =
                  unitPickerTarget === "edit" ? editUnit : selectedUnit;
                const isActive = unit === currentUnit;

                return (
                  <Pressable
                    key={unit}
                    onPress={() => {
                      if (unitPickerTarget === "edit") {
                        setEditUnit(unit);
                      } else {
                        setSelectedUnit(unit);
                      }
                      setUnitPickerTarget(null);
                    }}
                    className={
                      "h-12 flex-row items-center rounded-xl border px-4 " +
                      (isActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background")
                    }
                  >
                    <Text
                      className={
                        "flex-1 text-base " +
                        (isActive ? "text-foreground" : "text-foreground-muted")
                      }
                    >
                      {unit}
                    </Text>
                    {isActive ? (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={palette.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCloseEditModal}
      >
        <View className="flex-1 justify-end bg-black/45">
          <Pressable className="flex-1" onPress={handleCloseEditModal} />

          <View className="rounded-t-3xl border-t border-border bg-surface px-5 pb-6 pt-4">
            <View className="mb-4 self-center h-1.5 w-12 rounded-full bg-foreground-subtle" />
            <Text className="mb-4 text-foreground text-base font-semibold">
              স্টক এডিট করুন
            </Text>

            <View className="gap-3">
              <View className="h-14 flex-row items-center rounded-xl border border-border bg-background px-4">
                <Ionicons
                  name="cube-outline"
                  size={20}
                  color={palette.foreground}
                />
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="প্রোডাক্ট এর নাম"
                  placeholderTextColor={palette.foreground}
                  className="ml-3 flex-1 text-foreground"
                />
              </View>

              <Pressable
                onPress={() => setUnitPickerTarget("edit")}
                className="h-14 flex-row items-center rounded-xl border border-border bg-background px-4 active:opacity-90"
              >
                <Ionicons
                  name="albums-outline"
                  size={20}
                  color={palette.foreground}
                />
                <Text
                  className={
                    "ml-3 flex-1 " +
                    (editUnit ? "text-foreground" : "text-foreground-muted")
                  }
                >
                  {editUnit ?? "প্রোডাক্ট এর ইউনিট"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={palette.foreground}
                />
              </Pressable>

              <View className="h-14 flex-row items-center rounded-xl border border-border bg-background px-4">
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={palette.foreground}
                />
                <TextInput
                  value={editCostPerUnit}
                  onChangeText={setEditCostPerUnit}
                  placeholder="প্রতি ইউনিট খরচ"
                  placeholderTextColor={palette.foreground}
                  keyboardType="decimal-pad"
                  className="ml-3 flex-1 text-foreground"
                />
              </View>

              <View className="h-14 flex-row items-center rounded-xl border border-border bg-background px-4">
                <Ionicons
                  name="layers-outline"
                  size={20}
                  color={palette.foreground}
                />
                <TextInput
                  value={editOpeningStock}
                  onChangeText={setEditOpeningStock}
                  placeholder="ওপেনিং স্টক"
                  placeholderTextColor={palette.foreground}
                  keyboardType="decimal-pad"
                  className="ml-3 flex-1 text-foreground"
                />
              </View>

              <View className="h-14 flex-row items-center rounded-xl border border-border bg-background px-4">
                <Ionicons
                  name="wallet-outline"
                  size={20}
                  color={palette.foreground}
                />
                <TextInput
                  value={editTotalCost}
                  onChangeText={setEditTotalCost}
                  placeholder="মোট খরচ"
                  placeholderTextColor={palette.foreground}
                  keyboardType="decimal-pad"
                  className="ml-3 flex-1 text-foreground"
                />
              </View>

              <View className="h-14 flex-row items-center rounded-xl border border-border bg-background px-4">
                <Ionicons
                  name="trending-up-outline"
                  size={20}
                  color={palette.foreground}
                />
                <TextInput
                  value={editTotalSold}
                  onChangeText={setEditTotalSold}
                  placeholder="মোট বিক্রি"
                  placeholderTextColor={palette.foreground}
                  keyboardType="decimal-pad"
                  className="ml-3 flex-1 text-foreground"
                />
              </View>

              <Pressable
                onPress={handleUpdateStock}
                disabled={isEditSubmitDisabled}
                className={
                  "mt-1 h-12 items-center justify-center rounded-full " +
                  (isEditSubmitDisabled ? "bg-primary/20" : "bg-primary")
                }
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={palette.background} />
                ) : (
                  <Text
                    className={
                      "font-semibold " +
                      (isEditSubmitDisabled
                        ? "text-foreground-subtle"
                        : "text-background")
                    }
                  >
                    পরিবর্তন সেভ করুন
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default StockScreen;
