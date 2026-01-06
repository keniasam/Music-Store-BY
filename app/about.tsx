import { ScrollView, Text, View, TouchableOpacity, Linking, Image, Alert } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { CONTACT_INFO, APP_CONFIG } from "@/shared/config";

export default function AboutScreen() {
  const colors = useColors();
  const router = useRouter();

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open link");
    });
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">About</Text>
        </View>

        {/* App Logo & Name */}
        <View className="items-center mt-6 px-4">
          <Image 
            source={require("@/assets/images/logo.jpg")}
            style={{ width: 150, height: 150, borderRadius: 20 }}
          />
          <Text className="text-2xl font-bold text-foreground text-center">
            Music Store Bilong Yumi
          </Text>
          <Text className="text-muted text-center mt-1">
            Online Music Platform for Papua New Guinea
          </Text>
        </View>

        {/* About the App */}
        <View className="mx-4 mt-8">
          <Text className="text-lg font-bold text-foreground mb-3">About the App</Text>
          <View className="p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <Text className="text-foreground leading-6">
              Music Store Bilong Yumi is Papua New Guinea's premier online music platform, 
              designed to empower local artists and connect them with music lovers across 
              the nation and beyond.
            </Text>
            <Text className="text-foreground leading-6 mt-4">
              Our platform provides artists with powerful tools to create, master, and 
              distribute their music while earning fair compensation for their work. 
              With integrated AI music creation, professional mastering presets, and 
              multiple payment options including PayPal, Stripe, and PNG phone banking, 
              we make it easy for PNG artists to share their talent with the world.
            </Text>
          </View>
        </View>

        {/* How to Use */}
        <View className="mx-4 mt-6">
          <Text className="text-lg font-bold text-foreground mb-3">How to Use</Text>
          <View className="p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <View className="mb-4">
              <Text className="text-foreground font-semibold mb-1">1. Create Your Account</Text>
              <Text className="text-muted">
                Sign up with your email to access all features. One email = one account.
              </Text>
            </View>
            <View className="mb-4">
              <Text className="text-foreground font-semibold mb-1">2. Upload Your Music</Text>
              <Text className="text-muted">
                Upload audio files, cover art, and music videos. Free users get 7 uploads, 
                premium users get unlimited.
              </Text>
            </View>
            <View className="mb-4">
              <Text className="text-foreground font-semibold mb-1">3. Use AI Music Creator</Text>
              <Text className="text-muted">
                Describe the music you want to create and let our AI generate unique tracks for you.
              </Text>
            </View>
            <View className="mb-4">
              <Text className="text-foreground font-semibold mb-1">4. Master Your Tracks</Text>
              <Text className="text-muted">
                Use professional mastering presets to enhance your sound. 4 free presets 
                available, more with premium.
              </Text>
            </View>
            <View className="mb-4">
              <Text className="text-foreground font-semibold mb-1">5. Set Your Price</Text>
              <Text className="text-muted">
                Choose to offer your music for free or set a price in Papua New Guinea Kina (PGK).
              </Text>
            </View>
            <View>
              <Text className="text-foreground font-semibold mb-1">6. Earn Money</Text>
              <Text className="text-muted">
                Receive 95% of every sale directly to your PayPal or BSP account. 
                The platform takes only 5% to maintain operations.
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription Tiers */}
        <View className="mx-4 mt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Subscription Tiers</Text>
          
          {/* Free Tier */}
          <View className="p-4 rounded-xl mb-3" style={{ backgroundColor: colors.surface }}>
            <Text className="text-foreground font-bold text-lg mb-2">Free</Text>
            <View className="flex-row items-center mb-2">
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text className="text-foreground ml-2">7 music uploads</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text className="text-foreground ml-2">3 downloads</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text className="text-foreground ml-2">4 mastering presets</Text>
            </View>
            <View className="flex-row items-center">
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text className="text-foreground ml-2">Basic AI music generation</Text>
            </View>
          </View>

          {/* Premium Tier */}
          <View className="p-4 rounded-xl" style={{ backgroundColor: colors.gold + '20', borderWidth: 2, borderColor: colors.gold }}>
            <View className="flex-row items-center mb-2">
              <Text className="text-foreground font-bold text-lg">Premium</Text>
              <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.gold }}>
                <Text className="text-white text-xs font-bold">PRO</Text>
              </View>
            </View>
            <View className="flex-row items-center mb-2">
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.gold} />
              <Text className="text-foreground ml-2">Unlimited uploads</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.gold} />
              <Text className="text-foreground ml-2">Unlimited downloads</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.gold} />
              <Text className="text-foreground ml-2">All mastering presets (20+)</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.gold} />
              <Text className="text-foreground ml-2">Advanced AI music generation</Text>
            </View>
            <View className="flex-row items-center">
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.gold} />
              <Text className="text-foreground ml-2">Priority support</Text>
            </View>
            <Text className="text-foreground font-bold mt-3">
              K {APP_CONFIG.subscriptionPriceMonthly}/month or K {APP_CONFIG.subscriptionPriceYearly}/year
            </Text>
          </View>
        </View>

        {/* Creator & Founder */}
        <View className="mx-4 mt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Creator & Founder</Text>
          <View className="p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center">
              <Image 
                source={require("@/assets/images/founder.jpg")}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
              <View className="flex-1 ml-4">
                <Text className="text-xl font-bold text-foreground">{CONTACT_INFO.founder}</Text>
                <Text className="text-muted">{CONTACT_INFO.location}</Text>
              </View>
            </View>
            <Text className="text-foreground mt-4 leading-6">
              Music Store Bilong Yumi was created with a vision to support and promote 
              Papua New Guinea's rich musical heritage. Our mission is to provide a 
              platform where PNG artists can thrive and share their unique sounds with 
              the world.
            </Text>
          </View>
        </View>

        {/* Donation */}
        <View className="mx-4 mt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Support the Platform</Text>
          <View className="p-4 rounded-xl" style={{ backgroundColor: colors.gold + '20' }}>
            <Text className="text-foreground mb-3">
              Help us continue to develop and improve Music Store Bilong Yumi by making 
              a donation. Your support helps us maintain the platform and add new features 
              for PNG artists.
            </Text>
            <View className="flex-row items-center p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
              <IconSymbol name="banknote.fill" size={24} color={colors.gold} />
              <View className="ml-3">
                <Text className="text-muted text-sm">Bank South Pacific (BSP)</Text>
                <Text className="text-foreground font-bold text-lg">{CONTACT_INFO.bspAccount}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View className="mx-4 mt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Contact Us</Text>
          <View className="p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <TouchableOpacity 
              className="flex-row items-center py-3 border-b"
              style={{ borderBottomColor: colors.border }}
              onPress={() => openLink(`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\s/g, '')}`)}
            >
              <IconSymbol name="paperplane.fill" size={24} color={colors.success} />
              <View className="flex-1 ml-3">
                <Text className="text-muted text-sm">WhatsApp</Text>
                <Text className="text-foreground">{CONTACT_INFO.whatsapp}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center py-3 border-b"
              style={{ borderBottomColor: colors.border }}
              onPress={() => openLink(`mailto:${CONTACT_INFO.email}`)}
            >
              <IconSymbol name="envelope.fill" size={24} color={colors.primary} />
              <View className="flex-1 ml-3">
                <Text className="text-muted text-sm">Email</Text>
                <Text className="text-foreground">{CONTACT_INFO.email}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center py-3"
              onPress={() => openLink(`https://facebook.com/${CONTACT_INFO.facebook.replace(/\s/g, '')}`)}
            >
              <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
              <View className="flex-1 ml-3">
                <Text className="text-muted text-sm">Facebook</Text>
                <Text className="text-foreground">{CONTACT_INFO.facebook}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <View className="items-center mt-8">
          <Text className="text-muted text-sm">Version 1.0.0</Text>
          <Text className="text-muted text-sm">Made with love in Papua New Guinea</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
