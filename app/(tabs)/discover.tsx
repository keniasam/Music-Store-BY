import { ScrollView, Text, View, TouchableOpacity, TextInput, Image, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAudioPlayer, type PlayableTrack } from "@/lib/audio-player-context";
import { trpc } from "@/lib/trpc";
import {
  GENRES,
  PNG_REGIONS,
  type PngRegionId,
  getTrackRegion,
  formatCurrency,
  formatNumber,
} from "@/shared/config";

// Featured PNG Artists
const ARTISTS = [
  { id: 1, name: "Justin Wellington", followers: 45000, genre: "Reggae / Island" },
  { id: 2, name: "Avii", followers: 28000, genre: "Island Soul" },
  { id: 3, name: "Mountain Voice", followers: 18500, genre: "Traditional Stringband" },
  { id: 4, name: "Coastal Crew", followers: 15200, genre: "Hip Hop" },
];

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

export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<PngRegionId>("All");

  // Queries
  const { data: searchResults, isLoading: isSearchLoading } = trpc.tracks.search.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.trim().length > 0 }
  );

  const { data: genreResults, isLoading: isGenreLoading } = trpc.tracks.getByGenre.useQuery(
    { genre: selectedGenre || "", limit: 20 },
    { enabled: !searchQuery.trim() && !!selectedGenre }
  );

  const { data: trendingTracks, isLoading: isTrendingLoading } = trpc.tracks.getTrending.useQuery(
    { limit: 20 },
    { enabled: !searchQuery.trim() && !selectedGenre }
  );

  const baseTracks = searchQuery.trim().length > 0
    ? (searchResults || [])
    : (selectedGenre ? (genreResults || []) : (trendingTracks || []));

  const tracksToDisplay = selectedRegion === "All"
    ? baseTracks
    : baseTracks.filter((track) => getTrackRegion(track) === selectedRegion);

  const isLoading = isSearchLoading || isGenreLoading || isTrendingLoading;

  const handlePlayTrack = (track: any) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      const queueList = tracksToDisplay.filter((t) => !!t.audioUrl).map(toPlayable);
      playTrack(toPlayable(track), queueList);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground">Discover</Text>
          <Text className="text-muted">Explore the sounds of Papua New Guinea</Text>
        </View>

        {/* Search Bar */}
        <View className="px-4 mt-4">
          <View
            className="flex-row items-center px-4 py-3 rounded-2xl border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
            <TextInput
              className="flex-1 ml-3 text-foreground"
              placeholder="Search songs, artists, genres..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              style={{ color: colors.foreground }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <IconSymbol name="xmark" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* PNG Regions Filter */}
        <View className="mt-4">
          <Text className="px-4 text-xs font-bold text-muted mb-2 tracking-wider">PNG REGIONS &amp; PROVINCES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {PNG_REGIONS.map((region) => (
              <TouchableOpacity
                key={region.id}
                className="px-3.5 py-1.5 rounded-full border"
                style={{
                  borderColor: selectedRegion === region.id ? colors.gold : colors.border,
                  backgroundColor: selectedRegion === region.id ? colors.gold + "25" : colors.surface,
                }}
                onPress={() => setSelectedRegion(region.id)}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: selectedRegion === region.id ? colors.gold : colors.foreground }}
                >
                  {region.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Genre Filter */}
        <View className="mt-4">
          <Text className="px-4 text-xs font-bold text-muted mb-2 tracking-wider">GENRES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            <TouchableOpacity
              className="px-3.5 py-1.5 rounded-full border"
              style={{
                borderColor: !selectedGenre ? colors.primary : colors.border,
                backgroundColor: !selectedGenre ? colors.primary : colors.surface,
              }}
              onPress={() => setSelectedGenre(null)}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: !selectedGenre ? "#fff" : colors.muted }}
              >
                All Genres
              </Text>
            </TouchableOpacity>
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre}
                className="px-3.5 py-1.5 rounded-full border"
                style={{
                  borderColor: selectedGenre === genre ? colors.primary : colors.border,
                  backgroundColor: selectedGenre === genre ? colors.primary : colors.surface,
                }}
                onPress={() => setSelectedGenre(genre)}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: selectedGenre === genre ? "#fff" : colors.foreground }}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular PNG Artists */}
        {!searchQuery.trim() && (
          <View className="mt-6">
            <View className="px-4 flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground">Featured PNG Artists</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {ARTISTS.map((artist) => (
                <TouchableOpacity
                  key={artist.id}
                  className="items-center p-3 rounded-2xl border"
                  style={{ width: 120, backgroundColor: colors.surface, borderColor: colors.border }}
                  onPress={() => setSearchQuery(artist.name)}
                >
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: colors.primary + "20" }}
                  >
                    <IconSymbol name="person.fill" size={28} color={colors.primary} />
                  </View>
                  <Text className="text-foreground font-bold text-xs text-center" numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text className="text-muted text-[10px] text-center mt-0.5" numberOfLines={1}>
                    {artist.genre}
                  </Text>
                  <Text className="text-primary text-[10px] font-semibold mt-1">
                    {formatNumber(artist.followers)} fans
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tracks List */}
        <View className="mt-6 px-4">
          <Text className="text-lg font-bold text-foreground mb-3">
            {searchQuery.trim()
              ? `Results for "${searchQuery}" (${tracksToDisplay.length})`
              : (selectedGenre ? `${selectedGenre} Music` : "Trending Tracks") +
                (selectedRegion !== "All" ? ` • ${selectedRegion}` : "")}
          </Text>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} className="my-6" />
          ) : tracksToDisplay.length === 0 ? (
            <View className="items-center py-10">
              <IconSymbol name="magnifyingglass" size={40} color={colors.muted} />
              <Text className="text-foreground font-semibold mt-3">No tracks found</Text>
              <Text className="text-muted text-xs mt-1">Try another search term, region, or genre</Text>
            </View>
          ) : (
            tracksToDisplay.map((track) => {
              const region = getTrackRegion(track);
              return (
                <TouchableOpacity
                  key={track.id}
                  className="flex-row items-center py-3 border-b"
                  style={{ borderBottomColor: colors.border }}
                  onPress={() => router.push(`/track/${track.id}` as any)}
                >
                  <View
                    className="w-13 h-13 rounded-xl items-center justify-center mr-3 overflow-hidden"
                    style={{ backgroundColor: colors.primary + "20", width: 52, height: 52 }}
                  >
                    {track.coverUrl ? (
                      <Image source={{ uri: track.coverUrl }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <IconSymbol name="music.note" size={22} color={colors.primary} />
                    )}
                  </View>
                  <View className="flex-1 mr-2">
                    <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                      PNG Artist
                    </Text>
                    <View className="flex-row items-center mt-1 flex-wrap gap-1.5">
                      {track.genre && (
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: colors.surface }}
                        >
                          <Text className="text-muted text-[10px] font-medium">{track.genre}</Text>
                        </View>
                      )}
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: colors.gold + "18" }}
                      >
                        <Text className="text-[10px] font-semibold" style={{ color: colors.gold }}>
                          {region}
                        </Text>
                      </View>
                      <Text className="text-muted text-[10px]">{formatNumber(track.playCount)} plays</Text>
                    </View>
                  </View>
                  <View className="items-end mr-3">
                    <Text
                      className="font-bold text-xs"
                      style={{ color: track.isFree ? colors.success : colors.primary }}
                    >
                      {track.isFree ? "FREE" : formatCurrency(track.price)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handlePlayTrack(track)}
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
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
