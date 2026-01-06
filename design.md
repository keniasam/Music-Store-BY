# Music Store Bilong Yumi - Mobile App Design Document

## App Overview
Music Store Bilong Yumi is a comprehensive online music platform designed specifically for Papua New Guinea (PNG) users. It enables artists to upload, master, and sell their music while providing listeners with a platform to discover, purchase, and download PNG music. The app features AI-powered music creation tools, professional mastering presets, and integrated payment systems including PayPal, Stripe, and PNG phone banking.

## Brand Identity

### Colors
- **Primary**: #B22234 (PNG Red - from flag)
- **Secondary**: #FFD700 (PNG Gold - from flag)
- **Accent**: #000000 (Black - from flag)
- **Background Light**: #FFFFFF
- **Background Dark**: #151718
- **Surface Light**: #F5F5F5
- **Surface Dark**: #1E2022
- **Success**: #22C55E
- **Warning**: #F59E0B
- **Error**: #EF4444

### Typography
- Primary Font: System default (San Francisco on iOS, Roboto on Android)
- Headlines: Bold, large sizes for impact
- Body: Regular weight for readability

---

## Screen List

### 1. Splash Screen
- App logo centered
- Loading indicator
- Brand colors background

### 2. Onboarding Screens (3 screens)
- Screen 1: "Discover PNG Music" - showcase music discovery
- Screen 2: "Create & Master" - highlight AI music creation
- Screen 3: "Sell & Earn" - explain monetization

### 3. Authentication Screens
- **Login Screen**: Email/password login with OAuth options
- **Register Screen**: Create account with email verification
- **Forgot Password**: Password reset flow

### 4. Main Tab Navigation (5 tabs)
- **Home** (house icon)
- **Discover** (search/compass icon)
- **Create** (plus/music icon)
- **Library** (collection icon)
- **Profile** (person icon)

### 5. Home Screen
- Hero banner with featured music/artists
- Trending tracks section (horizontal scroll)
- New releases section
- Recommended for you section
- Music products section
- Quick access to AI creator

### 6. Discover Screen
- Search bar at top
- Genre categories (horizontal chips)
- Trending artists grid
- Popular playlists
- Filter by: Songs, Albums, Artists, Videos, Products

### 7. Create Screen (AI Music Studio)
- AI Music Creator section
  - Text-to-music generation
  - Style/genre selection
  - Duration control
- Upload section
  - Upload music files
  - Upload cover images
  - Upload music videos
- Mastering Studio
  - 4 free presets (Warm, Bright, Punchy, Balanced)
  - Premium presets (5+) - subscription required
  - Light/Heavy mastering controls
  - Preview before/after

### 8. Library Screen
- My Uploads tab
- My Purchases tab
- Downloads tab
- Liked tracks tab
- Playlists tab

### 9. Profile Screen
- Profile header with avatar, name, stats
- Subscription status badge
- My Earnings section
- Payment settings
- Donation section (BSP account)
- Settings link
- About link

### 10. Track Detail Screen
- Cover art (large)
- Track title, artist
- Play/pause controls
- Progress bar
- Like, comment, share buttons
- Price and purchase button
- Download button (if purchased)
- Comments section

### 11. Artist Profile Screen
- Artist banner/avatar
- Bio section
- Tracks list
- Albums list
- Follow button
- Social links

### 12. Upload Flow Screens
- **Upload Music**: File picker, metadata form
- **Upload Cover**: Image picker, crop tool
- **Upload Video**: Video picker, thumbnail selection
- **Set Pricing**: Price in PGK, free/paid toggle
- **Review & Publish**: Preview before publishing

### 13. Mastering Screen
- Waveform visualization
- Preset selector (4 free, premium locked)
- Light/Heavy slider
- EQ controls
- Preview toggle
- Apply button
- Export options

### 14. Payment Screens
- **Checkout**: Order summary, payment method selection
- **Payment Methods**: PayPal, Stripe, Phone Banking
- **Phone Banking**: BSP, Westpac, Kina Bank options
- **Payment Success**: Confirmation with download link
- **Earnings Dashboard**: Revenue stats, withdrawal options

### 15. Subscription Screen
- Free tier features
- Premium tier features
- Pricing (monthly/yearly in PGK)
- Subscribe button
- Payment integration

### 16. Social Features Screens
- **Messages**: Inbox, conversations
- **Comments**: Thread view
- **Notifications**: Activity feed

### 17. Settings Screen
- Account settings
- Payment settings
- Notification preferences
- Privacy settings
- Language (English/Tok Pisin)
- Theme (Light/Dark)
- Help & Support

### 18. About Screen
- App description and how to use
- Creator info (Kenia Sam)
- Contact information
- Social links
- Donation section

### 19. Legal Screens
- Terms & Conditions
- Privacy Policy

---

## Primary Content and Functionality

