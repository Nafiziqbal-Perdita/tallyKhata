
import { palette } from "@/theme/palette";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useAuthentication from "../hooks/useAuthentication";

const TERMS_URL = "https://clerk.com/legal/terms";
const PRIVACY_URL = "https://clerk.com/legal/privacy";

const AuthScreen = () => {
    const { handleSocialAuth, loadingStrategy } = useAuthentication();
    const isLoading = loadingStrategy !== null;

    const handleOpenPolicyUrl = async (url: string, label: string) => {
        try {
            const canOpen = await Linking.canOpenURL(url);

            if (!canOpen) {
                Alert.alert("Unable to open link", `Could not open ${label}. Please try again later.`);
                return;
            }

            await Linking.openURL(url);
        } catch (error) {
            console.error(`Failed to open ${label} URL:`, error);
            Alert.alert("Unable to open link", `Could not open ${label}. Please try again later.`);
        }
    };

    return (
        <View className="flex-1 bg-background">
            {/* gradient background */}
            <View className="absolute inset-0">
                <LinearGradient
                    colors={[palette.background, palette.surface, palette.background]}
                    locations={[0, 0.5, 1]}
                    style={{ width: "100%", height: "100%" }}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </View>

            <SafeAreaView className="flex-1 justify-between">
                {/* TOP SECTION: logo + hero */}
                <View>
                    <View className="items-center pt-10 pb-2">
                        <View className="w-16 h-16 rounded-[20px] bg-primary/15 items-center justify-center border border-primary/20">
                            <Ionicons name="school" size={30} color={palette.primary} />
                        </View>

                        <Text className="text-3xl font-extrabold text-foreground tracking-tight mt-4 font-mono">
                            Tally-Khata
                        </Text>

                        <Text className="text-foreground-muted text-[15px] mt-1.5 tracking-wide">
                        Use together, grow together
                        </Text>
                    </View>

                    <View className="items-center px-6 mt-4">
                        <Ionicons name="book" size={100} color={palette.primaryLight} />
                    </View>

                    {/* feature chips (Tally-Khata) */}
                    <View className="flex-row flex-wrap justify-center gap-3 px-6 mt-5">
                        {[
                            {
                                icon: "document-text" as const,
                                label: "Ledger",
                                color: "#A29BFE",
                                bg: "bg-cyan-100/12 border-cyan-100/20",
                            },
                            {
                                icon: "receipt" as const,
                                label: "Expenses",
                                color: "#FF6B6B",
                                bg: "bg-cyan-100/12 border-cyan-100/20",
                            },
                            {
                                icon: "people" as const,
                                label: "Partners",
                                color: "#00B894",
                                bg: "bg-cyan-100/12 border-cyan-100/20",
                            },
                            {
                                icon: "stats-chart" as const,
                                label: "Reports",
                                color: "#FFD166",
                                bg: "bg-yellow-100/12 border-yellow-100/20",
                            },
                            {
                                icon: "card" as const,
                                label: "Invoices",
                                color: "#4BC0C8",
                                bg: "bg-cyan-100/12 border-cyan-100/20",
                            },
                        ].map((chip) => (
                            <Pressable
                                key={chip.label}
                                accessibilityRole="button"
                                accessibilityLabel={chip.label}
                                onPress={() => {}}
                                className="flex-row items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-surface/70"
                            >
                                <Ionicons name={chip.icon} size={16} color={palette.primary} />
                                <Text className="text-foreground-muted text-xs font-semibold tracking-wide">
                                    {chip.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View className="px-8 pb-4">
                    <View className="flex-row items-center gap-3 mb-6">
                        <View className="flex-1 h-px bg-border" />
                        <Text className="text-foreground-subtle text-xs font-medium tracking-widest uppercase">
                            Continue with
                        </Text>
                        <View className="flex-1 h-px bg-border" />
                    </View>

                    <View className="flex-row justify-center items-center gap-4 mb-5">
                        {/* GOOGLE btn */}
                        <Pressable
                            className="size-20 rounded-2xl bg-surface/60 items-center justify-center active:scale-95 shadow-lg border border-border"
                            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                            disabled={isLoading}
                            accessibilityRole="button"
                            accessibilityLabel="Continue with Google"
                            onPress={() => !isLoading && handleSocialAuth("oauth_google")}
                        >
                            {loadingStrategy === "oauth_google" ? (
                                <ActivityIndicator size={"small"} color={palette.primary} />
                            ) : (
                                <AntDesign name="google" size={28} color={palette.primary} />
                            )}
                        </Pressable>

                        {/* APPLE btn */}
                        <Pressable
                            className="size-20 rounded-2xl items-center justify-center active:scale-95 bg-surface/60 border border-border"
                            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                            disabled={isLoading}
                            accessibilityRole="button"
                            accessibilityLabel="Continue with Apple"
                            onPress={() => !isLoading && handleSocialAuth("oauth_apple")}
                        >
                            {loadingStrategy === "oauth_apple" ? (
                                <ActivityIndicator size="small" color={palette.primary} />
                            ) : (
                                <Ionicons name="logo-apple" size={30} color={palette.foreground} />
                            )}
                        </Pressable>

                        {/* FACEBOOK btn */}
                        <Pressable
                            className="size-20 rounded-2xl bg-surface/60 items-center justify-center active:scale-95 border border-border"
                            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                            disabled={isLoading}
                            accessibilityRole="button"
                            accessibilityLabel="Continue with Facebook"
                            onPress={() => !isLoading && handleSocialAuth("oauth_facebook")}
                        >
                            {loadingStrategy === "oauth_facebook" ? (
                                <ActivityIndicator size="small" color={palette.primary} />
                            ) : (
                                <Ionicons name="logo-facebook" size={28} color={palette.foreground} />
                            )}
                        </Pressable>
                    </View>

                    <Text className="text-foreground-subtle text-[11px] text-center leading-4">
                        By continuing, you agree to our
                    </Text>
                    <View className="mt-0.5 flex-row items-center justify-center gap-1">
                        <Pressable
                            accessibilityRole="link"
                            accessibilityLabel="Open Terms of Service"
                            onPress={() => {
                                void handleOpenPolicyUrl(TERMS_URL, "Terms of Service");
                            }}
                        >
                            <Text className="text-primary-light text-[11px] leading-4">Terms of Service</Text>
                        </Pressable>
                        <Text className="text-foreground-subtle text-[11px] leading-4">and</Text>
                        <Pressable
                            accessibilityRole="link"
                            accessibilityLabel="Open Privacy Policy"
                            onPress={() => {
                                void handleOpenPolicyUrl(PRIVACY_URL, "Privacy Policy");
                            }}
                        >
                            <Text className="text-primary-light text-[11px] leading-4">Privacy Policy</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AuthScreen;