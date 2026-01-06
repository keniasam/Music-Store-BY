import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { CONTACT_INFO } from "@/shared/config";

export default function TermsScreen() {
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
          <Text className="text-2xl font-bold text-foreground">Terms & Conditions</Text>
        </View>

        <View className="px-4 mt-4">
          <Text className="text-muted mb-4">Last updated: January 5, 2026</Text>

          <Text className="text-foreground leading-6 mb-4">
            Welcome to Music Store Bilong Yumi. By using our mobile application and services, 
            you agree to be bound by these Terms and Conditions. Please read them carefully.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">1. Acceptance of Terms</Text>
          <Text className="text-foreground leading-6 mb-4">
            By accessing or using Music Store Bilong Yumi, you agree to comply with and be 
            bound by these Terms and Conditions. If you do not agree to these terms, please 
            do not use our services.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">2. User Accounts</Text>
          <Text className="text-foreground leading-6 mb-4">
            To access certain features, you must create an account. You are responsible for 
            maintaining the confidentiality of your account credentials and for all activities 
            under your account. One email address may only be associated with one user account.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">3. Content Ownership</Text>
          <Text className="text-foreground leading-6 mb-4">
            You retain all ownership rights to the music and content you upload to Music Store 
            Bilong Yumi. By uploading content, you grant us a non-exclusive license to host, 
            display, and distribute your content through our platform.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">4. Prohibited Content</Text>
          <Text className="text-foreground leading-6 mb-4">
            You may not upload content that: infringes on intellectual property rights; contains 
            explicit, offensive, or illegal material; promotes violence or discrimination; or 
            violates any applicable laws of Papua New Guinea.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">5. Subscription Services</Text>
          <Text className="text-foreground leading-6 mb-4">
            Free accounts are limited to 7 uploads and 3 downloads. Premium subscriptions 
            provide unlimited access. Subscription fees are non-refundable except as required 
            by law. You may cancel your subscription at any time.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">6. Payments and Fees</Text>
          <Text className="text-foreground leading-6 mb-4">
            Music Store Bilong Yumi charges a 5% platform fee on all sales. Artists receive 
            95% of each sale. Payments are processed through PayPal, Stripe, or PNG phone 
            banking services. All prices are displayed in Papua New Guinea Kina (PGK).
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">7. Withdrawals</Text>
          <Text className="text-foreground leading-6 mb-4">
            Artists may withdraw their earnings once they reach a minimum balance of K 50.00. 
            Withdrawals are processed to PayPal or Bank South Pacific (BSP) accounts. Processing 
            times may vary depending on the payment method.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">8. AI-Generated Content</Text>
          <Text className="text-foreground leading-6 mb-4">
            Music created using our AI Music Creator tool is owned by the user who generated it. 
            However, similar content may be generated for other users. AI-generated content must 
            comply with all other terms regarding prohibited content.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">9. Mastering Services</Text>
          <Text className="text-foreground leading-6 mb-4">
            Our mastering presets are provided as-is. While we strive for quality, results may 
            vary depending on the source material. Free users have access to 4 presets, while 
            premium users have access to all available presets.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">10. Limitation of Liability</Text>
          <Text className="text-foreground leading-6 mb-4">
            Music Store Bilong Yumi is provided "as is" without warranties of any kind. We are 
            not liable for any indirect, incidental, or consequential damages arising from your 
            use of the platform.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">11. Termination</Text>
          <Text className="text-foreground leading-6 mb-4">
            We reserve the right to suspend or terminate accounts that violate these terms or 
            engage in fraudulent activity. Upon termination, your right to use the service 
            ceases immediately.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">12. Governing Law</Text>
          <Text className="text-foreground leading-6 mb-4">
            These Terms and Conditions are governed by the laws of Papua New Guinea. Any 
            disputes shall be resolved in the courts of Papua New Guinea.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">13. Changes to Terms</Text>
          <Text className="text-foreground leading-6 mb-4">
            We may update these Terms and Conditions from time to time. Continued use of the 
            platform after changes constitutes acceptance of the new terms.
          </Text>

          <Text className="text-lg font-bold text-foreground mt-4 mb-2">14. Contact</Text>
          <Text className="text-foreground leading-6 mb-4">
            For questions about these Terms and Conditions, please contact us at:{'\n'}
            Email: {CONTACT_INFO.email}{'\n'}
            WhatsApp: {CONTACT_INFO.whatsapp}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
