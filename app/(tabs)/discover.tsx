import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { GENRES, formatCurrency, formatNumber } from "@/shared/config";

// Demo data
const ARTISTS = [
  { id: 1, name: "PNG Stars", followers: 12500, tracks: 24 },
  { id: 2, name: "Island Beats", followers: 8900, tracks: 18 },
  { id: 3, name: "Mountain Voice", followers: 7200, tracks: 15 },
  { id: 4, name: "Coastal Crew", followers: 6100, tracks: 12 },
];

const ALL_TRACKS = [
  { id: 1, title: "Wantok Musik", artist: "PNG Stars", genre: "Gospel", price: "5.00", isFree: false, plays: 15420 },
  { id: 2, title: "Paradise Vibes", artist: "Island Beats", genre: "Reggae", price: "0.00", isFree: true, plays: 12300 },
  { id: 3, title: "Highlands Love", artist: "Mountain Voice", genre: "Traditional", price: "3.50", isFree: false, plays: 9800 },
  { id: 4, title: "Morobe Dreams", artist: "Coastal Crew", genre: "Hip Hop", price: "4.00", isFree: false, plays: 8500 },
  { id: 5, title: "Port Moresby Nights", artist: "City Sounds", genre: "R&B", price: "0.00", isFree: true, plays: 7200 },
];

type FilterType = "all" | "songs" | "artists" | "albums" | "videos";

export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "songs", label: "Songs" },
    { id: "artists", label: "Artists" },
    { id: "albums", label: "Albums" },
    { id: "videos", label: "Videos" },
  ];

  const filteredTracks = ALL_TRACKS.filter(track => {
    const matchesSearch = searchQuery === "" || 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <ScreenContainer>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground">Discover</Text>
          <Text className="text-muted">Find your next favorite track</Text>
        </View>

        {/* Search Bar */}
        <View className="px-4 mt-4">
          <View 
            className="flex-row items-center px-4 py-3 rounded-xl"
            style={{ backgroundColor: colors.surface }}
          >
            <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
            <TextInput
              className="flex-1 ml-3 text-foreground"
              placeholder="Search songs, artists, albums..."
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

        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mt-4 px-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              className="px-4 py-2 rounded-full"
              style={{ 
                backgroundColor: activeFilter === filter.id ? colors.primary : colors.surface,
              }}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text 
                className="font-medium"
                style={{ color: activeFilter === filter.id ? '#fff' : colors.foreground }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Genre Filter */}
        <View className="mt-4">
          <Text className="px-4 text-sm font-semibold text-muted mb-2">GENRES</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            <TouchableOpacity
              className="px-3 py-1.5 rounded-full border"
              style={{ 
                borderColor: !selectedGenre ? colors.primary : colors.border,
                backgroundColor: !selectedGenre ? colors.primary + '10' : 'transparent',
              }}
              onPress={() => setSelectedGenre(null)}
            >
              <Text 
                className="text-sm"
                style={{ color: !selectedGenre ? colors.primary : colors.muted }}
              >
                All Genres
              </Text>
            </TouchableOpacity>
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre}
                className="px-3 py-1.5 rounded-full border"
                style={{ 
                  borderColor: selectedGenre === genre ? colors.primary : colors.border,
                  backgroundColor: selectedGenre === genre ? colors.primary + '10' : 'transparent',
                }}
                onPress={() => setSelectedGenre(genre)}
              >
                <Text 
                  className="text-sm"
                  style={{ color: selectedGenre === genre ? colors.primary : colors.muted }}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Artists */}
        {(activeFilter === "all" || activeFilter === "artists") && (
          <View className="mt-6">
            <View className="px-4 flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground">Popular Artists</Text>
              <TouchableOpacity>
                <Text className="text-primary font-medium">See All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {ARTISTS.map((artist) => (
                <TouchableOpacity 
                  key={artist.id}
                  className="items-center"
                  style={{ width: 100 }}
                >
                  <View 
                    className="w-20 h-20 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <IconSymbol name="person.fill" size={32} color={colors.primary} />
                  </View>
                  <Text className="text-foreground font-semibold text-sm text-center" numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text className="text-muted text-xs">
                    {formatNumber(artist.followers)} followers
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Results / All Tracks */}
        <View className="mt-6 px-4">
          <Text className="text-lg font-bold text-foreground mb-3">
            {searchQuery ? `Results for "${searchQuery}"` : "All Tracks"}
          </Text>
          
          {filteredTracks.length === 0 ? (
            <View className="items-center py-8">
              <IconSymbol name="magnifyingglass" size={48} color={colors.muted} />
              <Text className="text-muted mt-4">No tracks found</Text>
              <Text className="text-muted text-sm">Try a different search term</Text>
            </View>
          ) : (
            filteredTracks.map((track) => (
              <TouchableOpacity 
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
                  <Text className="text-muted text-sm" numberOfLines={1}>
                    {track.artist}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View 
                      className="px-2 py-0.5 rounded-full mr-2"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <Text className="text-muted text-xs">{track.genre}</Text>
                    </View>
                    <Text className="text-muted text-xs">{formatNumber(track.plays)} plays</Text>
                  </View>
                </View>
                <View className="items-end ml-2">
                  {track.isFree ? (
                    <Text className="text-success font-semibold">FREE</Text>
                  ) : (
                    <Text className="text-primary font-semibold">
                      {formatCurrency(track.price)}
                    </Text>
                  )}
                  <TouchableOpacity className="mt-1 p-1">
                    <IconSymbol name="play.fill" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
