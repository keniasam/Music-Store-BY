import { ScrollView, Text, View, TouchableOpacity, Image, Linking, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatNumber, APP_CONFIG, CONTACT_INFO, PAYMENT_METHODS } from "@/shared/config";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [showSubscription, setShowSubscription] = useState(false);

  // Demo stats
  const stats = {
    totalPlays: 15420,
    totalLikes: 892,
    totalSales: 47,
    totalEarnings: "245.50",
    availableBalance: "198.00",
  };

  const isPremium = false; // user?.subscriptionTier === "premium"

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => logout() },
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open link");
    });
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
          className="px-8 py-3 rounded-full mb-3 w-full max-w-xs"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/login")}
        >
          <Text className="text-white font-semibold text-lg text-center">Login</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="px-8 py-3 rounded-full w-full max-w-xs border-2"
          style={{ borderColor: colors.primary }}
          onPress={() => router.push("/login")}
        >
          <Text className="font-semibold text-lg text-center" style={{ color: colors.primary }}>
            Create Account
          </Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // Subscription Modal
  if (showSubscription) {
    return (
      <ScreenContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-2 flex-row items-center">
            <TouchableOpacity onPress={() => setShowSubscription(false)} className="mr-3">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">Go Premium</Text>
          </View>

          {/* Premium Benefits */}
          <View className="px-4 mt-6">
            <View 
              className="p-6 rounded-2xl items-center"
              style={{ backgroundColor: colors.gold + '20' }}
            >
              <IconSymbol name="crown.fill" size={48} color={colors.gold} />
              <Text className="text-2xl font-bold text-foreground mt-4">Premium</Text>
              <Text className="text-muted text-center mt-2">
                Unlock all features and grow your music career
              </Text>
            </View>

            <View className="mt-6">
              <Text className="text-foreground font-bold text-lg mb-4">What you get:</Text>
              
              {[
                { icon: "arrow.up.circle.fill", text: "Unlimited uploads" },
                { icon: "arrow.down.circle.fill", text: "Unlimited downloads" },
                { icon: "waveform", text: "All mastering presets (20+)" },
                { icon: "wand.and.stars", text: "Advanced AI music generation" },
                { icon: "star.fill", text: "Priority support" },
                { icon: "checkmark.circle.fill", text: "No ads" },
              ].map((item, index) => (
                <View key={index} className="flex-row items-center mb-3">
                  <IconSymbol name={item.icon as any} size={24} color={colors.success} />
                  <Text className="text-foreground ml-3">{item.text}</Text>
                </View>
              ))}
            </View>

            {/* Pricing */}
            <View className="mt-6">
              <TouchableOpacity 
                className="p-4 rounded-xl mb-3 border-2"
                style={{ borderColor: colors.primary, backgroundColor: colors.primary + '10' }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-foreground font-bold text-lg">Monthly</Text>
                    <Text className="text-muted">Billed monthly</Text>
                  </View>
                  <Text className="text-primary font-bold text-xl">
                    {formatCurrency(APP_CONFIG.subscriptionPriceMonthly)}/mo
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                className="p-4 rounded-xl border-2"
                style={{ borderColor: colors.gold, backgroundColor: colors.gold + '10' }}
              >
                <View className="absolute -top-3 right-4 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.gold }}>
                  <Text className="text-white text-xs font-bold">SAVE 17%</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-foreground font-bold text-lg">Yearly</Text>
                    <Text className="text-muted">Billed annually</Text>
                  </View>
                  <Text className="text-gold font-bold text-xl">
                    {formatCurrency(APP_CONFIG.subscriptionPriceYearly)}/yr
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Payment Methods */}
            <View className="mt-6">
              <Text className="text-foreground font-semibold mb-3">Payment Methods</Text>
              <View className="flex-row flex-wrap gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <View 
                    key={method.id}
                    className="px-4 py-2 rounded-full"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <Text className="text-foreground">{method.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Subscribe Button */}
            <TouchableOpacity 
              className="mt-8 py-4 rounded-xl items-center"
              style={{ backgroundColor: colors.gold }}
              onPress={() => Alert.alert("Subscribe", "Payment flow would start here")}
            >
              <Text className="text-white font-bold text-lg">Subscribe Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">Profile</Text>
          <TouchableOpacity onPress={() => router.push("/settings")}>
            <IconSymbol name="gearshape.fill" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View className="mx-4 mt-4 p-4 rounded-2xl" style={{ backgroundColor: colors.surface }}>
          <View className="flex-row items-center">
            <View 
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <IconSymbol name="person.fill" size={40} color={colors.primary} />
            </View>
            <View className="flex-1 ml-4">
              <View className="flex-row items-center">
                <Text className="text-xl font-bold text-foreground">
                  {user?.name || "Artist"}
                </Text>
                {isPremium && (
                  <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.gold }}>
                    <Text className="text-white text-xs font-bold">PRO</Text>
                  </View>
                )}
              </View>
              <Text className="text-muted">{user?.email}</Text>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row mt-4 pt-4 border-t" style={{ borderTopColor: colors.border }}>
            <View className="flex-1 items-center">
              <Text className="text-foreground font-bold text-lg">{formatNumber(stats.totalPlays)}</Text>
              <Text className="text-muted text-sm">Plays</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-foreground font-bold text-lg">{formatNumber(stats.totalLikes)}</Text>
              <Text className="text-muted text-sm">Likes</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-foreground font-bold text-lg">{stats.totalSales}</Text>
              <Text className="text-muted text-sm">Sales</Text>
            </View>
          </View>
        </View>

        {/* Subscription Banner */}
        {!isPremium && (
          <TouchableOpacity 
            className="mx-4 mt-4 p-4 rounded-xl flex-row items-center"
            style={{ backgroundColor: colors.gold + '20' }}
            onPress={() => setShowSubscription(true)}
          >
            <IconSymbol name="crown.fill" size={24} color={colors.gold} />
            <View className="flex-1 ml-3">
              <Text className="text-foreground font-bold">Upgrade to Premium</Text>
              <Text className="text-muted text-sm">Unlimited uploads & downloads</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        )}

        {/* Earnings Section */}
        <View className="mx-4 mt-6">
          <Text className="text-lg font-bold text-foreground mb-3">My Earnings</Text>
          <View className="p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-muted">Total Earnings</Text>
              <Text className="text-foreground font-bold text-xl">
                {formatCurrency(stats.totalEarnings)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mb-4 pb-4 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-muted">Available Balance</Text>
              <Text className="text-success font-bold text-xl">
                {formatCurrency(stats.availableBalance)}
              </Text>
            </View>
            <TouchableOpacity 
              className="py-3 rounded-xl items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => Alert.alert("Withdraw", "Withdrawal flow would start here")}
            >
              <Text className="text-white font-semibold">Withdraw Funds</Text>
            </TouchableOpacity>
            <Text className="text-muted text-xs text-center mt-2">
              Minimum withdrawal: K 50.00
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="mx-4 mt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Account</Text>
          
          <TouchableOpacity 
            className="flex-row items-center py-4 border-b"
            style={{ borderBottomColor: colors.border }}
            onPress={() => router.push("/settings")}
          >
            <IconSymbol name="gearshape.fill" size={24} color={colors.foreground} />
            <Text className="flex-1 ml-3 text-foreground">Settings</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center py-4 border-b"
            style={{ borderBottomColor: colors.border }}
            onPress={() => router.push("/about")}
          >
            <IconSymbol name="info.circle.fill" size={24} color={colors.foreground} />
            <Text className="flex-1 ml-3 text-foreground">About</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center py-4 border-b"
            style={{ borderBottomColor: colors.border }}
            onPress={() => router.push("/terms")}
          >
            <IconSymbol name="doc.text.fill" size={24} color={colors.foreground} />
            <Text className="flex-1 ml-3 text-foreground">Terms & Conditions</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center py-4 border-b"
            style={{ borderBottomColor: colors.border }}
            onPress={() => router.push("/privacy")}
          >
            <IconSymbol name="shield.fill" size={24} color={colors.foreground} />
            <Text className="flex-1 ml-3 text-foreground">Privacy Policy</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center py-4"
            onPress={handleLogout}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.error} />
            <Text className="flex-1 ml-3" style={{ color: colors.error }}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View className="mx-4 mt-6 p-4 rounded-xl" style={{ backgroundColor: colors.gold + '15' }}>
          <Text className="text-foreground font-bold mb-2">Support PNG Music</Text>
          <Text className="text-muted text-sm mb-3">
            Help us grow the PNG music industry by donating to the platform
          </Text>
          <View className="flex-row items-center">
            <IconSymbol name="banknote.fill" size={20} color={colors.gold} />
            <Text className="text-foreground ml-2">
              BSP Account: <Text className="font-bold">{CONTACT_INFO.bspAccount}</Text>
            </Text>
          </View>
        </View>

        {/* Contact */}
        <View className="mx-4 mt-6 mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">Contact Us</Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity 
              className="flex-row items-center px-4 py-2 rounded-full"
              style={{ backgroundColor: colors.surface }}
              onPress={() => openLink(`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\s/g, '')}`)}
            >
              <Text className="text-foreground">WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-row items-center px-4 py-2 rounded-full"
              style={{ backgroundColor: colors.surface }}
              onPress={() => openLink(`mailto:${CONTACT_INFO.email}`)}
            >
              <Text className="text-foreground">Email</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-row items-center px-4 py-2 rounded-full"
              style={{ backgroundColor: colors.surface }}
              onPress={() => openLink(`https://facebook.com/${CONTACT_INFO.facebook.replace(/\s/g, '')}`)}
            >
              <Text className="text-foreground">Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
