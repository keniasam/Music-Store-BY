// Shared configuration for Music Store Bilong Yumi

export interface AppConfig {
  appName: string;
  currency: string;
  currencySymbol: string;
  platformFeePercent: number;
  freeUploadLimit: number;
  freeDownloadLimit: number;
  freeMasteringPresets: number;
  subscriptionPriceMonthly: number;
  subscriptionPriceYearly: number;
}

export const APP_CONFIG: AppConfig = {
  appName: "Music Store Bilong Yumi",
  currency: "PGK",
  currencySymbol: "K",
  platformFeePercent: 5,
  freeUploadLimit: 7,
  freeDownloadLimit: 3,
  freeMasteringPresets: 4,
  subscriptionPriceMonthly: 29.99,
  subscriptionPriceYearly: 299.99,
};

export const GENRES = [
  "Gospel",
  "Reggae",
  "Hip Hop",
  "R&B",
  "Pop",
  "Traditional",
  "Rock",
  "Electronic",
  "Country",
  "Jazz",
  "Blues",
  "Acoustic",
  "Dance",
  "Instrumental",
  "Other",
] as const;

export type Genre = typeof GENRES[number];

export const MASTERING_PRESETS = {
  free: [
    { id: "warm", name: "Warm", description: "Smooth, warm tones with enhanced low-mids" },
    { id: "bright", name: "Bright", description: "Clear, crisp highs with presence" },
    { id: "punchy", name: "Punchy", description: "Tight bass and snappy transients" },
    { id: "balanced", name: "Balanced", description: "Even, natural sound across all frequencies" },
  ],
  premium: [
    { id: "radio", name: "Radio Ready", description: "Broadcast-ready loudness and clarity" },
    { id: "club", name: "Club Master", description: "Heavy bass and loud presence for clubs" },
    { id: "acoustic", name: "Acoustic Pure", description: "Natural dynamics for acoustic music" },
    { id: "vintage", name: "Vintage Analog", description: "Classic analog warmth and saturation" },
    { id: "modern", name: "Modern Pop", description: "Contemporary pop production sound" },
    { id: "hiphop", name: "Hip Hop Heavy", description: "Deep bass and crisp vocals" },
    { id: "rock", name: "Rock Power", description: "Aggressive mids and powerful drums" },
    { id: "electronic", name: "EDM Max", description: "Maximum loudness for electronic music" },
  ],
} as const;

export const MASTERING_LEVELS = [
  { id: "light", name: "Light", value: 0.3 },
  { id: "medium", name: "Medium", value: 0.6 },
  { id: "heavy", name: "Heavy", value: 1.0 },
] as const;

export const PAYMENT_METHODS = [
  { id: "paypal", name: "PayPal", icon: "paypal" },
  { id: "stripe", name: "Credit/Debit Card", icon: "credit-card" },
  { id: "phone_banking", name: "Phone Banking (PNG)", icon: "phone" },
] as const;

export const PNG_BANKS = [
  { id: "bsp", name: "Bank South Pacific (BSP)", code: "BSP" },
  { id: "westpac", name: "Westpac PNG", code: "WPC" },
  { id: "kina", name: "Kina Bank", code: "KBL" },
] as const;

export interface ContactInfo {
  founder: string;
  bspAccount: string;
  location: string;
  whatsapp: string;
  email: string;
  facebook: string;
}

export const CONTACT_INFO: ContactInfo = {
  founder: "Kenia Sam",
  bspAccount: "7002507585",
  location: "Papua New Guinea (PNG)",
  whatsapp: "+675 83828101",
  email: "keandarles@gmail.com",
  facebook: "Under Cover Agency",
};

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `K ${num.toFixed(2)}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}
