import { ScrollView, Text, View, TouchableOpacity, Switch, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => Alert.alert("Account Deletion", "Please contact support to delete your account.") 
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Settings</Text>
        </View>

        {/* Account Section */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-semibold text-muted mb-2">ACCOUNT</Text>
          <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface }}>
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b"
              style={{ borderBottomColor: colors.border }}
              onPress={() => Alert.alert("Edit Profile", "Profile editing would open here")}
            >
              <IconSymbol name="person.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">Edit Profile</Text>
                <Text className="text-muted text-sm">Name, bio, avatar</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4 border-b"
              style={{ borderBottomColor: colors.border }}
              onPress={() => Alert.alert("Change Email", "Email change would open here")}
            >
              <IconSymbol name="envelope.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">Email</Text>
                <Text className="text-muted text-sm">{user?.email || "Not set"}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4"
              onPress={() => Alert.alert("Change Password", "Password change would open here")}
            >
              <IconSymbol name="lock.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">Password</Text>
                <Text className="text-muted text-sm">Change your password</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Section */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-semibold text-muted mb-2">PAYMENT</Text>
          <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface }}>
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b"
              style={{ borderBottomColor: colors.border }}
              onPress={() => Alert.alert("PayPal", "PayPal settings would open here")}
            >
              <IconSymbol name="creditcard.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">PayPal</Text>
                <Text className="text-muted text-sm">Connect your PayPal account</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4"
              onPress={() => Alert.alert("BSP Account", "BSP settings would open here")}
            >
              <IconSymbol name="banknote.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">BSP Account</Text>
                <Text className="text-muted text-sm">Bank South Pacific details</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-semibold text-muted mb-2">NOTIFICATIONS</Text>
          <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface }}>
            <View 
              className="flex-row items-center p-4 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <IconSymbol name="bell.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">Push Notifications</Text>
                <Text className="text-muted text-sm">Likes, comments, sales</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View className="flex-row items-center p-4">
              <IconSymbol name="envelope.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">Email Notifications</Text>
                <Text className="text-muted text-sm">Weekly updates, promotions</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-semibold text-muted mb-2">APPEARANCE</Text>
          <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center p-4">
              <IconSymbol name="globe" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">Dark Mode</Text>
                <Text className="text-muted text-sm">Use dark theme</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-semibold text-muted mb-2">SUPPORT</Text>
          <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface }}>
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b"
              style={{ borderBottomColor: colors.border }}
              onPress={() => Alert.alert("Help", "Help center would open here")}
            >
              <IconSymbol name="questionmark.circle.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">Help Center</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4"
              onPress={() => Alert.alert("Feedback", "Feedback form would open here")}
            >
              <IconSymbol name="paperplane.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">Send Feedback</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Section */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-semibold text-muted mb-2">LEGAL</Text>
          <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface }}>
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b"
              style={{ borderBottomColor: colors.border }}
              onPress={() => router.push("/terms")}
            >
              <IconSymbol name="doc.text.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">Terms & Conditions</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4"
              onPress={() => router.push("/privacy")}
            >
              <IconSymbol name="shield.fill" size={24} color={colors.foreground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">Privacy Policy</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-semibold text-muted mb-2">DANGER ZONE</Text>
          <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface }}>
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b"
              style={{ borderBottomColor: colors.border }}
              onPress={handleLogout}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.warning} />
              <Text className="flex-1 ml-3 font-medium" style={{ color: colors.warning }}>
                Logout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4"
              onPress={handleDeleteAccount}
            >
              <IconSymbol name="trash.fill" size={24} color={colors.error} />
              <Text className="flex-1 ml-3 font-medium" style={{ color: colors.error }}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <View className="items-center mt-8">
          <Text className="text-muted text-sm">Music Store Bilong Yumi</Text>
          <Text className="text-muted text-sm">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
