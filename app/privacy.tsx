import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { CONTACT_INFO } from "@/shared/config";

export default function PrivacyScreen() {
  const colors = useColors();
  const router = useRouter();

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
          <Text className="text-2xl font-bold text-foreground">Privacy Policy</Text>
        </View>

        <View className="px-4 mt-4">
          <Text className="text-muted mb-4">Last updated: January 5, 2026</Text>

          <Text className="text-foreground leading-6 mb-4">
            Music Store Bilong Yumi ("we", "our", or "us") is committed to protecting your 
            privacy. This Privacy Policy explains how we collect, use, and safeguard your 
            information when you use our mobile application.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">1. Information We Collect</Text>
          <Text className="text-foreground leading-6 mb-4">
            We collect information you provide directly to us, including:{'\n\n'}
            • Account information (name, email address){'\n'}
            • Profile information (bio, location, social media links){'\n'}
            • Payment information (PayPal email, BSP account number){'\n'}
            • Content you upload (music files, images, videos){'\n'}
            • Communications with us and other users
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">2. Automatically Collected Information</Text>
          <Text className="text-foreground leading-6 mb-4">
            When you use our app, we automatically collect:{'\n\n'}
            • Device information (device type, operating system){'\n'}
            • Usage data (features used, time spent, interactions){'\n'}
            • Log data (IP address, access times, app crashes)
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">3. How We Use Your Information</Text>
          <Text className="text-foreground leading-6 mb-4">
            We use the information we collect to:{'\n\n'}
            • Provide, maintain, and improve our services{'\n'}
            • Process transactions and send related information{'\n'}
            • Send notifications about your account and activities{'\n'}
            • Respond to your comments, questions, and requests{'\n'}
            • Monitor and analyze trends, usage, and activities{'\n'}
            • Detect, investigate, and prevent fraudulent transactions
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">4. Information Sharing</Text>
          <Text className="text-foreground leading-6 mb-4">
            We may share your information in the following situations:{'\n\n'}
            • With other users (your public profile and uploaded content){'\n'}
            • With payment processors to complete transactions{'\n'}
            • With service providers who assist our operations{'\n'}
            • To comply with legal obligations{'\n'}
            • To protect our rights and the safety of users
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">5. Data Storage and Security</Text>
          <Text className="text-foreground leading-6 mb-4">
            Your data is stored on secure servers. We implement appropriate technical and 
            organizational measures to protect your personal information against unauthorized 
            access, alteration, disclosure, or destruction.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">6. Your Rights</Text>
          <Text className="text-foreground leading-6 mb-4">
            You have the right to:{'\n\n'}
            • Access your personal information{'\n'}
            • Correct inaccurate information{'\n'}
            • Delete your account and associated data{'\n'}
            • Opt out of promotional communications{'\n'}
            • Request a copy of your data
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">7. Data Retention</Text>
          <Text className="text-foreground leading-6 mb-4">
            We retain your personal information for as long as your account is active or as 
            needed to provide services. We may retain certain information for legal compliance, 
            dispute resolution, and enforcement of agreements.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">8. Children's Privacy</Text>
          <Text className="text-foreground leading-6 mb-4">
            Music Store Bilong Yumi is not intended for children under 13 years of age. We do 
            not knowingly collect personal information from children under 13. If we discover 
            that a child under 13 has provided us with personal information, we will delete it.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">9. Third-Party Services</Text>
          <Text className="text-foreground leading-6 mb-4">
            Our app may contain links to third-party websites and services. We are not 
            responsible for the privacy practices of these third parties. We encourage you 
            to read their privacy policies.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">10. International Data Transfers</Text>
          <Text className="text-foreground leading-6 mb-4">
            Your information may be transferred to and processed in countries other than 
            Papua New Guinea. By using our services, you consent to such transfers.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">11. Changes to This Policy</Text>
          <Text className="text-foreground leading-6 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any 
            changes by posting the new policy on this page and updating the "Last updated" date.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">12. Contact Us</Text>
          <Text className="text-foreground leading-6 mb-4">
            If you have any questions about this Privacy Policy, please contact us at:{'\n\n'}
            Email: {CONTACT_INFO.email}{'\n'}
            WhatsApp: {CONTACT_INFO.whatsapp}{'\n'}
            Location: {CONTACT_INFO.location}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
