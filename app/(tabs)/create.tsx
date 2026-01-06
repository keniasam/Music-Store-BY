import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { GENRES, MASTERING_PRESETS, MASTERING_LEVELS, APP_CONFIG } from "@/shared/config";

type CreateMode = "menu" | "ai" | "upload" | "mastering";

export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<CreateMode>("menu");
  
  // AI Creator state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenre, setAiGenre] = useState("Pop");
  const [aiDuration, setAiDuration] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Mastering state
  const [selectedPreset, setSelectedPreset] = useState("balanced");
  const [masteringLevel, setMasteringLevel] = useState("medium");
  
  const isPremium = false; // Subscription feature
  const uploadsRemaining = isPremium ? -1 : APP_CONFIG.freeUploadLimit;

  const handleAIGenerate = async () => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please login to use AI Music Creator");
      return;
    }
    if (!aiPrompt.trim()) {
      Alert.alert("Enter Prompt", "Please describe the music you want to create");
      return;
    }
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      Alert.alert("Generation Started", "Your AI music is being created. Check your library when ready.");
      setMode("menu");
    }, 2000);
  };

  const handleUpload = () => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please login to upload music");
      return;
    }
    if (uploadsRemaining === 0) {
      Alert.alert(
        "Upload Limit Reached",
        "You've used all 7 free uploads. Upgrade to Premium for unlimited uploads.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/(tabs)/profile") },
        ]
      );
      return;
    }
    Alert.alert("Upload", "File picker would open here to select audio files");
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <View 
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: colors.primary + '20' }}
        >
          <IconSymbol name="lock.fill" size={48} color={colors.primary} />
        </View>
        <Text className="text-2xl font-bold text-foreground text-center mb-2">
          Login Required
        </Text>
        <Text className="text-muted text-center mb-6">
          Create an account to upload music, use AI creator, and master your tracks
        </Text>
        <TouchableOpacity 
          className="px-8 py-3 rounded-full"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/login")}
        >
          <Text className="text-white font-semibold text-lg">Login to Create</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // Main Menu
  if (mode === "menu") {
    return (
      <ScreenContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-2">
            <Text className="text-2xl font-bold text-foreground">Create</Text>
            <Text className="text-muted">Make music, upload, and master</Text>
          </View>

          {/* Upload Status */}
          <View className="mx-4 mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-semibold">Uploads</Text>
              {isPremium ? (
                <View className="flex-row items-center">
                  <IconSymbol name="crown.fill" size={16} color={colors.gold} />
                  <Text className="text-gold ml-1 font-semibold">Unlimited</Text>
                </View>
              ) : (
                <Text className="text-muted">
                  {uploadsRemaining} of {APP_CONFIG.freeUploadLimit} remaining
                </Text>
              )}
            </View>
            {!isPremium && (
              <View className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
                <View 
                  className="h-full rounded-full"
                  style={{ 
                    backgroundColor: colors.primary,
                    width: `${(0 / APP_CONFIG.freeUploadLimit) * 100}%`
                  }}
                />
              </View>
            )}
          </View>

          {/* Create Options */}
          <View className="px-4 mt-6">
            {/* AI Music Creator */}
            <TouchableOpacity 
              className="p-4 rounded-xl mb-4"
              style={{ backgroundColor: colors.primary + '15' }}
              onPress={() => setMode("ai")}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-14 h-14 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: colors.primary }}
                >
                  <IconSymbol name="wand.and.stars" size={28} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-lg">AI Music Creator</Text>
                  <Text className="text-muted text-sm">Generate music from text prompts</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {/* Upload Music */}
            <TouchableOpacity 
              className="p-4 rounded-xl mb-4"
              style={{ backgroundColor: colors.gold + '15' }}
              onPress={() => setMode("upload")}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-14 h-14 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: colors.gold }}
                >
                  <IconSymbol name="arrow.up.circle.fill" size={28} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-lg">Upload Music</Text>
                  <Text className="text-muted text-sm">Upload audio, cover art, and videos</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {/* Mastering Studio */}
            <TouchableOpacity 
              className="p-4 rounded-xl mb-4"
              style={{ backgroundColor: colors.success + '15' }}
              onPress={() => setMode("mastering")}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-14 h-14 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: colors.success }}
                >
                  <IconSymbol name="waveform" size={28} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-lg">Mastering Studio</Text>
                  <Text className="text-muted text-sm">Professional mastering presets</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Premium Promo */}
          {!isPremium && (
            <View className="mx-4 mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.gold + '20' }}>
              <View className="flex-row items-center mb-2">
                <IconSymbol name="crown.fill" size={20} color={colors.gold} />
                <Text className="text-foreground font-bold ml-2">Go Premium</Text>
              </View>
              <Text className="text-muted text-sm mb-3">
                Unlimited uploads, all mastering presets, and more!
              </Text>
              <TouchableOpacity 
                className="py-2 px-4 rounded-full self-start"
                style={{ backgroundColor: colors.gold }}
                onPress={() => router.push("/(tabs)/profile")}
              >
                <Text className="text-white font-semibold">Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // AI Creator Mode
  if (mode === "ai") {
    return (
      <ScreenContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-2 flex-row items-center">
            <TouchableOpacity onPress={() => setMode("menu")} className="mr-3">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">AI Music Creator</Text>
              <Text className="text-muted">Describe the music you want</Text>
            </View>
          </View>

          {/* Prompt Input */}
          <View className="px-4 mt-6">
            <Text className="text-foreground font-semibold mb-2">Describe Your Music</Text>
            <TextInput
              className="p-4 rounded-xl text-foreground"
              style={{ backgroundColor: colors.surface, minHeight: 120, textAlignVertical: 'top' }}
              placeholder="E.g., An upbeat reggae song with tropical vibes, perfect for a beach party..."
              placeholderTextColor={colors.muted}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
              numberOfLines={5}
            />
          </View>

          {/* Genre Selection */}
          <View className="px-4 mt-6">
            <Text className="text-foreground font-semibold mb-2">Select Genre</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  className="px-4 py-2 rounded-full"
                  style={{ 
                    backgroundColor: aiGenre === genre ? colors.primary : colors.surface,
                  }}
                  onPress={() => setAiGenre(genre)}
                >
                  <Text 
                    style={{ color: aiGenre === genre ? '#fff' : colors.foreground }}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Duration */}
          <View className="px-4 mt-6">
            <Text className="text-foreground font-semibold mb-2">Duration: {aiDuration} seconds</Text>
            <View className="flex-row gap-2">
              {[30, 60, 90, 120].map((dur) => (
                <TouchableOpacity
                  key={dur}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ 
                    backgroundColor: aiDuration === dur ? colors.primary : colors.surface,
                  }}
                  onPress={() => setAiDuration(dur)}
                >
                  <Text 
                    style={{ color: aiDuration === dur ? '#fff' : colors.foreground }}
                  >
                    {dur}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Generate Button */}
          <View className="px-4 mt-8">
            <TouchableOpacity 
              className="py-4 rounded-xl items-center"
              style={{ 
                backgroundColor: isGenerating ? colors.muted : colors.primary,
                opacity: isGenerating ? 0.7 : 1,
              }}
              onPress={handleAIGenerate}
              disabled={isGenerating}
            >
              <Text className="text-white font-bold text-lg">
                {isGenerating ? "Generating..." : "Generate Music"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Upload Mode
  if (mode === "upload") {
    return (
      <ScreenContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-2 flex-row items-center">
            <TouchableOpacity onPress={() => setMode("menu")} className="mr-3">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">Upload Music</Text>
              <Text className="text-muted">Share your music with PNG</Text>
            </View>
          </View>

          {/* Upload Options */}
          <View className="px-4 mt-6">
            {/* Audio Upload */}
            <TouchableOpacity 
              className="p-6 rounded-xl mb-4 items-center border-2 border-dashed"
              style={{ borderColor: colors.primary }}
              onPress={handleUpload}
            >
              <IconSymbol name="music.note" size={48} color={colors.primary} />
              <Text className="text-foreground font-bold text-lg mt-3">Upload Audio</Text>
              <Text className="text-muted text-sm text-center mt-1">
                MP3, WAV, FLAC supported{'\n'}Max 50MB
              </Text>
            </TouchableOpacity>

            {/* Cover Image */}
            <TouchableOpacity 
              className="p-6 rounded-xl mb-4 items-center border-2 border-dashed"
              style={{ borderColor: colors.gold }}
              onPress={() => Alert.alert("Upload", "Image picker would open here")}
            >
              <IconSymbol name="photo.fill" size={48} color={colors.gold} />
              <Text className="text-foreground font-bold text-lg mt-3">Add Cover Art</Text>
              <Text className="text-muted text-sm text-center mt-1">
                JPG, PNG supported{'\n'}Square image recommended
              </Text>
            </TouchableOpacity>

            {/* Music Video */}
            <TouchableOpacity 
              className="p-6 rounded-xl mb-4 items-center border-2 border-dashed"
              style={{ borderColor: colors.success }}
              onPress={() => Alert.alert("Upload", "Video picker would open here")}
            >
              <IconSymbol name="video.fill" size={48} color={colors.success} />
              <Text className="text-foreground font-bold text-lg mt-3">Add Music Video</Text>
              <Text className="text-muted text-sm text-center mt-1">
                MP4, MOV supported{'\n'}Optional
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Mastering Mode
  if (mode === "mastering") {
    return (
      <ScreenContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-2 flex-row items-center">
            <TouchableOpacity onPress={() => setMode("menu")} className="mr-3">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">Mastering Studio</Text>
              <Text className="text-muted">Professional sound enhancement</Text>
            </View>
          </View>

          {/* Free Presets */}
          <View className="px-4 mt-6">
            <Text className="text-foreground font-semibold mb-3">Free Presets</Text>
            {MASTERING_PRESETS.free.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                className="p-4 rounded-xl mb-2 flex-row items-center"
                style={{ 
                  backgroundColor: selectedPreset === preset.id ? colors.primary + '20' : colors.surface,
                  borderWidth: selectedPreset === preset.id ? 2 : 0,
                  borderColor: colors.primary,
                }}
                onPress={() => setSelectedPreset(preset.id)}
              >
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{preset.name}</Text>
                  <Text className="text-muted text-sm">{preset.description}</Text>
                </View>
                {selectedPreset === preset.id && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Premium Presets */}
          <View className="px-4 mt-6">
            <View className="flex-row items-center mb-3">
              <Text className="text-foreground font-semibold">Premium Presets</Text>
              <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.gold }}>
                <Text className="text-white text-xs font-semibold">PRO</Text>
              </View>
            </View>
            {MASTERING_PRESETS.premium.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                className="p-4 rounded-xl mb-2 flex-row items-center"
                style={{ 
                  backgroundColor: colors.surface,
                  opacity: isPremium ? 1 : 0.6,
                }}
                onPress={() => {
                  if (isPremium) {
                    setSelectedPreset(preset.id);
                  } else {
                    Alert.alert("Premium Required", "Upgrade to access premium presets");
                  }
                }}
              >
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{preset.name}</Text>
                  <Text className="text-muted text-sm">{preset.description}</Text>
                </View>
                {!isPremium && (
                  <IconSymbol name="lock.fill" size={20} color={colors.muted} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Mastering Level */}
          <View className="px-4 mt-6">
            <Text className="text-foreground font-semibold mb-3">Mastering Intensity</Text>
            <View className="flex-row gap-2">
              {MASTERING_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ 
                    backgroundColor: masteringLevel === level.id ? colors.primary : colors.surface,
                  }}
                  onPress={() => setMasteringLevel(level.id)}
                >
                  <Text 
                    className="font-semibold"
                    style={{ color: masteringLevel === level.id ? '#fff' : colors.foreground }}
                  >
                    {level.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Apply Button */}
          <View className="px-4 mt-8">
            <TouchableOpacity 
              className="py-4 rounded-xl items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => Alert.alert("Select Track", "Choose a track from your library to master")}
            >
              <Text className="text-white font-bold text-lg">Select Track to Master</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return null;
}