### Home Screen Content
| Element | Type | Description |
|---------|------|-------------|
| Featured Banner | Carousel | 3-5 featured tracks/artists |
| Trending | Horizontal List | Top 10 trending tracks |
| New Releases | Grid | Latest uploads (2x2) |
| For You | Horizontal List | Personalized recommendations |
| Products | Horizontal List | Music merchandise |

### Create Screen Content
| Element | Type | Description |
|---------|------|-------------|
| AI Creator Card | Action Card | Navigate to AI music generation |
| Upload Card | Action Card | Navigate to upload flow |
| Mastering Card | Action Card | Navigate to mastering studio |
| My Drafts | List | Unpublished works |

### Library Content
| Tab | Content |
|-----|---------|
| Uploads | User's uploaded tracks (limit: 7 free, unlimited premium) |
| Purchases | Bought tracks |
| Downloads | Downloaded files (limit: 3 free, unlimited premium) |
| Liked | Favorited tracks |
| Playlists | User-created playlists |

---

## Key User Flows

### Flow 1: User Registration
1. User opens app → Splash screen
2. First-time user → Onboarding screens
3. Tap "Get Started" → Register screen
4. Enter email, password, name
5. Verify email
6. Complete profile setup
7. Navigate to Home

### Flow 2: Upload Music
1. User taps "Create" tab
2. Select "Upload Music"
3. Pick audio file from device
4. Add metadata (title, genre, description)
5. Upload cover image
6. Navigate to Mastering (optional)
7. Set pricing (free or PGK amount)
8. Review and publish
9. Track appears in Library → Uploads

### Flow 3: Purchase & Download
1. User discovers track on Home/Discover
2. Tap track → Track Detail screen
3. Tap "Buy for K X.XX"
4. Select payment method (PayPal/Stripe/Phone Banking)
5. Complete payment
6. Platform takes 5% commission
7. Download becomes available
8. Tap "Download" → File saved to device
9. Track appears in Library → Purchases & Downloads

### Flow 4: AI Music Creation
1. User taps "Create" tab
2. Select "AI Music Creator"
3. Enter text prompt describing desired music
4. Select genre/style
5. Set duration
6. Tap "Generate"
7. Preview generated track
8. Edit or regenerate if needed
9. Save to drafts or proceed to mastering
10. Publish or download

### Flow 5: Mastering
1. User uploads track or selects from drafts
2. Navigate to Mastering Studio
3. Select preset (4 free options)
4. Adjust Light/Heavy slider
5. Preview original vs mastered
6. Apply mastering
7. Export or proceed to publish

### Flow 6: Subscribe to Premium
1. User hits upload limit (7 tracks) or download limit (3)
2. Prompt shows subscription offer
3. User taps "Subscribe"
4. View premium benefits
5. Select plan (monthly/yearly)
6. Complete payment
7. Premium badge appears on profile
8. Limits removed

### Flow 7: Receive Payment (Artist)
1. User sells track
2. Payment processed (5% to platform)
3. Earnings appear in Profile → My Earnings
4. User sets up payment method
5. Request withdrawal
6. Funds sent to BSP account/PayPal

### Flow 8: Social Interaction
1. User views track
2. Tap heart to like
3. Tap comment icon → Comment sheet
4. Type comment and post
5. Tap share → Share sheet (WhatsApp, Facebook, etc.)
6. Tap message icon → Direct message to artist

---

## Currency & Localization

- **Default Currency**: Papua New Guinea Kina (PGK)
- **Symbol**: K
- **Format**: K XX.XX (e.g., K 15.00)
- **Language**: English (primary), Tok Pisin (future)
- **Date Format**: DD/MM/YYYY

---

## Subscription Tiers

### Free Tier
- 7 uploads
- 3 downloads
- 4 mastering presets
- Basic AI music generation
- Standard support

### Premium Tier (K XX/month)
- Unlimited uploads
- Unlimited downloads
- All mastering presets (20+)
- Advanced AI music generation
- Priority support
- No ads
- Early access to new features

---

## Payment Integration

### Supported Methods
1. **PayPal** - International payments
2. **Stripe** - Card payments
3. **Phone Banking** (PNG-specific)
   - BSP Mobile Banking
   - Westpac Mobile Banking
   - Kina Bank Mobile

### Commission Structure
- Platform fee: 5% of each sale
- Remaining 95% to artist
- Withdrawal minimum: K 50.00

---

## Contact Information (Footer/About)

- **Creator & Founder**: Kenia Sam
- **BSP Account for Donations**: 7002507585
- **Location**: Papua New Guinea
- **WhatsApp**: +675 83828101
- **Email**: keandarles@gmail.com
- **Facebook**: Under Cover Agency

---

## Technical Notes

- All screens use ScreenContainer for safe area handling
- FlatList for all scrollable lists
- Tab navigation with 5 main tabs
- Stack navigation for detail screens
- Modal sheets for quick actions
- AsyncStorage for local data
- Server database for user data, tracks, transactions
- S3 storage for media files
