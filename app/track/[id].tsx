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
  Modal,
  Linking,
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
    queue,
    isPlaying,
    position,
    duration,
    playTrack,
    playNext,
    playPrevious,
    togglePlayPause,
    seekTo,
    saveTrackOffline,
    isOfflineSaved,
    activeMasteringPreset,
  } = useAudioPlayer();

  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Mobile Banking Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<"bsp" | "cellmoni">("bsp");
  const [transactionRef, setTransactionRef] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [activePurchaseId, setActivePurchaseId] = useState<number | null>(null);

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

  const { data: hasPurchased, refetch: refetchPurchased } =
    trpc.purchases.hasPurchased.useQuery(
      { trackId },
      { enabled: isAuthenticated && !!trackId }
    );

  const toggleLikeMutation = trpc.likes.toggle.useMutation();
  const createCommentMutation = trpc.comments.create.useMutation();
  const createDownloadMutation = trpc.downloads.create.useMutation();
  const createPurchaseMutation = trpc.purchases.create.useMutation();
  const verifyPaymentMutation = trpc.purchases.verifyPayment.useMutation();
  const incrementPlayMutation = trpc.tracks.incrementPlay.useMutation();

  const isCurrentPlayingTrack = currentTrack?.id === trackId;
  const activePosition = isCurrentPlayingTrack ? position : 0;
  const activeDuration = isCurrentPlayingTrack
    ? duration || track?.duration || 0
    : track?.duration || 0;

  const isUnlocked = track?.isFree || hasPurchased;
  const isOffline = isOfflineSaved(trackId);

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
        masteringPreset: track.masteringPreset,
        masteringLevel: track.masteringLevel,
      });
      incrementPlayMutation.mutate({ id: track.id });
    }
  };

  const handleDialUssd = async () => {
    const ussdCode = selectedBank === "bsp" ? "*131#" : "*888#";
    const dialUri = selectedBank === "bsp" ? "tel:*131%23" : "tel:*888%23";
    try {
      await Linking.openURL(dialUri);
    } catch {
      Alert.alert("Dial USSD Code", `Please dial ${ussdCode} on your mobile phone keypad to complete payment.`);
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

    if (isUnlocked) {
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
      // Open Mobile Banking modal
      try {
        const order = await createPurchaseMutation.mutateAsync({
          trackId,
          paymentMethod: selectedBank === "bsp" ? "bsp_mobile" : "cellmoni",
        });
        setActivePurchaseId(order.purchaseId);
        setShowPaymentModal(true);
      } catch (err: any) {
        Alert.alert("Order Error", err.message || "Could not create payment order");
      }
    }
  };

  const handleVerifyPayment = async () => {
    if (!transactionRef.trim()) {
      Alert.alert("Reference Required", "Please enter the transaction reference from your SMS confirmation.");
      return;
    }
    if (!activePurchaseId) {
      Alert.alert("Error", "No pending purchase found. Please try again.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyPaymentMutation.mutateAsync({
        purchaseId: activePurchaseId,
        transactionReference: transactionRef.trim(),
        paymentMethod: selectedBank === "bsp" ? "bsp_mobile" : "cellmoni",
      });
      setShowPaymentModal(false);
      setTransactionRef("");
      refetchPurchased();
      refetchTrack();
      Alert.alert(
        "Payment Confirmed!",
        `"${track?.title}" has been verified and permanently unlocked in your library.`
      );
    } catch (err: any) {
      Alert.alert("Verification Error", err.message || "Verification failed. Check your reference number.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOfflineSave = async () => {
    if (!track) return;
    const ok = await saveTrackOffline({
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
    if (ok) {
      Alert.alert("Offline Ready", `"${track.title}" is saved for offline listening on this device.`);
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

  const waveformBars: number[] = (track as any)?.waveform || [
    0.35, 0.45, 0.65, 0.82, 0.95, 0.76, 0.52, 0.68, 0.85, 0.91, 0.78, 0.58,
    0.42, 0.63, 0.81, 0.72, 0.94, 0.96, 0.86, 0.67, 0.54, 0.73, 0.87, 0.92,
    0.64, 0.48, 0.57, 0.77, 0.89, 0.95, 0.92, 0.74, 0.61, 0.83, 0.88, 0.68,
    0.53, 0.44, 0.62, 0.78, 0.93, 0.87, 0.72, 0.58, 0.66, 0.84, 0.91, 0.79,
    0.63, 0.47, 0.38, 0.52, 0.67, 0.82, 0.73, 0.57, 0.43, 0.36, 0.28, 0.22,
  ];

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
          <View className="flex-row items-center mt-3 gap-2 flex-wrap">
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
            {isUnlocked && (
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.success + "20" }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.success }}
                >
                  {track.isFree ? "Free Track" : "Purchased"}
                </Text>
              </View>
            )}
            {isOffline && (
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.success + "20" }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.success }}
                >
                  Saved Offline
                </Text>
              </View>
            )}
            {(track.masteringPreset || (isCurrentPlayingTrack && activeMasteringPreset !== "balanced")) && (
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.gold + "20" }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.gold }}
                >
                  DSP: {track.masteringPreset || activeMasteringPreset}
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

        {/* Interactive Waveform Scrubber */}
        <View className="px-6 mt-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-muted text-xs font-medium">Waveform Scrubber (Tap to Seek)</Text>
            <Text className="text-muted text-xs font-semibold">
              {formatTime(activePosition)} / {formatTime(activeDuration)}
            </Text>
          </View>

          <View
            className="h-16 flex-row items-end justify-between py-2 px-2 rounded-2xl border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            {waveformBars.map((val, idx) => {
              const barFraction = idx / waveformBars.length;
              const isPast =
                activeDuration > 0 &&
                activePosition / activeDuration >= barFraction;
              const barHeight = Math.max(8, Math.round(val * 44));

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    if (activeDuration > 0) {
                      seekTo(Math.round(barFraction * activeDuration));
                    }
                  }}
                  className="flex-1 items-center justify-end h-full"
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      height: barHeight,
                      width: "60%",
                      maxWidth: 4,
                      minWidth: 2,
                      borderRadius: 2,
                      backgroundColor: isPast ? colors.primary : colors.border,
                    }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Playback Controls */}
        <View className="flex-row items-center justify-center mt-4 gap-4">
          {queue.length > 1 && (
            <TouchableOpacity
              onPress={playPrevious}
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol name="backward.fill" size={20} color={colors.foreground} />
            </TouchableOpacity>
          )}

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

          {queue.length > 1 && (
            <TouchableOpacity
              onPress={playNext}
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol name="forward.fill" size={20} color={colors.foreground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Button: Download or Buy */}
        <View className="px-6 mt-8">
          <TouchableOpacity
            className="py-4 rounded-2xl items-center shadow-md flex-row justify-center"
            style={{
              backgroundColor: isUnlocked ? colors.success : colors.primary,
            }}
            onPress={handleDownloadOrBuy}
          >
            <IconSymbol
              name={isUnlocked ? "arrow.down.circle.fill" : "banknote.fill"}
              size={22}
              color="#fff"
            />
            <Text className="text-white font-bold text-lg ml-2">
              {isUnlocked
                ? "Download to Library"
                : `Buy Track • ${formatCurrency(track.price)}`}
            </Text>
          </TouchableOpacity>

          {/* Offline Save Button for Unlocked Tracks */}
          {isUnlocked && (
            <TouchableOpacity
              onPress={handleOfflineSave}
              className="mt-3 py-3 rounded-2xl items-center border flex-row justify-center"
              style={{
                borderColor: isOffline ? colors.success : colors.border,
                backgroundColor: isOffline ? colors.success + "15" : colors.surface,
              }}
            >
              <IconSymbol
                name={isOffline ? "checkmark.circle.fill" : "arrow.down.circle.fill"}
                size={18}
                color={isOffline ? colors.success : colors.foreground}
              />
              <Text
                className="font-semibold text-sm ml-2"
                style={{ color: isOffline ? colors.success : colors.foreground }}
              >
                {isOffline ? "Saved for Offline Playback" : "Save for Offline Listening"}
              </Text>
            </TouchableOpacity>
          )}
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

      {/* Mobile Banking Verification Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View
            className="p-6 rounded-t-3xl border-t shadow-2xl max-h-[85%]"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between pb-3 border-b" style={{ borderBottomColor: colors.border }}>
              <View>
                <Text className="text-xl font-bold text-foreground">
                  PNG Mobile Banking
                </Text>
                <Text className="text-muted text-xs mt-0.5">
                  Order #{activePurchaseId} • {formatCurrency(track.price)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-foreground font-bold">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Bank Selector */}
            <View className="flex-row mt-4 gap-3">
              <TouchableOpacity
                onPress={() => setSelectedBank("bsp")}
                className="flex-1 py-3 px-3 rounded-xl border items-center"
                style={{
                  backgroundColor: selectedBank === "bsp" ? colors.primary + "20" : colors.surface,
                  borderColor: selectedBank === "bsp" ? colors.primary : colors.border,
                }}
              >
                <Text className="font-bold text-sm" style={{ color: selectedBank === "bsp" ? colors.primary : colors.foreground }}>
                  BSP Mobile (*131#)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedBank("cellmoni")}
                className="flex-1 py-3 px-3 rounded-xl border items-center"
                style={{
                  backgroundColor: selectedBank === "cellmoni" ? colors.primary + "20" : colors.surface,
                  borderColor: selectedBank === "cellmoni" ? colors.primary : colors.border,
                }}
              >
                <Text className="font-bold text-sm" style={{ color: selectedBank === "cellmoni" ? colors.primary : colors.foreground }}>
                  CellMoni (*888#)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Payment Details */}
            <View className="mt-4 p-4 rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              {selectedBank === "bsp" ? (
                <>
                  <Text className="text-foreground font-bold text-sm mb-1">BSP Mobile Banking Instructions:</Text>
                  <Text className="text-muted text-xs leading-relaxed">
                    1. Dial <Text className="text-foreground font-bold">*131#</Text> on your phone{"\n"}
                    2. Select Transfer &gt; BSP to BSP{"\n"}
                    3. Account Number: <Text className="text-foreground font-bold">1002938472</Text> (Bilong Yumi Ltd){"\n"}
                    4. Amount: <Text className="text-foreground font-bold">{formatCurrency(track.price)}</Text>{"\n"}
                    5. Description: <Text className="text-foreground font-bold">TRK-{track.id}</Text>
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-foreground font-bold text-sm mb-1">Digicel CellMoni Instructions:</Text>
                  <Text className="text-muted text-xs leading-relaxed">
                    1. Dial <Text className="text-foreground font-bold">*888#</Text> on your phone{"\n"}
                    2. Select Send Money &gt; Mobile / Merchant{"\n"}
                    3. Mobile Number: <Text className="text-foreground font-bold">71234567</Text>{"\n"}
                    4. Amount: <Text className="text-foreground font-bold">{formatCurrency(track.price)}</Text>{"\n"}
                    5. Reference: <Text className="text-foreground font-bold">TRK-{track.id}</Text>
                  </Text>
                </>
              )}

              <TouchableOpacity
                onPress={handleDialUssd}
                className="mt-3 py-2.5 px-4 rounded-xl flex-row items-center justify-center border"
                style={{ backgroundColor: colors.primary + "18", borderColor: colors.primary }}
              >
                <IconSymbol name="phone.fill" size={16} color={colors.primary} />
                <Text className="font-bold text-xs ml-2" style={{ color: colors.primary }}>
                  {selectedBank === "bsp" ? "Dial *131# on Phone" : "Dial *888# on Phone"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Reference */}
            <View className="mt-4">
              <Text className="text-foreground font-semibold text-xs mb-1.5">
                SMS Transaction Receipt / Reference Code:
              </Text>
              <TextInput
                className="px-4 py-3 rounded-xl border text-foreground"
                placeholder="e.g. BSP-928174 or CM-829103"
                placeholderTextColor={colors.muted}
                value={transactionRef}
                onChangeText={setTransactionRef}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleVerifyPayment}
              disabled={isVerifying}
              className="mt-6 py-4 rounded-2xl items-center justify-center flex-row shadow-lg"
              style={{ backgroundColor: colors.primary }}
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                  <Text className="text-white font-bold text-base ml-2">
                    Verify & Unlock Track
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
