import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as Auth from "@/lib/_core/auth";

type AuthMode = "login" | "register";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { refresh } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const demoLoginMutation = trpc.auth.demoLogin.useMutation();

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

    setIsSubmitting(true);
    try {
      if (mode === "register") {
        const res = await registerMutation.mutateAsync({
          email: email.trim(),
          password: password.trim(),
          name: name.trim(),
        });
        if (res.token && res.user) {
          await Auth.setSessionToken(res.token);
          await Auth.setUserInfo({
            id: res.user.id,
            openId: res.user.openId,
            name: res.user.name,
            email: res.user.email,
            loginMethod: res.user.loginMethod,
            lastSignedIn: new Date(res.user.lastSignedIn),
          });
        }
      } else {
        const res = await loginMutation.mutateAsync({
          email: email.trim(),
          password: password.trim(),
        });
        if (res.token && res.user) {
          await Auth.setSessionToken(res.token);
          await Auth.setUserInfo({
            id: res.user.id,
            openId: res.user.openId,
            name: res.user.name,
            email: res.user.email,
            loginMethod: res.user.loginMethod,
            lastSignedIn: new Date(res.user.lastSignedIn),
          });
        }
      }

      await refresh();
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("[Login] Auth error:", error);
      Alert.alert("Authentication Failed", error?.message || "Please check your credentials and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: "artist" | "listener") => {
    setIsSubmitting(true);
    try {
      const res = await demoLoginMutation.mutateAsync({ role });
      if (res.token && res.user) {
        await Auth.setSessionToken(res.token);
        await Auth.setUserInfo({
          id: res.user.id,
          openId: res.user.openId,
          name: res.user.name,
          email: res.user.email,
          loginMethod: res.user.loginMethod,
          lastSignedIn: new Date(res.user.lastSignedIn),
        });
      }
      await refresh();
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("[Login] Demo login error:", err);
      Alert.alert("Demo Login Failed", err?.message || "Could not log in as demo user");
    } finally {
      setIsSubmitting(false);
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
        <View className="items-center mt-6 mb-6">
          <View 
            className="w-20 h-20 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <IconSymbol name="music.note" size={40} color="#fff" />
          </View>
          <Text className="text-xl font-bold text-foreground mt-3">
            Music Store Bilong Yumi
          </Text>
          <Text className="text-muted">
            {mode === "login" ? "Welcome back!" : "Join the PNG music community"}
          </Text>
        </View>

        {/* Demo 1-Click Access Card */}
        <View className="mx-4 mb-6 p-4 rounded-2xl" style={{ backgroundColor: colors.surface }}>
          <Text className="text-foreground font-bold mb-1">Instant Demo Access</Text>
          <Text className="text-muted text-xs mb-3">
            Test the platform instantly with pre-configured accounts:
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity 
              className="flex-1 py-2.5 px-3 rounded-xl flex-row items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => handleDemoLogin("artist")}
              disabled={isSubmitting}
            >
              <IconSymbol name="music.note" size={16} color="#fff" />
              <Text className="text-white font-semibold text-xs ml-1.5">Demo Artist</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 py-2.5 px-3 rounded-xl flex-row items-center justify-center border"
              style={{ borderColor: colors.primary }}
              onPress={() => handleDemoLogin("listener")}
              disabled={isSubmitting}
            >
              <IconSymbol name="person.fill" size={16} color={colors.primary} />
              <Text className="font-semibold text-xs ml-1.5" style={{ color: colors.primary }}>
                Demo Listener
              </Text>
            </TouchableOpacity>
          </View>
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
                  placeholder="e.g. Justin Wellington"
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
                placeholder="your.email@example.com"
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
                placeholder="Enter password (min 6 characters)"
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

          {/* Submit Button */}
          <TouchableOpacity 
            className="py-4 rounded-xl items-center mt-3"
            style={{ 
              backgroundColor: isSubmitting ? colors.muted : colors.primary,
              opacity: isSubmitting ? 0.7 : 1,
            }}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {mode === "login" ? "Login" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch Mode */}
          <View className="flex-row items-center justify-center mt-6">
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
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
