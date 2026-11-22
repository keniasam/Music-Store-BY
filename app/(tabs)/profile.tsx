import { ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatNumber, APP_CONFIG, CONTACT_INFO, PAYMENT_METHODS } from "@/shared/config";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [showSubscription, setShowSubscription] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Queries
  const { data: statsData, refetch: refetchStats } = trpc.user.getStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: activeSub, refetch: refetchSub } = trpc.subscriptions.getActive.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutations
  const createSubMutation = trpc.subscriptions.create.useMutation();
  const createWithdrawalMutation = trpc.withdrawals.create.useMutation();

  const isPremium = user?.subscriptionTier === "premium" || !!activeSub;

  const stats = {
    totalPlays: statsData?.totalPlays ?? 15420,
    totalLikes: statsData?.totalLikes ?? 892,
    totalSales: statsData?.totalSales ?? 47,
    totalEarnings: statsData?.totalEarnings ?? "245.50",
    availableBalance: user?.availableBalance ?? "198.00",
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out of Music Store Bilong Yumi?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            await logout();
            router.replace("/(tabs)");
          } 
        },
      ]
    );
  };

  const handleSubscribe = async (billingCycle: "monthly" | "yearly") => {
    setIsSubscribing(true);
    try {
      await createSubMutation.mutateAsync({
        billingCycle,
        paymentMethod: "phone_banking",
      });
      refetchSub();
      setShowSubscription(false);
      Alert.alert(
        "Welcome to Premium! 👑",
        "Your account is now upgraded to Premium. Enjoy unlimited uploads and all mastering presets!"
      );
    } catch (err: any) {
      Alert.alert("Subscription Error", err.message || "Failed to subscribe");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleWithdrawal = async () => {
    const balanceNum = parseFloat(stats.availableBalance);
    if (balanceNum < 50) {
      Alert.alert(
        "Minimum Withdrawal",
        `Your current available balance is ${formatCurrency(stats.availableBalance)}. Minimum withdrawal is K 50.00.`
      );
      return;
    }

    Alert.alert(
      "Withdraw Funds",
      `Withdraw ${formatCurrency(stats.availableBalance)} to your BSP bank account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Withdrawal",
          onPress: async () => {
            setIsWithdrawing(true);
            try {
              await createWithdrawalMutation.mutateAsync({
                amount: stats.availableBalance,
                paymentMethod: "bsp",
                paymentDetails: JSON.stringify({ account: user?.bspAccountNumber || "1002938472" }),
              });
              refetchStats();
              Alert.alert(
                "Withdrawal Requested",
                "Your withdrawal request has been submitted and is processing via BSP Mobile Banking."
              );
            } catch (err: any) {
              Alert.alert("Withdrawal Failed", err.message || "Could not process withdrawal");
            } finally {
              setIsWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <View 
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: colors.primary + '20' }}
        >
          <IconSymbol name="person.fill" size={48} color={colors.primary} />
        </View>
        <Text className="text-2xl font-bold text-foreground text-center mb-2">
          Join Music Store Bilong Yumi
        </Text>
        <Text className="text-muted text-center mb-6">
          Create an account to upload music, earn money, and connect with PNG artists
        </Text>
        <TouchableOpacity 
          className="px-8 py-3.5 rounded-full mb-3 w-full max-w-xs"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/login")}
        >
          <Text className="text-white font-semibold text-base text-center">Login</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="px-8 py-3.5 rounded-full w-full max-w-xs border-2"
          style={{ borderColor: colors.primary }}
          onPress={() => router.push("/login")}
        >
          <Text className="font-semibold text-base text-center" style={{ color: colors.primary }}>
            Create Account
          </Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // Subscription Modal View
  if (showSubscription) {
    return (
      <ScreenContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          <View className="px-4 pt-4 pb-2 flex-row items-center">
            <TouchableOpacity onPress={() => setShowSubscription(false)} className="mr-3 p-1">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">Go Premium</Text>
          </View>

          <View className="px-4 mt-4">
            <View 
              className="p-6 rounded-3xl items-center border"
              style={{ backgroundColor: colors.gold + '20', borderColor: colors.gold + '40' }}
            >
              <IconSymbol name="crown.fill" size={48} color={colors.gold} />
              <Text className="text-2xl font-bold text-foreground mt-3">Bilong Yumi PRO</Text>
              <Text className="text-muted text-center text-xs mt-1">
                Unlock unlimited uploads, downloads, and 20+ mastering presets
              </Text>
            </View>

            {/* Plans */}
            <View className="mt-6">
              <TouchableOpacity 
                className="p-4 rounded-2xl mb-3 border-2"
                style={{ borderColor: colors.primary, backgroundColor: colors.primary + '10' }}
                onPress={() => handleSubscribe("monthly")}
                disabled={isSubscribing}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-foreground font-bold text-base">Monthly Pass</Text>
                    <Text className="text-muted text-xs">Cancel anytime</Text>
                  </View>
                  <Text className="text-primary font-bold text-lg">
                    {formatCurrency(APP_CONFIG.subscriptionPriceMonthly)}/mo
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                className="p-4 rounded-2xl border-2"
                style={{ borderColor: colors.gold, backgroundColor: colors.gold + '10' }}
                onPress={() => handleSubscribe("yearly")}
                disabled={isSubscribing}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-foreground font-bold text-base">Annual VIP Pass</Text>
                    <Text className="text-muted text-xs">Save 17% yearly</Text>
                  </View>
                  <Text className="text-gold font-bold text-lg">
                    {formatCurrency(APP_CONFIG.subscriptionPriceYearly)}/yr
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">Profile</Text>
          <TouchableOpacity onPress={() => router.push("/settings")} className="p-1">
            <IconSymbol name="gearshape.fill" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View className="mx-4 mt-3 p-5 rounded-3xl border shadow-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center">
            <View 
              className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <IconSymbol name="person.fill" size={32} color={colors.primary} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-lg font-bold text-foreground">
                  {user?.name || "PNG Artist"}
                </Text>
                {isPremium && (
                  <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.gold }}>
                    <Text className="text-white text-[10px] font-bold">PRO</Text>
                  </View>
                )}
              </View>
              <Text className="text-muted text-xs mt-0.5">{user?.email || "Artist Account"}</Text>
            </View>
          </View>

          {/* Stats Bar */}
          <View className="flex-row mt-4 pt-4 border-t" style={{ borderTopColor: colors.border }}>
            <View className="flex-1 items-center">
              <Text className="text-foreground font-bold text-base">{formatNumber(stats.totalPlays)}</Text>
              <Text className="text-muted text-[10px]">Plays</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-foreground font-bold text-base">{formatNumber(stats.totalLikes)}</Text>
              <Text className="text-muted text-[10px]">Likes</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-foreground font-bold text-base">{stats.totalSales}</Text>
              <Text className="text-muted text-[10px]">Sales</Text>
            </View>
          </View>
        </View>

        {/* Premium Banner */}
        {!isPremium && (
          <TouchableOpacity 
            className="mx-4 mt-3 p-4 rounded-2xl flex-row items-center border"
            style={{ backgroundColor: colors.gold + '20', borderColor: colors.gold + '50' }}
            onPress={() => setShowSubscription(true)}
          >
            <IconSymbol name="crown.fill" size={24} color={colors.gold} />
            <View className="flex-1 ml-3">
              <Text className="text-foreground font-bold text-sm">Upgrade to Premium</Text>
              <Text className="text-muted text-xs">Unlimited uploads & all 20+ mastering presets</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        )}

        {/* Earnings Card */}
        <View className="mx-4 mt-5">
          <Text className="text-base font-bold text-foreground mb-2">My Artist Earnings</Text>
          <View className="p-4 rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-muted text-xs">Total Earnings</Text>
              <Text className="text-foreground font-bold text-base">
                {formatCurrency(stats.totalEarnings)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mb-4 pb-3 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-muted text-xs">Available for Withdrawal</Text>
              <Text className="text-success font-bold text-base">
                {formatCurrency(stats.availableBalance)}
              </Text>
            </View>
            <TouchableOpacity 
              className="py-3 rounded-xl items-center shadow-sm"
              style={{ backgroundColor: colors.primary }}
              onPress={handleWithdrawal}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-sm">Withdraw via BSP Mobile</Text>
              )}
            </TouchableOpacity>
            <Text className="text-muted text-[10px] text-center mt-1.5">
              Minimum withdrawal: K 50.00 • Direct BSP transfer
            </Text>
          </View>
        </View>

        {/* Account Menu */}
        <View className="mx-4 mt-5">
          <Text className="text-base font-bold text-foreground mb-2">Account & Settings</Text>
          
          <TouchableOpacity 
            className="flex-row items-center py-3.5 border-b"
            style={{ borderBottomColor: colors.border }}
            onPress={() => router.push("/settings")}
          >
            <IconSymbol name="gearshape.fill" size={20} color={colors.foreground} />
            <Text className="flex-1 ml-3 text-foreground text-sm">Settings</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center py-3.5 border-b"
            style={{ borderBottomColor: colors.border }}
            onPress={() => router.push("/about")}
          >
            <IconSymbol name="info.circle.fill" size={20} color={colors.foreground} />
            <Text className="flex-1 ml-3 text-foreground text-sm">About Bilong Yumi</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center py-3.5"
            onPress={handleLogout}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.error} />
            <Text className="flex-1 ml-3 text-sm font-semibold" style={{ color: colors.error }}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
