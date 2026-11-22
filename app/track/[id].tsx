import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useAudioPlayer } from "@/lib/audio-player-context";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatNumber } from "@/shared/config";

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function TrackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trackId = Number(id);
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    playTrack,
    togglePlayPause,
    seekTo,
  } = useAudioPlayer();

  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Queries & Mutations
  const { data: track, isLoading: isTrackLoading, refetch: refetchTrack } =
    trpc.tracks.getById.useQuery({ id: trackId });

  const { data: comments, refetch: refetchComments } =
    trpc.comments.getTrackComments.useQuery({ trackId });

  const { data: hasLiked, refetch: refetchLiked } =
    trpc.likes.hasLiked.useQuery(
      { trackId },
      { enabled: isAuthenticated && !!trackId }
    );

  const toggleLikeMutation = trpc.likes.toggle.useMutation();
  const createCommentMutation = trpc.comments.create.useMutation();
  const createDownloadMutation = trpc.downloads.create.useMutation();
  const createPurchaseMutation = trpc.purchases.create.useMutation();
  const incrementPlayMutation = trpc.tracks.incrementPlay.useMutation();

  const isCurrentPlayingTrack = currentTrack?.id === trackId;
  const activePosition = isCurrentPlayingTrack ? position : 0;
  const activeDuration = isCurrentPlayingTrack
    ? duration || track?.duration || 0
    : track?.duration || 0;

  const handlePlay = async () => {
    if (!track) return;
    if (isCurrentPlayingTrack) {
      togglePlayPause();
    } else {
      await playTrack({
        id: track.id,
        title: track.title,
        artist: "PNG Artist",
        genre: track.genre,
        duration: track.duration,
        audioUrl: track.audioUrl,
        coverUrl: track.coverUrl,
        price: track.price,
        isFree: track.isFree,
      });
      incrementPlayMutation.mutate({ id: track.id });
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please log in to like this track", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/login") },
      ]);
      return;
    }
    try {
      await toggleLikeMutation.mutateAsync({ trackId });
      refetchLiked();
      refetchTrack();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update like");
    }
  };

  const handleCommentSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please log in to leave a comment", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/login") },
      ]);
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await createCommentMutation.mutateAsync({
        trackId,
        content: commentText.trim(),
      });
      setCommentText("");
      refetchComments();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDownloadOrBuy = async () => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please log in to access this track", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/login") },
      ]);
      return;
    }

    if (track?.isFree) {
      try {
        const res = await createDownloadMutation.mutateAsync({ trackId });
        Alert.alert(
          "Download Started",
          `Track downloaded to your library! Stream URL: ${res.url || "ready"}`
        );
      } catch (err: any) {
        Alert.alert("Download Error", err.message || "Failed to download track");
      }
    } else {
      Alert.alert(
        "Purchase Track",
        `Would you like to buy "${track?.title}" for ${formatCurrency(track?.price || "0.00")}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Pay with Phone Banking",
            onPress: async () => {
              try {
                const res = await createPurchaseMutation.mutateAsync({
                  trackId,
                  paymentMethod: "phone_banking",
                });
                Alert.alert(
                  "Order Placed",
                  `Purchase ID #${res.purchaseId} created. Please complete payment using your BSP or Digicel mobile banking.`
                );
              } catch (err: any) {
                Alert.alert("Purchase Error", err.message || "Failed to initiate purchase");
              }
            },
          },
        ]
      );
    }
  };

  const handleShare = async () => {
    if (!track) return;
    try {
      await Share.share({
        message: `Listen to "${track.title}" on Music Store Bilong Yumi! 🎵🇵🇬`,
      });
    } catch {
      // ignore
    }
  };

  if (isTrackLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading track...</Text>
      </ScreenContainer>
    );
  }

  if (!track) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <IconSymbol name="music.note" size={48} color={colors.muted} />
        <Text className="text-xl font-bold text-foreground mt-4">Track Not Found</Text>
        <TouchableOpacity
          className="mt-6 px-6 py-3 rounded-full"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const progressPercent =
    activeDuration > 0
      ? Math.min(100, Math.max(0, (activePosition / activeDuration) * 100))
      : 0;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Navigation Bar */}
        <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-foreground font-semibold text-base">
            Now Playing
          </Text>
          <TouchableOpacity onPress={handleShare} className="p-2">
            <IconSymbol name="arrow.up.circle.fill" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Artwork Banner */}
        <View className="px-6 mt-4 items-center">
          <View
            className="w-full aspect-square max-w-sm rounded-3xl items-center justify-center overflow-hidden shadow-2xl border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            {track.coverUrl ? (
              <Image
                source={{ uri: track.coverUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View
                className="w-full h-full items-center justify-center"
                style={{ backgroundColor: colors.primary + "18" }}
              >
                <IconSymbol name="music.note" size={96} color={colors.primary} />
                <Text
                  className="mt-4 font-bold tracking-widest text-xs uppercase"
                  style={{ color: colors.primary }}
                >
                  PNG Original
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Track Info */}
        <View className="px-6 mt-6">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-2xl font-bold text-foreground">
                {track.title}
              </Text>
              <Text className="text-muted text-base mt-1">
                PNG Artist • {track.genre || "Music"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLike} className="p-2">
              <IconSymbol
                name="heart.fill"
                size={28}
                color={hasLiked ? colors.error : colors.muted}
              />
            </TouchableOpacity>
          </View>

          {/* Badges / Stats */}
          <View className="flex-row items-center mt-3 gap-2">
            {track.genre && (
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.primary + "20" }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.primary }}
                >
                  {track.genre}
                </Text>
              </View>
            )}
            {track.masteringPreset && (
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.gold + "20" }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.gold }}
                >
                  Mastered: {track.masteringPreset}
                </Text>
              </View>
            )}
            <View className="flex-row items-center ml-auto">
              <IconSymbol name="play.fill" size={14} color={colors.muted} />
              <Text className="text-muted text-xs ml-1">
                {formatNumber(track.playCount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar & Scrubber */}
        <View className="px-6 mt-6">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={(e) => {
              if (activeDuration <= 0) return;
              const { locationX } = e.nativeEvent;
              // Approximate width calculation
              const width = 320;
              const ratio = Math.max(0, Math.min(1, locationX / width));
              seekTo(Math.round(ratio * activeDuration));
            }}
            className="h-6 justify-center"
          >
            <View
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: colors.border }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  width: `${progressPercent}%`,
                }}
              />
            </View>
          </TouchableOpacity>

          <View className="flex-row justify-between mt-1">
            <Text className="text-muted text-xs">
              {formatTime(activePosition)}
            </Text>
            <Text className="text-muted text-xs">
              {formatTime(activeDuration)}
            </Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View className="flex-row items-center justify-center mt-4 gap-6">
          <TouchableOpacity
            onPress={() => seekTo(Math.max(0, activePosition - 15))}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.surface }}
          >
            <IconSymbol name="arrow.counterclockwise" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlay}
            className="w-20 h-20 rounded-full items-center justify-center shadow-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <IconSymbol
              name={isCurrentPlayingTrack && isPlaying ? "pause.fill" : "play.fill"}
              size={36}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => seekTo(Math.min(activeDuration, activePosition + 15))}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.surface }}
          >
            <IconSymbol name="arrow.clockwise" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Action Button: Download or Buy */}
        <View className="px-6 mt-8">
          <TouchableOpacity
            className="py-4 rounded-2xl items-center shadow-md flex-row justify-center"
            style={{
              backgroundColor: track.isFree ? colors.success : colors.primary,
            }}
            onPress={handleDownloadOrBuy}
          >
            <IconSymbol
              name={track.isFree ? "arrow.down.circle.fill" : "banknote.fill"}
              size={22}
              color="#fff"
            />
            <Text className="text-white font-bold text-lg ml-2">
              {track.isFree
                ? "Free Download"
                : `Buy Track • ${formatCurrency(track.price)}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {track.description && (
          <View className="px-6 mt-6">
            <Text className="text-foreground font-bold text-base mb-2">
              About This Song
            </Text>
            <View
              className="p-4 rounded-2xl"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-muted leading-relaxed">
                {track.description}
              </Text>
            </View>
          </View>
        )}

        {/* Comments Section */}
        <View className="px-6 mt-8">
          <Text className="text-foreground font-bold text-lg mb-3">
            Comments ({comments?.length || 0})
          </Text>

          {/* Add Comment Input */}
          <View
            className="flex-row items-center p-2 rounded-2xl mb-4 border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <TextInput
              className="flex-1 px-3 py-2 text-foreground"
              placeholder="Leave a comment for the artist..."
              placeholderTextColor={colors.muted}
              value={commentText}
              onChangeText={setCommentText}
              style={{ color: colors.foreground }}
            />
            <TouchableOpacity
              onPress={handleCommentSubmit}
              disabled={isSubmittingComment || !commentText.trim()}
              className="px-4 py-2 rounded-xl items-center justify-center"
              style={{
                backgroundColor:
                  commentText.trim() ? colors.primary : colors.muted,
              }}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-sm">Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Comment List */}
          {comments && comments.length > 0 ? (
            comments.map((c) => (
              <View
                key={c.id}
                className="p-3.5 rounded-xl mb-2.5"
                style={{ backgroundColor: colors.surface }}
              >
                <View className="flex-row items-center mb-1">
                  <View
                    className="w-7 h-7 rounded-full items-center justify-center mr-2"
                    style={{ backgroundColor: colors.primary + "20" }}
                  >
                    <IconSymbol name="person.fill" size={14} color={colors.primary} />
                  </View>
                  <Text className="text-foreground font-semibold text-xs">
                    Music Supporter
                  </Text>
                  <Text className="text-muted text-xs ml-auto">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text className="text-muted text-sm ml-9">{c.content}</Text>
              </View>
            ))
          ) : (
            <Text className="text-muted text-sm italic">
              No comments yet. Be the first to share your thoughts!
            </Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
