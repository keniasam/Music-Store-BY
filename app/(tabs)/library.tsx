import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Image } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useAudioPlayer, type PlayableTrack } from "@/lib/audio-player-context";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatNumber, APP_CONFIG } from "@/shared/config";

type LibraryTab = "uploads" | "purchases" | "downloads" | "liked";

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, playTrack, togglePlayPause, isOfflineSaved, saveTrackOffline } = useAudioPlayer();
  const [activeTab, setActiveTab] = useState<LibraryTab>("uploads");

  const tabs: { id: LibraryTab; label: string; icon: any }[] = [
    { id: "uploads", label: "Uploads", icon: "arrow.up.circle.fill" },
    { id: "purchases", label: "Purchases", icon: "banknote.fill" },
    { id: "downloads", label: "Downloads", icon: "arrow.down.circle.fill" },
    { id: "liked", label: "Liked", icon: "heart.fill" },
  ];

  // Queries
  const { data: userTracks, isLoading: isTracksLoading } = trpc.tracks.getUserTracks.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: userPurchases, isLoading: isPurchasesLoading } = trpc.purchases.getUserPurchases.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: userDownloads, isLoading: isDownloadsLoading } = trpc.downloads.getUserDownloads.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: userLikes, isLoading: isLikesLoading } = trpc.likes.getUserLikes.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const isPremium = user?.subscriptionTier === "premium";
  const downloadsRemaining = isPremium ? -1 : Math.max(0, APP_CONFIG.freeDownloadLimit - (user?.downloadCount || 0));

  const handlePlay = (track: any, list?: any[]) => {
    if (!track.audioUrl) return;
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      const toItem = (t: any): PlayableTrack => ({
        id: t.id,
        title: t.title,
        artist: t.artist || "My Song",
        genre: t.genre,
        duration: t.duration,
        audioUrl: t.audioUrl,
        coverUrl: t.coverUrl,
        price: t.price,
        isFree: t.isFree,
        masteringPreset: t.masteringPreset,
        masteringLevel: t.masteringLevel,
      });
      const queueList = list ? list.filter((t) => !!t?.audioUrl).map(toItem) : undefined;
      playTrack(toItem(track), queueList);
    }
  };

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
          Log in to access your uploads, purchases, downloads, and liked tracks
        </Text>
        <TouchableOpacity 
          className="px-8 py-3.5 rounded-full"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/login")}
        >
          <Text className="text-white font-semibold text-base">Login to Bilong Yumi</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">Library</Text>
        <Text className="text-muted">Your music collection & creations</Text>
      </View>

      {/* Tab Bar */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 mt-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            className="flex-row items-center px-4 py-2 rounded-full border"
            style={{ 
              backgroundColor: activeTab === tab.id ? colors.primary : colors.surface,
              borderColor: activeTab === tab.id ? colors.primary : colors.border,
            }}
            onPress={() => setActiveTab(tab.id)}
          >
            <IconSymbol 
              name={tab.icon} 
              size={16} 
              color={activeTab === tab.id ? '#fff' : colors.muted} 
            />
            <Text 
              className="ml-2 font-semibold text-xs"
              style={{ color: activeTab === tab.id ? '#fff' : colors.foreground }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Downloads Status */}
      {activeTab === "downloads" && (
        <View className="mx-4 mt-4 p-3 rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground font-semibold text-sm">Downloads Quota</Text>
            {isPremium ? (
              <View className="flex-row items-center">
                <IconSymbol name="crown.fill" size={16} color={colors.gold} />
                <Text className="text-gold ml-1 font-semibold text-xs">Unlimited</Text>
              </View>
            ) : (
              <Text className="text-muted text-xs">
                {downloadsRemaining} of {APP_CONFIG.freeDownloadLimit} remaining
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 14 }}
      >
        {/* Uploads Tab */}
        {activeTab === "uploads" && (
          <View className="px-4">
            {isTracksLoading ? (
              <ActivityIndicator color={colors.primary} className="my-8" />
            ) : !userTracks || userTracks.length === 0 ? (
              <View className="items-center py-12">
                <IconSymbol name="music.note" size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4">No uploads yet</Text>
                <Text className="text-muted text-xs text-center mt-1">
                  Start sharing your music with PNG fans
                </Text>
                <TouchableOpacity 
                  className="mt-4 px-6 py-2.5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => router.push("/(tabs)/create")}
                >
                  <Text className="text-white font-semibold text-sm">Upload Music</Text>
                </TouchableOpacity>
              </View>
            ) : (
              userTracks.map((track) => (
                <View 
                  key={track.id}
                  className="flex-row items-center py-3 border-b"
                  style={{ borderBottomColor: colors.border }}
                >
                  <TouchableOpacity 
                    onPress={() => router.push(`/track/${track.id}` as any)}
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <IconSymbol name="music.note" size={22} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => router.push(`/track/${track.id}` as any)}
                    className="flex-1 mr-2"
                  >
                    <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
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
                          className="text-[10px] font-bold"
                          style={{ color: track.status === "published" ? colors.success : colors.warning }}
                        >
                          {track.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text className="text-muted text-xs">{formatNumber(track.playCount)} plays</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handlePlay(track, userTracks)}
                    className="w-9 h-9 rounded-full items-center justify-center ml-2"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <IconSymbol 
                      name={currentTrack?.id === track.id && isPlaying ? "pause.fill" : "play.fill"} 
                      size={16} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Purchases Tab */}
        {activeTab === "purchases" && (
          <View className="px-4">
            {isPurchasesLoading ? (
              <ActivityIndicator color={colors.primary} className="my-8" />
            ) : !userPurchases || userPurchases.length === 0 ? (
              <View className="items-center py-12">
                <IconSymbol name="banknote.fill" size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4">No purchases yet</Text>
                <Text className="text-muted text-xs text-center mt-1">
                  Discover and support great PNG music
                </Text>
                <TouchableOpacity 
                  className="mt-4 px-6 py-2.5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => router.push("/(tabs)/discover")}
                >
                  <Text className="text-white font-semibold text-sm">Discover Music</Text>
                </TouchableOpacity>
              </View>
            ) : (
              userPurchases.map((purchase) => (
                <View 
                  key={purchase.id}
                  className="flex-row items-center py-3 border-b"
                  style={{ borderBottomColor: colors.border }}
                >
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: colors.gold + '20' }}
                  >
                    <IconSymbol name="banknote.fill" size={20} color={colors.gold} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
                      Purchase #{purchase.id}
                    </Text>
                    <Text className="text-muted text-xs">
                      Paid: {formatCurrency(purchase.amount)} via {purchase.paymentMethod}
                    </Text>
                    <Text className="text-muted text-[10px] mt-0.5">
                      {new Date(purchase.createdAt).toLocaleDateString()} • {purchase.paymentStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Downloads Tab */}
        {activeTab === "downloads" && (
          <View className="px-4">
            {isDownloadsLoading ? (
              <ActivityIndicator color={colors.primary} className="my-8" />
            ) : !userDownloads || userDownloads.length === 0 ? (
              <View className="items-center py-12">
                <IconSymbol name="arrow.down.circle.fill" size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4">No downloads yet</Text>
                <Text className="text-muted text-xs text-center mt-1">
                  Download free or purchased tracks to listen offline
                </Text>
              </View>
            ) : (
              userDownloads.map((download) => {
                const trk = (download as any).track;
                const isCached = isOfflineSaved(download.trackId || 0);
                return (
                  <View 
                    key={download.id}
                    className="flex-row items-center py-3 border-b"
                    style={{ borderBottomColor: colors.border }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        const downloadTracks = (userDownloads || []).map((d) => (d as any).track).filter(Boolean);
                        if (trk) handlePlay(trk, downloadTracks);
                      }}
                      className="w-12 h-12 rounded-xl items-center justify-center mr-3 overflow-hidden shadow-sm"
                      style={{ backgroundColor: colors.surface }}
                    >
                      {trk?.coverUrl ? (
                        <Image source={{ uri: trk.coverUrl }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <IconSymbol
                          name={currentTrack?.id === download.trackId && isPlaying ? "pause.fill" : "play.fill"}
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                    <View className="flex-1 mr-2">
                      <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
                        {trk?.title || `Downloaded Track #${download.trackId}`}
                      </Text>
                      <View className="flex-row items-center mt-0.5 gap-2">
                        {isCached && (
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: colors.success + "25" }}
                          >
                            <Text
                              className="text-[10px] font-bold"
                              style={{ color: colors.success }}
                            >
                              Offline Ready
                            </Text>
                          </View>
                        )}
                        <Text className="text-muted text-xs" numberOfLines={1}>
                          {trk?.genre ? `${trk.genre} • ` : ""}
                          {new Date(download.downloadedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {download.trackId && (
                        <TouchableOpacity 
                          onPress={() => router.push(`/track/${download.trackId}` as any)}
                          className="px-3 py-1.5 rounded-full border"
                          style={{ borderColor: colors.border, backgroundColor: colors.surface }}
                        >
                          <Text className="text-foreground text-xs font-semibold">Details</Text>
                        </TouchableOpacity>
                      )}
                      {trk && !isCached && (
                        <TouchableOpacity
                          onPress={async () => {
                            await saveTrackOffline({
                              id: trk.id,
                              title: trk.title,
                              artist: trk.artist || "PNG Artist",
                              genre: trk.genre,
                              duration: trk.duration,
                              audioUrl: trk.audioUrl,
                              coverUrl: trk.coverUrl,
                              price: trk.price,
                              isFree: trk.isFree,
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-full"
                          style={{ backgroundColor: colors.primary + "18" }}
                        >
                          <IconSymbol name="arrow.down.circle.fill" size={16} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Liked Tab */}
        {activeTab === "liked" && (
          <View className="px-4">
            {isLikesLoading ? (
              <ActivityIndicator color={colors.primary} className="my-8" />
            ) : !userLikes || userLikes.length === 0 ? (
              <View className="items-center py-12">
                <IconSymbol name="heart.fill" size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4">No liked tracks</Text>
                <Text className="text-muted text-xs text-center mt-1">
                  Like tracks on Home or Discover to save them here
                </Text>
              </View>
            ) : (
              userLikes.map((track) => (
                <TouchableOpacity 
                  key={track.id}
                  className="flex-row items-center py-3 border-b"
                  style={{ borderBottomColor: colors.border }}
                  onPress={() => router.push(`/track/${track.id}` as any)}
                >
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <IconSymbol name="music.note" size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1 mr-2">
                    <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text className="text-muted text-xs mt-0.5">
                      {track.genre || "PNG Music"} • {formatNumber(track.playCount)} plays
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handlePlay(track, userLikes)}
                    className="w-9 h-9 rounded-full items-center justify-center ml-2"
                    style={{ backgroundColor: colors.primary + '20' }}
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
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
