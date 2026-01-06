import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";

type AuthMode = "login" | "register";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { refresh, loading: isLoading } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }
    if (mode === "register") {
      if (!name.trim()) {
        Alert.alert("Error", "Please enter your name");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }
      if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return;
      }
    }

    try {
      await refresh();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Authentication failed. Please try again.");
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Login" : "Create Account"}
          </Text>
        </View>

        {/* Logo */}
        <View className="items-center mt-8 mb-8">
          <View 
            className="w-24 h-24 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <IconSymbol name="music.note" size={48} color="#fff" />
          </View>
          <Text className="text-xl font-bold text-foreground mt-4">
            Music Store Bilong Yumi
          </Text>
          <Text className="text-muted">
            {mode === "login" ? "Welcome back!" : "Join the PNG music community"}
          </Text>
        </View>

        {/* Form */}
        <View className="px-4">
          {mode === "register" && (
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">Full Name</Text>
              <View 
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{ backgroundColor: colors.surface }}
              >
                <IconSymbol name="person.fill" size={20} color={colors.muted} />
                <TextInput
                  className="flex-1 ml-3"
                  placeholder="Enter your name"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  style={{ color: colors.foreground }}
                />
              </View>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-foreground font-medium mb-2">Email</Text>
            <View 
              className="flex-row items-center px-4 py-3 rounded-xl"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol name="envelope.fill" size={20} color={colors.muted} />
              <TextInput
                className="flex-1 ml-3"
                placeholder="Enter your email"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{ color: colors.foreground }}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-foreground font-medium mb-2">Password</Text>
            <View 
              className="flex-row items-center px-4 py-3 rounded-xl"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol name="lock.fill" size={20} color={colors.muted} />
              <TextInput
                className="flex-1 ml-3"
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={{ color: colors.foreground }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <IconSymbol 
                  name={showPassword ? "eye.fill" : "eye.slash.fill"} 
                  size={20} 
                  color={colors.muted} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {mode === "register" && (
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">Confirm Password</Text>
              <View 
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{ backgroundColor: colors.surface }}
              >
                <IconSymbol name="lock.fill" size={20} color={colors.muted} />
                <TextInput
                  className="flex-1 ml-3"
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={{ color: colors.foreground }}
                />
              </View>
            </View>
          )}

          {mode === "login" && (
            <TouchableOpacity className="mb-4 self-end">
              <Text className="text-primary font-medium">Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <TouchableOpacity 
            className="py-4 rounded-xl items-center mt-4"
            style={{ 
              backgroundColor: isLoading ? colors.muted : colors.primary,
              opacity: isLoading ? 0.7 : 1,
            }}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text className="text-white font-bold text-lg">
              {isLoading ? "Please wait..." : (mode === "login" ? "Login" : "Create Account")}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
            <Text className="mx-4 text-muted">or continue with</Text>
            <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
          </View>

          {/* Social Login */}
          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: colors.surface }}
              onPress={() => Alert.alert("Google", "Google login would start here")}
            >
              <IconSymbol name="globe" size={24} color={colors.foreground} />
              <Text className="text-foreground font-medium ml-2">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: colors.surface }}
              onPress={() => Alert.alert("Facebook", "Facebook login would start here")}
            >
              <IconSymbol name="person.2.fill" size={24} color={colors.foreground} />
              <Text className="text-foreground font-medium ml-2">Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Switch Mode */}
          <View className="flex-row items-center justify-center mt-8">
            <Text className="text-muted">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <TouchableOpacity 
              className="ml-1"
              onPress={() => setMode(mode === "login" ? "register" : "login")}
            >
              <Text className="text-primary font-semibold">
                {mode === "login" ? "Sign Up" : "Login"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          {mode === "register" && (
            <Text className="text-muted text-center text-sm mt-4">
              By creating an account, you agree to our{" "}
              <Text 
                className="text-primary"
                onPress={() => router.push("/terms")}
              >
                Terms & Conditions
              </Text>
              {" "}and{" "}
              <Text 
                className="text-primary"
                onPress={() => router.push("/privacy")}
              >
                Privacy Policy
              </Text>
            </Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
