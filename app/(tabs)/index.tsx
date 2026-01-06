import { ScrollView, Text, View, TouchableOpacity, Image, FlatList, Dimensions, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatNumber } from "@/shared/config";

const { width } = Dimensions.get("window");

// Demo data for initial display
const FEATURED_TRACKS = [
  { id: 1, title: "Wantok Musik", artist: "PNG Stars", coverUrl: null, plays: 15420 },
  { id: 2, title: "Paradise Vibes", artist: "Island Beats", coverUrl: null, plays: 12300 },
  { id: 3, title: "Highlands Love", artist: "Mountain Voice", coverUrl: null, plays: 9800 },
];

const TRENDING_TRACKS = [
  { id: 1, title: "Morobe Dreams", artist: "Coastal Crew", price: "5.00", isFree: false, plays: 8500 },
  { id: 2, title: "Port Moresby Nights", artist: "City Sounds", price: "0.00", isFree: true, plays: 7200 },
  { id: 3, title: "Sepik River Flow", artist: "River Band", price: "3.50", isFree: false, plays: 6100 },
  { id: 4, title: "Rabaul Sunrise", artist: "East New Britain", price: "0.00", isFree: true, plays: 5400 },
];

const GENRES = ["Gospel", "Reggae", "Hip Hop", "Traditional", "Pop", "R&B"];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeGenre, setActiveGenre] = useState("Gospel");

  return (
    <ScreenContainer>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-foreground">Music Store</Text>
            <Text className="text-lg text-primary font-semibold">Bilong Yumi</Text>
          </View>
          <TouchableOpacity 
            onPress={() => Alert.alert("Notifications", "No new notifications")}
            style={{ padding: 8 }}
          >
            <IconSymbol name="bell.fill" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Welcome Banner */}
        <View className="mx-4 mt-4 p-4 rounded-2xl" style={{ backgroundColor: colors.primary }}>
          <Text className="text-white text-lg font-bold mb-1">
            {isAuthenticated ? `Welcome back, ${user?.name || 'Artist'}!` : 'Welcome to PNG Music!'}
          </Text>
          <Text className="text-white/80 text-sm mb-3">
            Discover, create, and share Papua New Guinea's finest music
          </Text>
          {!isAuthenticated && (
            <TouchableOpacity 
              className="bg-white/20 py-2 px-4 rounded-full self-start"
              onPress={() => router.push("/login")}
            >
              <Text className="text-white font-semibold">Get Started</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View className="flex-row px-4 mt-6 gap-3">
          <TouchableOpacity 
            className="flex-1 p-4 rounded-xl items-center"
            style={{ backgroundColor: colors.surface }}
            onPress={() => router.push("/(tabs)/create")}
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: colors.primary + '20' }}>
              <IconSymbol name="wand.and.stars" size={24} color={colors.primary} />
            </View>
            <Text className="text-foreground font-semibold text-sm">AI Creator</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 p-4 rounded-xl items-center"
            style={{ backgroundColor: colors.surface }}
            onPress={() => router.push("/(tabs)/create")}
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: colors.gold + '20' }}>
              <IconSymbol name="arrow.up.circle.fill" size={24} color={colors.gold} />
            </View>
            <Text className="text-foreground font-semibold text-sm">Upload</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 p-4 rounded-xl items-center"
            style={{ backgroundColor: colors.surface }}
            onPress={() => router.push("/(tabs)/create")}
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: colors.success + '20' }}>
              <IconSymbol name="waveform" size={24} color={colors.success} />
            </View>
            <Text className="text-foreground font-semibold text-sm">Master</Text>
          </TouchableOpacity>
        </View>

        {/* Genre Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mt-6 px-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {GENRES.map((genre) => (
            <TouchableOpacity
              key={genre}
              className="px-4 py-2 rounded-full"
              style={{ 
                backgroundColor: activeGenre === genre ? colors.primary : colors.surface,
              }}
              onPress={() => setActiveGenre(genre)}
            >
              <Text 
                className="font-medium"
                style={{ color: activeGenre === genre ? '#fff' : colors.foreground }}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Section */}
        <View className="mt-6">
          <View className="px-4 flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">Featured</Text>
            <TouchableOpacity>
              <Text className="text-primary font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {FEATURED_TRACKS.map((track) => (
              <TouchableOpacity 
                key={track.id}
                className="rounded-xl overflow-hidden"
                style={{ width: width * 0.7, backgroundColor: colors.surface }}
                onPress={() => Alert.alert(track.title, `By ${track.artist}`)}
              >
                <View 
                  className="h-40 items-center justify-center"
                  style={{ backgroundColor: colors.primary + '30' }}
                >
                  <IconSymbol name="music.note" size={48} color={colors.primary} />
                </View>
                <View className="p-3">
                  <Text className="text-foreground font-bold text-base" numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text className="text-muted text-sm" numberOfLines={1}>
                    {track.artist}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <IconSymbol name="play.fill" size={14} color={colors.muted} />
                    <Text className="text-muted text-xs ml-1">{formatNumber(track.plays)} plays</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending Section */}
        <View className="mt-6 px-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">Trending Now</Text>
            <TouchableOpacity>
              <Text className="text-primary font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          
          {TRENDING_TRACKS.map((track, index) => (
            <TouchableOpacity 
              key={track.id}
              className="flex-row items-center py-3 border-b"
              style={{ borderBottomColor: colors.border }}
              onPress={() => Alert.alert(track.title, `By ${track.artist}`)}
            >
              <Text className="text-muted font-bold w-6">{index + 1}</Text>
              <View 
                className="w-12 h-12 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <IconSymbol name="music.note" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold" numberOfLines={1}>
                  {track.title}
                </Text>
                <Text className="text-muted text-sm" numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
              <View className="items-end">
                {track.isFree ? (
                  <Text className="text-success font-semibold text-sm">FREE</Text>
                ) : (
                  <Text className="text-primary font-semibold text-sm">
                    {formatCurrency(track.price)}
                  </Text>
                )}
                <Text className="text-muted text-xs">{formatNumber(track.plays)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* How It Works Section */}
        <View className="mt-6 px-4">
          <Text className="text-lg font-bold text-foreground mb-3">How It Works</Text>
          <View className="rounded-xl p-4" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-start mb-4">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
                <Text className="text-white font-bold">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Create Account</Text>
                <Text className="text-muted text-sm">Sign up with your email to get started</Text>
              </View>
            </View>
            <View className="flex-row items-start mb-4">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
                <Text className="text-white font-bold">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Upload or Create</Text>
                <Text className="text-muted text-sm">Upload your music or use AI to create new tracks</Text>
              </View>
            </View>
            <View className="flex-row items-start mb-4">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
                <Text className="text-white font-bold">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Master Your Sound</Text>
                <Text className="text-muted text-sm">Use professional mastering presets</Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
                <Text className="text-white font-bold">4</Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Sell & Earn</Text>
                <Text className="text-muted text-sm">Set your price and receive 95% of sales</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View className="mt-6 px-4 mb-4">
          <TouchableOpacity 
            className="rounded-xl p-4 flex-row items-center"
            style={{ backgroundColor: colors.gold + '20' }}
            onPress={() => router.push("/about")}
          >
            <IconSymbol name="heart.fill" size={24} color={colors.gold} />
            <View className="flex-1 ml-3">
              <Text className="text-foreground font-semibold">Support PNG Music</Text>
              <Text className="text-muted text-sm">Learn about the creator & donate</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
