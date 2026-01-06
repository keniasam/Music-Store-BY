import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatNumber, APP_CONFIG } from "@/shared/config";

type LibraryTab = "uploads" | "purchases" | "downloads" | "liked";

// Demo data
const MY_UPLOADS = [
  { id: 1, title: "My First Song", status: "published", plays: 1250, earnings: "45.00" },
  { id: 2, title: "Island Dreams", status: "draft", plays: 0, earnings: "0.00" },
  { id: 3, title: "PNG Pride", status: "published", plays: 890, earnings: "32.50" },
];

const MY_PURCHASES = [
  { id: 1, title: "Wantok Musik", artist: "PNG Stars", price: "5.00", purchaseDate: "2025-01-03" },
  { id: 2, title: "Highlands Love", artist: "Mountain Voice", price: "3.50", purchaseDate: "2025-01-01" },
];

const MY_DOWNLOADS = [
  { id: 1, title: "Wantok Musik", artist: "PNG Stars", downloadDate: "2025-01-03" },
  { id: 2, title: "Highlands Love", artist: "Mountain Voice", downloadDate: "2025-01-01" },
];

const MY_LIKED = [
  { id: 1, title: "Paradise Vibes", artist: "Island Beats", plays: 12300 },
  { id: 2, title: "Morobe Dreams", artist: "Coastal Crew", plays: 8500 },
  { id: 3, title: "Port Moresby Nights", artist: "City Sounds", plays: 7200 },
];

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<LibraryTab>("uploads");

  const tabs: { id: LibraryTab; label: string; icon: any }[] = [
    { id: "uploads", label: "Uploads", icon: "arrow.up.circle.fill" },
    { id: "purchases", label: "Purchases", icon: "banknote.fill" },
    { id: "downloads", label: "Downloads", icon: "arrow.down.circle.fill" },
    { id: "liked", label: "Liked", icon: "heart.fill" },
  ];

  const isPremium = false; // Subscription feature
  const downloadsRemaining = isPremium ? -1 : APP_CONFIG.freeDownloadLimit;

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <View 
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: colors.primary + '20' }}
        >
          <IconSymbol name="music.note.list" size={48} color={colors.primary} />
        </View>
        <Text className="text-2xl font-bold text-foreground text-center mb-2">
          Your Music Library
        </Text>
        <Text className="text-muted text-center mb-6">
          Login to access your uploads, purchases, downloads, and liked tracks
        </Text>
        <TouchableOpacity 
          className="px-8 py-3 rounded-full"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/login")}
        >
          <Text className="text-white font-semibold text-lg">Login</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">Library</Text>
        <Text className="text-muted">Your music collection</Text>
      </View>

      {/* Tab Bar */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 mt-4"
        contentContainerStyle={{ gap: 8 }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            className="flex-row items-center px-4 py-2 rounded-full"
            style={{ 
              backgroundColor: activeTab === tab.id ? colors.primary : colors.surface,
            }}
            onPress={() => setActiveTab(tab.id)}
          >
            <IconSymbol 
              name={tab.icon} 
              size={18} 
              color={activeTab === tab.id ? '#fff' : colors.muted} 
            />
            <Text 
              className="ml-2 font-medium"
              style={{ color: activeTab === tab.id ? '#fff' : colors.foreground }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Downloads Status */}
      {activeTab === "downloads" && (
        <View className="mx-4 mt-4 p-3 rounded-xl" style={{ backgroundColor: colors.surface }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground font-semibold">Downloads</Text>
            {isPremium ? (
              <View className="flex-row items-center">
                <IconSymbol name="crown.fill" size={16} color={colors.gold} />
                <Text className="text-gold ml-1 font-semibold">Unlimited</Text>
              </View>
            ) : (
              <Text className="text-muted">
                {downloadsRemaining} of {APP_CONFIG.freeDownloadLimit} remaining
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
      >
        {/* Uploads Tab */}
        {activeTab === "uploads" && (
          <View className="px-4">
            {MY_UPLOADS.length === 0 ? (
              <View className="items-center py-12">
                <IconSymbol name="music.note" size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4">No uploads yet</Text>
                <Text className="text-muted text-center mt-1">
                  Start creating and sharing your music
                </Text>
                <TouchableOpacity 
                  className="mt-4 px-6 py-2 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => router.push("/(tabs)/create")}
                >
                  <Text className="text-white font-semibold">Upload Music</Text>
                </TouchableOpacity>
              </View>
            ) : (
              MY_UPLOADS.map((track) => (
                <View 
                  key={track.id}
                  className="flex-row items-center py-3 border-b"
                  style={{ borderBottomColor: colors.border }}
                >
                  <View 
                    className="w-14 h-14 rounded-lg items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <IconSymbol name="music.note" size={24} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold" numberOfLines={1}>
                      {track.title}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <View 
                        className="px-2 py-0.5 rounded-full mr-2"
                        style={{ 
                          backgroundColor: track.status === "published" ? colors.success + '20' : colors.warning + '20'
                        }}
                      >
                        <Text 
                          className="text-xs font-medium"
                          style={{ color: track.status === "published" ? colors.success : colors.warning }}
                        >
                          {track.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text className="text-muted text-xs">{formatNumber(track.plays)} plays</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-success font-semibold">
                      {formatCurrency(track.earnings)}
                    </Text>
                    <Text className="text-muted text-xs">earned</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Purchases Tab */}
        {activeTab === "purchases" && (
          <View className="px-4">
            {MY_PURCHASES.length === 0 ? (
              <View className="items-center py-12">
                <IconSymbol name="banknote.fill" size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4">No purchases yet</Text>
                <Text className="text-muted text-center mt-1">
                  Discover and buy amazing PNG music
                </Text>
                <TouchableOpacity 
                  className="mt-4 px-6 py-2 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => router.push("/(tabs)/discover")}
                >
                  <Text className="text-white font-semibold">Discover Music</Text>
                </TouchableOpacity>
              </View>
            ) : (
              MY_PURCHASES.map((track) => (
                <View 
                  key={track.id}
                  className="flex-row items-center py-3 border-b"
                  style={{ borderBottomColor: colors.border }}
                >
                  <View 
                    className="w-14 h-14 rounded-lg items-center justify-center mr-3"
                    style={{ backgroundColor: colors.gold + '20' }}
                  >
                    <IconSymbol name="music.note" size={24} color={colors.gold} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold" numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text className="text-muted text-sm">{track.artist}</Text>
                    <Text className="text-muted text-xs mt-1">
                      Purchased {track.purchaseDate}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-primary font-semibold">
                      {formatCurrency(track.price)}
                    </Text>
                    <TouchableOpacity className="mt-1">
                      <IconSymbol name="arrow.down.circle.fill" size={24} color={colors.success} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Downloads Tab */}
        {activeTab === "downloads" && (
          <View className="px-4">
            {MY_DOWNLOADS.length === 0 ? (
              <View className="items-center py-12">
                <IconSymbol name="arrow.down.circle.fill" size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4">No downloads yet</Text>
                <Text className="text-muted text-center mt-1">
                  Download purchased tracks to listen offline
                </Text>
              </View>
            ) : (
              MY_DOWNLOADS.map((track) => (
                <View 
                  key={track.id}
                  className="flex-row items-center py-3 border-b"
                  style={{ borderBottomColor: colors.border }}
                >
                  <View 
                    className="w-14 h-14 rounded-lg items-center justify-center mr-3"
                    style={{ backgroundColor: colors.success + '20' }}
                  >
                    <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold" numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text className="text-muted text-sm">{track.artist}</Text>
                    <Text className="text-muted text-xs mt-1">
                      Downloaded {track.downloadDate}
                    </Text>
                  </View>
                  <TouchableOpacity>
                    <IconSymbol name="play.fill" size={24} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Liked Tab */}
        {activeTab === "liked" && (
          <View className="px-4">
            {MY_LIKED.length === 0 ? (
              <View className="items-center py-12">
                <IconSymbol name="heart.fill" size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4">No liked tracks</Text>
                <Text className="text-muted text-center mt-1">
                  Like tracks to save them here
                </Text>
              </View>
            ) : (
              MY_LIKED.map((track) => (
                <View 
                  key={track.id}
                  className="flex-row items-center py-3 border-b"
                  style={{ borderBottomColor: colors.border }}
                >
                  <View 
                    className="w-14 h-14 rounded-lg items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <IconSymbol name="music.note" size={24} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold" numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text className="text-muted text-sm">{track.artist}</Text>
                    <Text className="text-muted text-xs mt-1">
                      {formatNumber(track.plays)} plays
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <TouchableOpacity className="mr-3">
                      <IconSymbol name="heart.fill" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <IconSymbol name="play.fill" size={24} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
