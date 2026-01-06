// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 */
const MAPPING = {
  // Tab bar icons
  "house.fill": "home",
  "magnifyingglass": "search",
  "plus.circle.fill": "add-circle",
  "music.note.list": "library-music",
  "person.fill": "person",
  
  // Navigation icons
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "xmark": "close",
  "ellipsis": "more-horiz",
  
  // Action icons
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "bubble.left.fill": "comment",
  "square.and.arrow.up": "share",
  "arrow.down.circle.fill": "download",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "forward.fill": "skip-next",
  "backward.fill": "skip-previous",
  
  // Music icons
  "music.note": "music-note",
  "waveform": "graphic-eq",
  "mic.fill": "mic",
  "speaker.wave.3.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  
  // Create/Upload icons
  "plus": "add",
  "arrow.up.circle.fill": "cloud-upload",
  "photo.fill": "image",
  "video.fill": "videocam",
  "wand.and.stars": "auto-fix-high",
  
  // Payment icons
  "creditcard.fill": "credit-card",
  "banknote.fill": "payments",
  "dollarsign.circle.fill": "attach-money",
  
  // Profile/Settings icons
  "gearshape.fill": "settings",
  "bell.fill": "notifications",
  "envelope.fill": "email",
  "lock.fill": "lock",
  "person.badge.plus": "person-add",
  "crown.fill": "workspace-premium",
  
  // Social icons
  "paperplane.fill": "send",
  "person.2.fill": "people",
  
  // Status icons
  "checkmark.circle.fill": "check-circle",
  "exclamationmark.circle.fill": "error",
  "info.circle.fill": "info",
  "star.fill": "star",
  
  // Other icons
  "doc.text.fill": "description",
  "shield.fill": "security",
  "questionmark.circle.fill": "help",
  "globe": "language",
  "clock.fill": "schedule",
  "trash.fill": "delete",
  "pencil": "edit",
  "slider.horizontal.3": "tune",
  
  // Code icon (from original)
  "chevron.left.forwardslash.chevron.right": "code",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

export type { IconSymbolName };
