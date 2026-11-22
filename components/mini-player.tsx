import React from "react";
import { View, Text, TouchableOpacity, Image, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAudioPlayer } from "@/lib/audio-player-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export function MiniPlayer() {
  const router = useRouter();
  const colors = useColors();
  const { currentTrack, queue, isPlaying, position, duration, togglePlayPause, playNext, playPrevious, stop } = useAudioPlayer();

  if (!currentTrack) {
    return null;
  }

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  const handleOpenTrack = () => {
    router.push(`/track/${currentTrack.id}` as any);
  };

  return (
    <View 
      className="mx-3 mb-2 rounded-2xl overflow-hidden shadow-lg border"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      {/* Progress Bar Header */}
      <View className="h-1 w-full bg-black/10 dark:bg-white/10">
        <View 
          className="h-full rounded-r-full"
          style={{ 
            backgroundColor: colors.primary, 
            width: `${progressPercent}%` 
          }} 
        />
      </View>

      <View className="flex-row items-center p-2.5">
        {/* Track Artwork / Icon */}
        <TouchableOpacity 
          onPress={handleOpenTrack}
          className="w-12 h-12 rounded-xl items-center justify-center overflow-hidden mr-3"
          style={{ backgroundColor: colors.primary + "25" }}
        >
          {currentTrack.coverUrl ? (
            <Image 
              source={{ uri: currentTrack.coverUrl }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <IconSymbol name="music.note" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* Track Title and Artist */}
        <TouchableOpacity 
          onPress={handleOpenTrack}
          className="flex-1 mr-2"
        >
          <Text 
            className="text-foreground font-bold text-sm" 
            numberOfLines={1}
          >
            {currentTrack.title}
          </Text>
          <Text 
            className="text-muted text-xs mt-0.5" 
            numberOfLines={1}
          >
            {currentTrack.artist || "PNG Artist"}
          </Text>
        </TouchableOpacity>

        {/* Skip Previous / Play / Skip Next */}
        {queue.length > 1 && (
          <TouchableOpacity 
            onPress={playPrevious}
            className="w-8 h-8 items-center justify-center mr-1"
          >
            <IconSymbol name="backward.fill" size={16} color={colors.foreground} />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          onPress={togglePlayPause}
          className="w-10 h-10 rounded-full items-center justify-center mr-1"
          style={{ backgroundColor: colors.primary }}
        >
          <IconSymbol 
            name={isPlaying ? "pause.fill" : "play.fill"} 
            size={18} 
            color="#fff" 
          />
        </TouchableOpacity>

        {queue.length > 1 && (
          <TouchableOpacity 
            onPress={playNext}
            className="w-8 h-8 items-center justify-center mr-1"
          >
            <IconSymbol name="forward.fill" size={16} color={colors.foreground} />
          </TouchableOpacity>
        )}

        {/* Dismiss / Stop Button */}
        <TouchableOpacity 
          onPress={stop}
          className="w-8 h-8 items-center justify-center p-1"
        >
          <IconSymbol name="xmark" size={16} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
