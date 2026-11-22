import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useAudioPlayer, type PlayableTrack } from "@/lib/audio-player-context";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatNumber } from "@/shared/config";

const { width } = Dimensions.get("window");

const GENRES = ["All", "Reggae", "Pop", "Traditional", "Hip Hop", "R&B", "Gospel"];

function toPlayable(t: any): PlayableTrack {
  return {
    id: t.id,
    title: t.title,
    artist: "PNG Artist",
    genre: t.genre,
    duration: t.duration,
    audioUrl: t.audioUrl,
    coverUrl: t.coverUrl,
    price: t.price,
    isFree: t.isFree,
    masteringPreset: t.masteringPreset,
    masteringLevel: t.masteringLevel,
  };
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();
  const [activeGenre, setActiveGenre] = useState("All");
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: trendingTracks, isLoading: isTrendingLoading } = trpc.tracks.getTrending.useQuery({ limit: 10 });
  const { data: feedTracks } = trpc.tracks.getFeed.useQuery({ limit: 10 });
  const { data: genreTracks } = trpc.tracks.getByGenre.useQuery(
    { genre: activeGenre, limit: 10 },
    { enabled: activeGenre !== "All" }
  );

  const { data: notifications, refetch: refetchNotifications } = trpc.notifications.getAll.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated }
  );
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation();

  const unreadCount = notifications ? notifications.filter((n) => !n.isRead).length : 0;

  const displayedTracks = activeGenre === "All" ? (trendingTracks || []) : (genreTracks || []);
  const featuredTracks = feedTracks && feedTracks.length > 0 ? feedTracks.slice(0, 5) : (trendingTracks || []).slice(0, 5);

  const handlePlayTrack = (track: any, list: any[]) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      const queueList = list.filter((t) => !!t.audioUrl).map(toPlayable);
      playTrack(toPlayable(track), queueList);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      refetchNotifications();
    } catch {
      // ignore
    }
  };

  return (
    <ScreenContainer style={{ backgroundColor: "#002B36" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-foreground">Music Store</Text>
            <Text className="text-lg text-primary font-semibold">Bilong Yumi</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {isAuthenticated && (
              <TouchableOpacity
                onPress={() => {
                  refetchNotifications();
                  setShowNotifications(true);
                }}
                className="p-2 relative"
              >
                <IconSymbol name="bell.fill" size={24} color={colors.foreground} />
                {unreadCount > 0 && (
                  <View
                    className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-white text-[10px] font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push(isAuthenticated ? "/(tabs)/profile" : "/login")}
              className="p-2 flex-row items-center"
            >
              <IconSymbol
                name={isAuthenticated ? "person.crop.circle.fill" : "person.crop.circle"}
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Banner */}
        <View className="mx-4 mt-3 p-5 rounded-2xl shadow-md" style={{ backgroundColor: colors.primary }}>
          <Text className="text-white text-xl font-bold mb-1">
            {isAuthenticated ? `Welcome back, ${user?.name || "Wantok"}!` : "Welcome to PNG Music!"}
          </Text>
          <Text className="text-white/85 text-sm mb-4 leading-relaxed">
            Discover, stream, buy, and sell Papua New Guinea&apos;s finest original sounds
          </Text>
          {!isAuthenticated ? (
            <TouchableOpacity
              className="bg-white/20 py-2.5 px-5 rounded-full self-start border border-white/30"
              onPress={() => router.push("/login")}
            >
              <Text className="text-white font-semibold text-sm">Join &amp; Support PNG Artists</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="bg-white/25 py-2 px-4 rounded-full self-start"
              onPress={() => router.push("/(tabs)/create")}
            >
              <Text className="text-white font-semibold text-xs">+ Upload New Track</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View className="flex-row px-4 mt-5 gap-3">
          <TouchableOpacity
            className="flex-1 p-3.5 rounded-2xl items-center border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            onPress={() => router.push("/(tabs)/create")}
          >
            <View className="w-11 h-11 rounded-full items-center justify-center mb-1.5" style={{ backgroundColor: colors.primary + "25" }}>
              <IconSymbol name="wand.and.stars" size={22} color={colors.primary} />
            </View>
            <Text className="text-foreground font-semibold text-xs">AI Creator</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 p-3.5 rounded-2xl items-center border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            onPress={() => router.push("/(tabs)/create")}
          >
            <View className="w-11 h-11 rounded-full items-center justify-center mb-1.5" style={{ backgroundColor: colors.gold + "25" }}>
              <IconSymbol name="arrow.up.circle.fill" size={22} color={colors.gold} />
            </View>
            <Text className="text-foreground font-semibold text-xs">Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 p-3.5 rounded-2xl items-center border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            onPress={() => router.push("/(tabs)/create")}
          >
            <View className="w-11 h-11 rounded-full items-center justify-center mb-1.5" style={{ backgroundColor: colors.success + "25" }}>
              <IconSymbol name="waveform" size={22} color={colors.success} />
            </View>
            <Text className="text-foreground font-semibold text-xs">Mastering</Text>
          </TouchableOpacity>
        </View>

        {/* Genre Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-5 px-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {GENRES.map((genre) => (
            <TouchableOpacity
              key={genre}
              className="px-4 py-2 rounded-full border"
              style={{
                backgroundColor: activeGenre === genre ? colors.primary : colors.surface,
                borderColor: activeGenre === genre ? colors.primary : colors.border,
              }}
              onPress={() => setActiveGenre(genre)}
            >
              <Text
                className="font-semibold text-xs"
                style={{ color: activeGenre === genre ? "#fff" : colors.foreground }}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Section */}
        <View className="mt-6">
          <View className="px-4 flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">Featured Tracks</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/discover")}>
              <Text className="text-primary font-semibold text-sm">Explore All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
          >
            {featuredTracks.map((track) => (
              <TouchableOpacity
                key={track.id}
                className="rounded-2xl overflow-hidden border shadow-sm"
                style={{ width: width * 0.65, backgroundColor: colors.surface, borderColor: colors.border }}
                onPress={() => router.push(`/track/${track.id}` as any)}
              >
                <View
                  className="h-36 items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: colors.primary + "25" }}
                >
                  {track.coverUrl ? (
                    <Image source={{ uri: track.coverUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <IconSymbol name="music.note" size={44} color={colors.primary} />
                  )}
                  {/* Floating Play Button */}
                  <TouchableOpacity
                    onPress={() => handlePlayTrack(track, featuredTracks)}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full items-center justify-center shadow-md"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <IconSymbol
                      name={currentTrack?.id === track.id && isPlaying ? "pause.fill" : "play.fill"}
                      size={18}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
                <View className="p-3">
                  <Text className="text-foreground font-bold text-base" numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                    PNG Artist • {track.genre || "Music"}
                  </Text>
                  <View className="flex-row items-center justify-between mt-2.5">
                    <View className="flex-row items-center">
                      <IconSymbol name="play.fill" size={12} color={colors.muted} />
                      <Text className="text-muted text-xs ml-1">{formatNumber(track.playCount)}</Text>
                    </View>
                    <Text
                      className="text-xs font-bold"
                      style={{ color: track.isFree ? colors.success : colors.primary }}
                    >
                      {track.isFree ? "FREE" : formatCurrency(track.price)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending Section */}
        <View className="mt-6 px-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">
              {activeGenre === "All" ? "Trending in PNG" : `${activeGenre} Tracks`}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/discover")}>
              <Text className="text-primary font-semibold text-sm">See All</Text>
            </TouchableOpacity>
          </View>

          {isTrendingLoading ? (
            <ActivityIndicator color={colors.primary} className="my-4" />
          ) : (
            displayedTracks.map((track, index) => (
              <TouchableOpacity
                key={track.id}
                className="flex-row items-center py-3 border-b"
                style={{ borderBottomColor: colors.border }}
                onPress={() => router.push(`/track/${track.id}` as any)}
              >
                <Text className="text-muted font-bold w-6">{index + 1}</Text>
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3 overflow-hidden"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  {track.coverUrl ? (
                    <Image source={{ uri: track.coverUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <IconSymbol name="music.note" size={20} color={colors.primary} />
                  )}
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                    PNG Artist • {track.genre || "Melanesian"}
                  </Text>
                </View>
                <View className="items-end mr-3">
                  <Text
                    className="font-bold text-xs"
                    style={{ color: track.isFree ? colors.success : colors.primary }}
                  >
                    {track.isFree ? "FREE" : formatCurrency(track.price)}
                  </Text>
                  <Text className="text-muted text-xs mt-0.5">{formatNumber(track.playCount)} plays</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handlePlayTrack(track, displayedTracks)}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <IconSymbol
                    name={currentTrack?.id === track.id && isPlaying ? "pause.fill" : "play.fill"}
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Support Section */}
        <View className="mt-6 px-4 mb-2">
          <TouchableOpacity
            className="rounded-2xl p-4 flex-row items-center border"
            style={{ backgroundColor: colors.surface, borderColor: colors.gold + "50" }}
            onPress={() => router.push("/about")}
          >
            <IconSymbol name="heart.fill" size={24} color={colors.gold} />
            <View className="flex-1 ml-3">
              <Text className="text-foreground font-bold text-sm">Support PNG Musicians</Text>
              <Text className="text-muted text-xs">Direct support to local creators via BSP Mobile Banking</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Artist Sale & Activity Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View
            className="p-6 rounded-t-3xl border-t max-h-[80%]"
            style={{ backgroundColor: colors.background, borderColor: colors.border }}
          >
            <View
              className="flex-row items-center justify-between pb-3 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <View>
                <Text className="text-xl font-bold text-foreground">Notifications</Text>
                <Text className="text-muted text-xs">
                  {unreadCount} unread {unreadCount === 1 ? "alert" : "alerts"}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={handleMarkAllRead}
                    className="px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: colors.primary + "25" }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                      Mark All Read
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setShowNotifications(false)}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.surface }}
                >
                  <IconSymbol name="xmark" size={16} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              {!notifications || notifications.length === 0 ? (
                <View className="items-center py-10">
                  <IconSymbol name="bell.fill" size={40} color={colors.muted} />
                  <Text className="text-foreground font-semibold mt-3">No notifications yet</Text>
                  <Text className="text-muted text-xs text-center mt-1">
                    Track sales, royalty credits, and fan interactions will appear here.
                  </Text>
                </View>
              ) : (
                notifications.map((item) => (
                  <View
                    key={item.id}
                    className="p-3.5 rounded-2xl mb-2.5 border"
                    style={{
                      backgroundColor: item.isRead ? colors.surface : colors.primary + "18",
                      borderColor: item.isRead ? colors.border : colors.primary + "50",
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-foreground font-bold text-sm">{item.title}</Text>
                      <Text className="text-muted text-[10px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {item.content && (
                      <Text className="text-muted text-xs leading-relaxed">{item.content}</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
