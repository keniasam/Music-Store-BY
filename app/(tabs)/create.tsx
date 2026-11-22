import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useAudioPlayer } from "@/lib/audio-player-context";
import { trpc } from "@/lib/trpc";
import { GENRES, MASTERING_PRESETS, MASTERING_LEVELS, APP_CONFIG, formatCurrency } from "@/shared/config";

type CreateMode = "menu" | "ai" | "upload" | "mastering";

export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, playTrack, togglePlayPause, applyMasteringPreset } = useAudioPlayer();
  const [mode, setMode] = useState<CreateMode>("menu");

  // Queries
  const { data: canUploadData, refetch: refetchCanUpload } = trpc.user.canUpload.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: userTracks, refetch: refetchUserTracks } = trpc.tracks.getUserTracks.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutations
  const createTrackMutation = trpc.tracks.create.useMutation();
  const publishTrackMutation = trpc.tracks.publish.useMutation();
  const uploadStorageMutation = trpc.storage.upload.useMutation();
  const generateAiMutation = trpc.ai.generateMusic.useMutation();
  const updateTrackMutation = trpc.tracks.update.useMutation();

  // AI Creator state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenre, setAiGenre] = useState("Reggae");
  const [aiDuration, setAiDuration] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);

  // Upload Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("Reggae");
  const [price, setPrice] = useState("0.00");
  const [isFree, setIsFree] = useState(true);
  const [audioFileName, setAudioFileName] = useState("");
  const [audioBase64, setAudioBase64] = useState("");
  const [coverFileName, setCoverFileName] = useState("");
  const [coverBase64, setCoverBase64] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Mastering Studio state
  const [selectedPreset, setSelectedPreset] = useState("balanced");
  const [masteringLevel, setMasteringLevel] = useState("medium");
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [isApplyingMaster, setIsApplyingMaster] = useState(false);

  const isPremium = user?.subscriptionTier === "premium";
  const uploadsRemaining = canUploadData ? canUploadData.remaining : (isPremium ? -1 : APP_CONFIG.freeUploadLimit);

  // HTML5 Web File Picker (works across browsers and Electron)
  const pickFile = (accept: string, onSelect: (fileName: string, base64: string, previewUrl?: string) => void) => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.includes(",") ? result.split(",")[1] : result;
            onSelect(file.name, base64, result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Native fallback simulation / sample attachment
      Alert.alert(
        "Select Audio",
        "Select a demo audio sample or upload via the Web app / desktop build:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Use Demo SoundHelix Audio",
            onPress: () => {
              onSelect("demo_melanesian_track.mp3", "ZGVtb19hdWRpb19kYXRh", undefined);
            },
          },
        ]
      );
    }
  };

  const handleSelectAudio = () => {
    pickFile("audio/*", (name, base64) => {
      setAudioFileName(name);
      setAudioBase64(base64);
      if (!title) {
        // Auto-fill title from filename
        const cleanName = name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    });
  };

  const handleSelectCover = () => {
    pickFile("image/*", (name, base64, preview) => {
      setCoverFileName(name);
      setCoverBase64(base64);
      if (preview) setCoverPreview(preview);
    });
  };

  const handleSubmitUpload = async () => {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a title for your song");
      return;
    }
    if (!audioFileName) {
      Alert.alert("Audio Required", "Please select an audio file to upload");
      return;
    }

    setIsUploading(true);
    try {
      let finalAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      let finalCoverUrl: string | undefined = undefined;

      // 1. Upload audio file
      if (audioBase64) {
        const audioKey = `audio/${Date.now()}_${audioFileName}`;
        const audioRes = await uploadStorageMutation.mutateAsync({
          key: audioKey,
          data: audioBase64,
          contentType: "audio/mpeg",
        });
        if (audioRes.url) {
          finalAudioUrl = audioRes.url;
        }
      }

      // 2. Upload cover if selected
      if (coverBase64) {
        const coverKey = `covers/${Date.now()}_${coverFileName}`;
        const coverRes = await uploadStorageMutation.mutateAsync({
          key: coverKey,
          data: coverBase64,
          contentType: "image/jpeg",
        });
        if (coverRes.url) {
          finalCoverUrl = coverRes.url;
        }
      }

      // 3. Create track in database
      const createRes = await createTrackMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        genre,
        audioUrl: finalAudioUrl,
        coverUrl: finalCoverUrl,
        price: isFree ? "0.00" : price,
        isFree,
        masteringPreset: selectedPreset,
        masteringLevel,
      });

      // 4. Publish track
      await publishTrackMutation.mutateAsync({ id: createRes.trackId });

      refetchCanUpload();
      refetchUserTracks();

      Alert.alert("Success! 🎵", `"${title}" has been published to Music Store Bilong Yumi!`, [
        {
          text: "View Track",
          onPress: () => {
            setMode("menu");
            router.push(`/track/${createRes.trackId}` as any);
          },
        },
        {
          text: "Back to Library",
          onPress: () => {
            setMode("menu");
            router.push("/(tabs)/library");
          },
        },
      ]);
    } catch (err: any) {
      console.error("[Create] Upload error:", err);
      Alert.alert("Upload Failed", err.message || "Failed to create track");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert("Enter Prompt", "Please describe the music you want to create");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await generateAiMutation.mutateAsync({
        prompt: aiPrompt.trim(),
        genre: aiGenre,
        duration: aiDuration,
      });

      // Auto-create a published track based on AI generation
      const trackRes = await createTrackMutation.mutateAsync({
        title: `AI: ${aiPrompt.slice(0, 30)}...`,
        description: `Generated by Bilong Yumi AI Music Creator. Prompt: "${aiPrompt}"`,
        genre: aiGenre,
        duration: aiDuration,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        isFree: true,
        price: "0.00",
        isAiGenerated: true,
        masteringPreset: "balanced",
      });

      await publishTrackMutation.mutateAsync({ id: trackRes.trackId });
      refetchUserTracks();

      Alert.alert(
        "AI Track Ready! 🤖✨",
        "Your AI track has been generated and published to your library!",
        [
          {
            text: "Listen Now",
            onPress: () => {
              setMode("menu");
              router.push(`/track/${trackRes.trackId}` as any);
            },
          },
          { text: "Done", onPress: () => setMode("menu") },
        ]
      );
    } catch (err: any) {
      Alert.alert("AI Generation Error", err.message || "Failed to generate AI music");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyMastering = async () => {
    if (!selectedTrackId) {
      Alert.alert("Select Track", "Please choose a track from your library to master");
      return;
    }

    setIsApplyingMaster(true);
    try {
      applyMasteringPreset(selectedPreset, masteringLevel);
      await updateTrackMutation.mutateAsync({
        id: selectedTrackId,
        masteringPreset: selectedPreset,
        masteringLevel,
      });
      refetchUserTracks();
      Alert.alert(
        "Mastering Applied! 🎚️",
        `Track updated with ${selectedPreset.replace("_", " ")} preset at ${masteringLevel} intensity.`,
        [
          {
            text: "Listen to Track",
            onPress: () => {
              setMode("menu");
              router.push(`/track/${selectedTrackId}` as any);
            },
          },
          { text: "Done", onPress: () => setMode("menu") },
        ]
      );
    } catch (err: any) {
      Alert.alert("Mastering Error", err.message || "Failed to apply mastering");
    } finally {
      setIsApplyingMaster(false);
    }
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
          className="px-8 py-3.5 rounded-full"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/login")}
        >
          <Text className="text-white font-semibold text-base">Login to Create</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // ============ MAIN MENU ============
  if (mode === "menu") {
    return (
      <ScreenContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-2">
            <Text className="text-2xl font-bold text-foreground">Create & Publish</Text>
            <Text className="text-muted">Make music, upload tracks, and master sounds</Text>
          </View>

          {/* Upload Status Card */}
          <View className="mx-4 mt-4 p-4 rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-semibold text-sm">Upload Quota</Text>
              {isPremium ? (
                <View className="flex-row items-center">
                  <IconSymbol name="crown.fill" size={16} color={colors.gold} />
                  <Text className="text-gold ml-1 font-bold text-xs">Unlimited</Text>
                </View>
              ) : (
                <Text className="text-muted text-xs">
                  {uploadsRemaining} remaining of {APP_CONFIG.freeUploadLimit}
                </Text>
              )}
            </View>
          </View>

          {/* Create Options */}
          <View className="px-4 mt-5">
            {/* Upload Music Card */}
            <TouchableOpacity 
              className="p-4 rounded-2xl mb-4 border"
              style={{ backgroundColor: colors.gold + '15', borderColor: colors.gold + '40' }}
              onPress={() => setMode("upload")}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-13 h-13 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: colors.gold, width: 52, height: 52 }}
                >
                  <IconSymbol name="arrow.up.circle.fill" size={28} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-base">Upload Track</Text>
                  <Text className="text-muted text-xs mt-0.5">Upload audio (MP3/WAV), cover art, set price</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {/* AI Music Creator Card */}
            <TouchableOpacity 
              className="p-4 rounded-2xl mb-4 border"
              style={{ backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }}
              onPress={() => setMode("ai")}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-13 h-13 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: colors.primary, width: 52, height: 52 }}
                >
                  <IconSymbol name="wand.and.stars" size={28} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-base">AI Music Creator</Text>
                  <Text className="text-muted text-xs mt-0.5">Generate island music and beats from text prompts</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {/* Mastering Studio Card */}
            <TouchableOpacity 
              className="p-4 rounded-2xl mb-4 border"
              style={{ backgroundColor: colors.success + '15', borderColor: colors.success + '40' }}
              onPress={() => setMode("mastering")}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-13 h-13 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: colors.success, width: 52, height: 52 }}
                >
                  <IconSymbol name="waveform" size={28} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-base">Mastering Studio</Text>
                  <Text className="text-muted text-xs mt-0.5">Enhance warmth, loudness, and acoustics</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ============ UPLOAD MODE ============
  if (mode === "upload") {
    return (
      <ScreenContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-2 flex-row items-center">
            <TouchableOpacity onPress={() => setMode("menu")} className="mr-3 p-1">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">Upload Music</Text>
              <Text className="text-muted text-xs">Publish your songs to Papua New Guinea</Text>
            </View>
          </View>

          {/* Form Fields */}
          <View className="px-4 mt-4">
            {/* Audio Picker Button */}
            <TouchableOpacity 
              className="p-6 rounded-2xl mb-4 items-center border-2 border-dashed"
              style={{ 
                borderColor: audioFileName ? colors.success : colors.primary,
                backgroundColor: audioFileName ? colors.success + '10' : colors.surface,
              }}
              onPress={handleSelectAudio}
            >
              <IconSymbol 
                name={audioFileName ? "checkmark.circle.fill" : "music.note"} 
                size={40} 
                color={audioFileName ? colors.success : colors.primary} 
              />
              <Text className="text-foreground font-bold text-base mt-2">
                {audioFileName ? audioFileName : "Select Audio File"}
              </Text>
              <Text className="text-muted text-xs text-center mt-1">
                {audioFileName ? "Audio ready for upload" : "MP3, WAV, FLAC supported"}
              </Text>
            </TouchableOpacity>

            {/* Cover Picker */}
            <TouchableOpacity 
              className="p-4 rounded-2xl mb-4 items-center border-2 border-dashed flex-row"
              style={{ 
                borderColor: coverFileName ? colors.gold : colors.border,
                backgroundColor: colors.surface,
              }}
              onPress={handleSelectCover}
            >
              {coverPreview ? (
                <Image source={{ uri: coverPreview }} className="w-14 h-14 rounded-xl mr-3" />
              ) : (
                <View className="w-14 h-14 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.gold + '20' }}>
                  <IconSymbol name="photo.fill" size={24} color={colors.gold} />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-sm">
                  {coverFileName ? coverFileName : "Add Cover Artwork (Optional)"}
                </Text>
                <Text className="text-muted text-xs">JPG or PNG square image</Text>
              </View>
            </TouchableOpacity>

            {/* Song Title */}
            <Text className="text-foreground font-semibold mb-1.5 text-xs">Song Title *</Text>
            <TextInput
              className="p-3.5 rounded-xl text-foreground mb-4 border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              placeholder="e.g. Melanesian Sunrise"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text className="text-foreground font-semibold mb-1.5 text-xs">Description (Optional)</Text>
            <TextInput
              className="p-3.5 rounded-xl text-foreground mb-4 border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, minHeight: 70 }}
              placeholder="Story behind the track, dedicated to..."
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Genre Select */}
            <Text className="text-foreground font-semibold mb-1.5 text-xs">Genre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 6 }}>
              {GENRES.map((g) => (
                <TouchableOpacity
                  key={g}
                  className="px-3.5 py-1.5 rounded-full border"
                  style={{ 
                    backgroundColor: genre === g ? colors.primary : colors.surface,
                    borderColor: genre === g ? colors.primary : colors.border,
                  }}
                  onPress={() => setGenre(g)}
                >
                  <Text 
                    className="text-xs font-semibold"
                    style={{ color: genre === g ? '#fff' : colors.foreground }}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Pricing Section */}
            <View className="p-4 rounded-2xl mb-4 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className="text-foreground font-bold text-sm mb-2">Price & Distribution</Text>
              <View className="flex-row items-center mb-3">
                <TouchableOpacity 
                  onPress={() => setIsFree(!isFree)}
                  className="flex-row items-center"
                >
                  <IconSymbol 
                    name={isFree ? "checkmark.circle.fill" : "circle"} 
                    size={22} 
                    color={isFree ? colors.success : colors.muted} 
                  />
                  <Text className="text-foreground font-semibold text-sm ml-2">Make this track Free</Text>
                </TouchableOpacity>
              </View>

              {!isFree && (
                <View className="mt-2">
                  <Text className="text-muted text-xs mb-1">Set Price in PGK (Kina)</Text>
                  <TextInput
                    className="p-3 rounded-xl text-foreground border"
                    style={{ backgroundColor: colors.background, borderColor: colors.border }}
                    placeholder="3.50"
                    placeholderTextColor={colors.muted}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                  <Text className="text-muted text-[10px] mt-1">You keep 95% of every sale!</Text>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              className="py-4 rounded-2xl items-center mt-2 shadow-md"
              style={{ 
                backgroundColor: isUploading ? colors.muted : colors.primary,
                opacity: isUploading ? 0.7 : 1,
              }}
              onPress={handleSubmitUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Publish Song</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ============ AI CREATOR MODE ============
  if (mode === "ai") {
    return (
      <ScreenContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-2 flex-row items-center">
            <TouchableOpacity onPress={() => setMode("menu")} className="mr-3 p-1">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">AI Music Creator</Text>
              <Text className="text-muted text-xs">Transform prompts into original music</Text>
            </View>
          </View>

          <View className="px-4 mt-4">
            <Text className="text-foreground font-semibold mb-1 text-xs">Describe the Song</Text>
            <TextInput
              className="p-4 rounded-2xl text-foreground mb-4 border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, minHeight: 110, textAlignVertical: "top" }}
              placeholder="E.g. Upbeat Melanesian island reggae with acoustic ukulele and beach sunset rhythm..."
              placeholderTextColor={colors.muted}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
            />

            <Text className="text-foreground font-semibold mb-1 text-xs">Style / Genre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 6 }}>
              {["Reggae", "Pop", "Traditional", "Hip Hop", "Gospel", "Acoustic"].map((g) => (
                <TouchableOpacity
                  key={g}
                  className="px-3.5 py-1.5 rounded-full border"
                  style={{ 
                    backgroundColor: aiGenre === g ? colors.primary : colors.surface,
                    borderColor: aiGenre === g ? colors.primary : colors.border,
                  }}
                  onPress={() => setAiGenre(g)}
                >
                  <Text className="text-xs font-semibold" style={{ color: aiGenre === g ? '#fff' : colors.foreground }}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-foreground font-semibold mb-1 text-xs">Duration: {aiDuration}s</Text>
            <View className="flex-row gap-2 mb-6">
              {[30, 60, 90, 120].map((d) => (
                <TouchableOpacity
                  key={d}
                  className="flex-1 py-2.5 rounded-xl items-center border"
                  style={{ 
                    backgroundColor: aiDuration === d ? colors.primary : colors.surface,
                    borderColor: aiDuration === d ? colors.primary : colors.border,
                  }}
                  onPress={() => setAiDuration(d)}
                >
                  <Text className="text-xs font-semibold" style={{ color: aiDuration === d ? '#fff' : colors.foreground }}>
                    {d}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              className="py-4 rounded-2xl items-center shadow-md"
              style={{ 
                backgroundColor: isGenerating ? colors.muted : colors.primary,
                opacity: isGenerating ? 0.7 : 1,
              }}
              onPress={handleAIGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Generate Music</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ============ MASTERING STUDIO MODE ============
  if (mode === "mastering") {
    return (
      <ScreenContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-2 flex-row items-center">
            <TouchableOpacity onPress={() => setMode("menu")} className="mr-3 p-1">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">Mastering Studio</Text>
              <Text className="text-muted text-xs">Professional acoustic & vocal presets</Text>
            </View>
          </View>

          <View className="px-4 mt-4">
            <Text className="text-foreground font-semibold mb-2 text-xs">1. Select Track to Master</Text>
            {!userTracks || userTracks.length === 0 ? (
              <View className="p-4 rounded-2xl mb-4 border items-center" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <Text className="text-muted text-xs mb-2">No uploaded tracks found.</Text>
                <TouchableOpacity 
                  onPress={() => setMode("upload")}
                  className="px-4 py-1.5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white text-xs font-semibold">Upload a Track First</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
                {userTracks.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    className="p-3 rounded-2xl border items-center"
                    style={{ 
                      width: 130,
                      backgroundColor: selectedTrackId === t.id ? colors.primary + '20' : colors.surface,
                      borderColor: selectedTrackId === t.id ? colors.primary : colors.border,
                    }}
                    onPress={() => setSelectedTrackId(t.id)}
                  >
                    <IconSymbol name="music.note" size={20} color={colors.primary} />
                    <Text className="text-foreground font-semibold text-xs mt-1" numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text className="text-muted text-[10px]">{t.genre || "Song"}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text className="text-foreground font-semibold mb-2 text-xs">2. Select Mastering Preset (Live DSP EQ)</Text>
            {MASTERING_PRESETS.free.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                className="p-3.5 rounded-2xl mb-2.5 flex-row items-center border"
                style={{ 
                  backgroundColor: selectedPreset === preset.id ? colors.primary + '15' : colors.surface,
                  borderColor: selectedPreset === preset.id ? colors.primary : colors.border,
                }}
                onPress={() => {
                  setSelectedPreset(preset.id);
                  applyMasteringPreset(preset.id, masteringLevel);
                }}
              >
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-sm">{preset.name}</Text>
                  <Text className="text-muted text-xs mt-0.5">{preset.description}</Text>
                </View>
                {selectedPreset === preset.id && (
                  <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <Text className="text-foreground font-semibold mt-3 mb-2 text-xs">3. Intensity Level</Text>
            <View className="flex-row gap-2 mb-6">
              {MASTERING_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl.id}
                  className="flex-1 py-2.5 rounded-xl items-center border"
                  style={{ 
                    backgroundColor: masteringLevel === lvl.id ? colors.primary : colors.surface,
                    borderColor: masteringLevel === lvl.id ? colors.primary : colors.border,
                  }}
                  onPress={() => {
                    setMasteringLevel(lvl.id);
                    applyMasteringPreset(selectedPreset, lvl.id);
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: masteringLevel === lvl.id ? '#fff' : colors.foreground }}>
                    {lvl.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedTrackId && userTracks && (
              <TouchableOpacity
                className="py-3 rounded-2xl items-center border flex-row justify-center mb-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.primary }}
                onPress={() => {
                  const chosen = userTracks.find((t) => t.id === selectedTrackId);
                  if (!chosen) return;
                  if (currentTrack?.id === chosen.id) {
                    togglePlayPause();
                  } else {
                    playTrack({
                      id: chosen.id,
                      title: chosen.title,
                      artist: user?.name || "PNG Artist",
                      genre: chosen.genre,
                      duration: chosen.duration,
                      audioUrl: chosen.audioUrl,
                      coverUrl: chosen.coverUrl,
                      price: chosen.price,
                      isFree: chosen.isFree,
                      masteringPreset: selectedPreset,
                      masteringLevel,
                    });
                  }
                }}
              >
                <IconSymbol
                  name={currentTrack?.id === selectedTrackId && isPlaying ? "pause.fill" : "play.fill"}
                  size={18}
                  color={colors.primary}
                />
                <Text className="font-semibold text-sm ml-2" style={{ color: colors.primary }}>
                  {currentTrack?.id === selectedTrackId && isPlaying
                    ? "Pause Live DSP Preview"
                    : "Live Preview Track with EQ"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              className="py-4 rounded-2xl items-center shadow-md"
              style={{ 
                backgroundColor: isApplyingMaster ? colors.muted : colors.primary,
                opacity: isApplyingMaster ? 0.7 : 1,
              }}
              onPress={handleApplyMastering}
              disabled={isApplyingMaster}
            >
              {isApplyingMaster ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Apply Mastering</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return null;
}
