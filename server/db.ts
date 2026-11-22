import fs from "fs";
import path from "path";
import { eq, desc, and, or, like, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, User, users, 
  tracks, InsertTrack, Track,
  albums, InsertAlbum, Album,
  purchases, InsertPurchase, Purchase,
  downloads, InsertDownload, Download,
  subscriptions, InsertSubscription, Subscription,
  likes, InsertLike, Like,
  comments, InsertComment, Comment,
  messages, InsertMessage, Message,
  products, InsertProduct, Product,
  follows, InsertFollow, Follow,
  notifications, InsertNotification, Notification,
  withdrawals, InsertWithdrawal, Withdrawal,
  aiGenerations, InsertAiGeneration, AiGeneration
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ IN-MEMORY FALLBACK STORE ============


const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_FILE = path.resolve(DATA_DIR, "local-db.json");

function saveStoreToDisk(store: MemoryStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serialized = {
      users: Array.from(store.users.entries()),
      usersByOpenId: Array.from(store.usersByOpenId.entries()),
      tracks: Array.from(store.tracks.entries()),
      purchases: Array.from(store.purchases.entries()),
      downloads: Array.from(store.downloads.entries()),
      subscriptions: Array.from(store.subscriptions.entries()),
      likes: Array.from(store.likes.entries()),
      comments: Array.from(store.comments.entries()),
      messages: Array.from(store.messages.entries()),
      products: Array.from(store.products.entries()),
      follows: Array.from(store.follows.entries()),
      notifications: Array.from(store.notifications.entries()),
      withdrawals: Array.from(store.withdrawals.entries()),
      aiGenerations: Array.from(store.aiGenerations.entries()),
      nextId: store.nextId,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(serialized, null, 2), "utf-8");
  } catch (error) {
    console.warn("[Database] Failed to save local-db.json to disk:", error);
  }
}

let saveTimeout: any = null;
export function scheduleSaveStore() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveStoreToDisk(memoryStore);
  }, 100);
}

export function generateTrackWaveform(trackId: number, count = 60): number[] {
  const bars: number[] = [];
  let seed = trackId * 9301 + 49297;
  for (let i = 0; i < count; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    const envelope = Math.sin(((i + 1) / (count + 1)) * Math.PI);
    const value = Math.max(0.18, Math.min(0.96, (0.35 + 0.65 * rnd) * (0.45 + 0.55 * envelope)));
    bars.push(parseFloat(value.toFixed(2)));
  }
  return bars;
}

interface MemoryStore {
  users: Map<number, User>;
  usersByOpenId: Map<string, number>;
  tracks: Map<number, Track>;
  purchases: Map<number, Purchase>;
  downloads: Map<number, Download>;
  subscriptions: Map<number, Subscription>;
  likes: Map<number, Like>;
  comments: Map<number, Comment>;
  messages: Map<number, Message>;
  products: Map<number, Product>;
  follows: Map<number, Follow>;
  notifications: Map<number, Notification>;
  withdrawals: Map<number, Withdrawal>;
  aiGenerations: Map<number, AiGeneration>;
  nextId: { [K: string]: number };
}

function initializeMemoryStore(): MemoryStore {
  if (fs.existsSync(STORE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
      const reviveMap = <K, V>(entries: [K, V][]): Map<K, V> => {
        const m = new Map<K, V>();
        if (Array.isArray(entries)) {
          for (const [k, v] of entries) {
            if (v && typeof v === "object") {
              for (const prop in v) {
                if (typeof (v as any)[prop] === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test((v as any)[prop])) {
                  (v as any)[prop] = new Date((v as any)[prop]);
                }
              }
            }
            m.set(k, v);
          }
        }
        return m;
      };

      return {
        users: reviveMap(data.users),
        usersByOpenId: new Map(data.usersByOpenId || []),
        tracks: reviveMap(data.tracks),
        purchases: reviveMap(data.purchases),
        downloads: reviveMap(data.downloads),
        subscriptions: reviveMap(data.subscriptions),
        likes: reviveMap(data.likes),
        comments: reviveMap(data.comments),
        messages: reviveMap(data.messages),
        products: reviveMap(data.products),
        follows: reviveMap(data.follows),
        notifications: reviveMap(data.notifications),
        withdrawals: reviveMap(data.withdrawals),
        aiGenerations: reviveMap(data.aiGenerations),
        nextId: data.nextId || {
          users: 4,
          tracks: 8,
          purchases: 2,
          downloads: 2,
          subscriptions: 1,
          likes: 3,
          comments: 2,
          messages: 1,
          products: 1,
          follows: 1,
          notifications: 1,
          withdrawals: 1,
          aiGenerations: 1,
        },
      };
    } catch (e) {
      console.warn("[Database] Could not parse existing local-db.json, re-seeding:", e);
    }
  }
  const store: MemoryStore = {
    users: new Map(),
    usersByOpenId: new Map(),
    tracks: new Map(),
    purchases: new Map(),
    downloads: new Map(),
    subscriptions: new Map(),
    likes: new Map(),
    comments: new Map(),
    messages: new Map(),
    products: new Map(),
    follows: new Map(),
    notifications: new Map(),
    withdrawals: new Map(),
    aiGenerations: new Map(),
    nextId: {
      users: 1,
      tracks: 1,
      purchases: 1,
      downloads: 1,
      subscriptions: 1,
      likes: 1,
      comments: 1,
      messages: 1,
      products: 1,
      follows: 1,
      notifications: 1,
      withdrawals: 1,
      aiGenerations: 1,
    },
  };

  // Seed Users
  const user1: User = {
    id: 1,
    openId: "demo_artist_1",
    name: "Justin Wellington",
    email: "justin@pngmusic.com",
    loginMethod: "local",
    role: "admin",
    avatarUrl: null,
    bio: "PNG recording artist known for island reggae and international hits.",
    location: "Port Moresby, PNG",
    whatsapp: "+675 7000 1234",
    facebook: "JustinWellingtonPNG",
    subscriptionTier: "premium",
    subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    uploadCount: 3,
    downloadCount: 15,
    totalEarnings: "1250.00",
    availableBalance: "980.00",
    paypalEmail: "justin@pngmusic.com",
    bspAccountNumber: "1002938472",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const user2: User = {
    id: 2,
    openId: "demo_artist_2",
    name: "Avii",
    email: "avii@pngmusic.com",
    loginMethod: "local",
    role: "user",
    avatarUrl: null,
    bio: "Rising island vibes and Melanesian soul creator.",
    location: "Rabaul, East New Britain",
    whatsapp: "+675 7123 4567",
    facebook: "AviiMusicPNG",
    subscriptionTier: "free",
    subscriptionExpiresAt: null,
    uploadCount: 2,
    downloadCount: 8,
    totalEarnings: "450.00",
    availableBalance: "320.00",
    paypalEmail: null,
    bspAccountNumber: "1003495812",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const user3: User = {
    id: 3,
    openId: "demo_listener",
    name: "PNG Music Fan",
    email: "fan@pngmusic.com",
    loginMethod: "local",
    role: "user",
    avatarUrl: null,
    bio: "Big supporter of PNG indigenous and contemporary music.",
    location: "Lae, Morobe",
    whatsapp: null,
    facebook: null,
    subscriptionTier: "free",
    subscriptionExpiresAt: null,
    uploadCount: 0,
    downloadCount: 4,
    totalEarnings: "0.00",
    availableBalance: "0.00",
    paypalEmail: null,
    bspAccountNumber: null,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  [user1, user2, user3].forEach((u) => {
    store.users.set(u.id, u);
    store.usersByOpenId.set(u.openId, u.id);
  });
  store.nextId.users = 4;

  // Seed Tracks
  const demoTracks: Track[] = [
    {
      id: 1,
      userId: 1,
      title: "Wantok Musik",
      description: "Feel-good Melanesian reggae anthem celebrating Pacific unity and brotherhood.",
      genre: "Reggae",
      duration: 215,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      coverUrl: null,
      videoUrl: null,
      price: "5.00",
      isFree: false,
      isAiGenerated: false,
      masteringPreset: "warm_tube",
      masteringLevel: "medium",
      playCount: 15420,
      likeCount: 892,
      downloadCount: 310,
      status: "published",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date(),
    },
    {
      id: 2,
      userId: 2,
      title: "Paradise Vibes",
      description: "Relaxed acoustic guitar and island percussion recorded on the beaches of Rabaul.",
      genre: "Pop",
      duration: 198,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      coverUrl: null,
      videoUrl: null,
      price: "0.00",
      isFree: true,
      isAiGenerated: false,
      masteringPreset: "acoustic_air",
      masteringLevel: "light",
      playCount: 12300,
      likeCount: 654,
      downloadCount: 820,
      status: "published",
      createdAt: new Date("2025-01-05"),
      updatedAt: new Date(),
    },
    {
      id: 3,
      userId: 1,
      title: "Highlands Love",
      description: "Traditional bamboo flute fused with modern upbeat acoustic stringband chords.",
      genre: "Traditional",
      duration: 240,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      coverUrl: null,
      videoUrl: null,
      price: "3.50",
      isFree: false,
      isAiGenerated: false,
      masteringPreset: "balanced",
      masteringLevel: "medium",
      playCount: 9800,
      likeCount: 421,
      downloadCount: 190,
      status: "published",
      createdAt: new Date("2025-01-10"),
      updatedAt: new Date(),
    },
    {
      id: 4,
      userId: 2,
      title: "Morobe Dreams",
      description: "Urban hip-hop rhythms reflecting the energy and soul of downtown Lae.",
      genre: "Hip Hop",
      duration: 185,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      coverUrl: null,
      videoUrl: null,
      price: "4.00",
      isFree: false,
      isAiGenerated: false,
      masteringPreset: "bass_heavy",
      masteringLevel: "heavy",
      playCount: 8500,
      likeCount: 395,
      downloadCount: 145,
      status: "published",
      createdAt: new Date("2025-01-12"),
      updatedAt: new Date(),
    },
    {
      id: 5,
      userId: 1,
      title: "Port Moresby Nights",
      description: "Smooth evening R&B melodies with island harmony backing vocals.",
      genre: "R&B",
      duration: 220,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      coverUrl: null,
      videoUrl: null,
      price: "0.00",
      isFree: true,
      isAiGenerated: false,
      masteringPreset: "vocal_shine",
      masteringLevel: "medium",
      playCount: 7200,
      likeCount: 298,
      downloadCount: 512,
      status: "published",
      createdAt: new Date("2025-01-15"),
      updatedAt: new Date(),
    },
    {
      id: 6,
      userId: 2,
      title: "Sepik River Flow",
      description: "Atmospheric traditional chanting blended with contemporary stringband rhythms.",
      genre: "Traditional",
      duration: 260,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
      coverUrl: null,
      videoUrl: null,
      price: "3.50",
      isFree: false,
      isAiGenerated: false,
      masteringPreset: "balanced",
      masteringLevel: "light",
      playCount: 6100,
      likeCount: 215,
      downloadCount: 110,
      status: "published",
      createdAt: new Date("2025-01-18"),
      updatedAt: new Date(),
    },
    {
      id: 7,
      userId: 1,
      title: "Rabaul Sunrise (Gospel)",
      description: "Uplifting Sunday morning praise inspired by the resilience and beauty of PNG.",
      genre: "Gospel",
      duration: 230,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
      coverUrl: null,
      videoUrl: null,
      price: "0.00",
      isFree: true,
      isAiGenerated: false,
      masteringPreset: "balanced",
      masteringLevel: "medium",
      playCount: 5400,
      likeCount: 312,
      downloadCount: 420,
      status: "published",
      createdAt: new Date("2025-01-20"),
      updatedAt: new Date(),
    },
  ];

  demoTracks.forEach((t) => {
    store.tracks.set(t.id, t);
  });
  store.nextId.tracks = 8;

  // Seed sample purchases
  store.purchases.set(1, {
    id: 1,
    buyerId: 3,
    sellerId: 1,
    trackId: 1,
    albumId: null,
    productId: null,
    amount: "5.00",
    platformFee: "0.25",
    sellerAmount: "4.75",
    currency: "PGK",
    paymentMethod: "phone_banking",
    paymentStatus: "completed",
    transactionId: "TXN-PNG-10928",
    createdAt: new Date("2025-01-03"),
    updatedAt: new Date(),
  });
  store.nextId.purchases = 2;

  // Seed sample downloads
  store.downloads.set(1, {
    id: 1,
    userId: 3,
    trackId: 1,
    albumId: null,
    purchaseId: 1,
    downloadedAt: new Date("2025-01-03"),
  });
  store.nextId.downloads = 2;

  // Seed sample likes
  store.likes.set(1, { id: 1, userId: 3, trackId: 1, albumId: null, createdAt: new Date() });
  store.likes.set(2, { id: 2, userId: 3, trackId: 2, albumId: null, createdAt: new Date() });
  store.nextId.likes = 3;

  // Seed sample comments
  store.comments.set(1, {
    id: 1,
    userId: 3,
    trackId: 1,
    albumId: null,
    content: "True PNG sound! Proud of our local artists!",
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  store.nextId.comments = 2;

  return store;
}

const memoryStore = initializeMemoryStore();

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    // In-memory fallback
    let existingId = memoryStore.usersByOpenId.get(user.openId);
    let existing = existingId ? memoryStore.users.get(existingId) : undefined;

    if (existing) {
      const updated: User = {
        ...existing,
        name: user.name !== undefined ? user.name : existing.name,
        email: user.email !== undefined ? user.email : existing.email,
        loginMethod: user.loginMethod !== undefined ? user.loginMethod : existing.loginMethod,
        role: user.role !== undefined ? user.role : (user.openId === ENV.ownerOpenId ? "admin" : existing.role),
        lastSignedIn: user.lastSignedIn || new Date(),
        updatedAt: new Date(),
      };
      memoryStore.users.set(existing.id, updated);
    scheduleSaveStore();
    } else {
      const id = memoryStore.nextId.users++;
      const newUser: User = {
        id,
        openId: user.openId,
        name: user.name || null,
        email: user.email || null,
        loginMethod: user.loginMethod || "local",
        role: user.role || (user.openId === ENV.ownerOpenId ? "admin" : "user"),
        avatarUrl: user.avatarUrl || null,
        bio: user.bio || null,
        location: user.location || null,
        whatsapp: user.whatsapp || null,
        facebook: user.facebook || null,
        subscriptionTier: user.subscriptionTier || "free",
        subscriptionExpiresAt: user.subscriptionExpiresAt || null,
        uploadCount: user.uploadCount || 0,
        downloadCount: user.downloadCount || 0,
        totalEarnings: user.totalEarnings || "0.00",
        availableBalance: user.availableBalance || "0.00",
        paypalEmail: user.paypalEmail || null,
        bspAccountNumber: user.bspAccountNumber || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: user.lastSignedIn || new Date(),
      };
      memoryStore.users.set(id, newUser);
    scheduleSaveStore();
      memoryStore.usersByOpenId.set(user.openId, id);
    scheduleSaveStore();
    }
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    const userId = memoryStore.usersByOpenId.get(openId);
    return userId ? memoryStore.users.get(userId) : undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    return memoryStore.users.get(id);
  }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) {
    const user = memoryStore.users.get(userId);
    if (user) {
      memoryStore.users.set(userId, { ...user, ...data, updatedAt: new Date() } as User);
    scheduleSaveStore();
    }
    return;
  }
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserSubscription(userId: number, tier: "free" | "premium", expiresAt: Date | null): Promise<void> {
  const db = await getDb();
  if (!db) {
    const user = memoryStore.users.get(userId);
    if (user) {
      memoryStore.users.set(userId, { 
        ...user, 
        subscriptionTier: tier, 
        subscriptionExpiresAt: expiresAt, 
        updatedAt: new Date() 
      });
    scheduleSaveStore();
    }
    return;
  }
  await db.update(users).set({ 
    subscriptionTier: tier, 
    subscriptionExpiresAt: expiresAt 
  }).where(eq(users.id, userId));
}

export async function incrementUserUploadCount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    const user = memoryStore.users.get(userId);
    if (user) {
      memoryStore.users.set(userId, { ...user, uploadCount: user.uploadCount + 1, updatedAt: new Date() });
    scheduleSaveStore();
    }
    return;
  }
  await db.update(users).set({ 
    uploadCount: sql`${users.uploadCount} + 1` 
  }).where(eq(users.id, userId));
}

export async function incrementUserDownloadCount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    const user = memoryStore.users.get(userId);
    if (user) {
      memoryStore.users.set(userId, { ...user, downloadCount: user.downloadCount + 1, updatedAt: new Date() });
    scheduleSaveStore();
    }
    return;
  }
  await db.update(users).set({ 
    downloadCount: sql`${users.downloadCount} + 1` 
  }).where(eq(users.id, userId));
}

// ============ TRACK FUNCTIONS ============

export async function createTrack(data: InsertTrack): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.tracks++;
    const newTrack: Track = {
      id,
      userId: data.userId,
      title: data.title,
      description: data.description || null,
      genre: data.genre || null,
      duration: data.duration || null,
      audioUrl: data.audioUrl,
      coverUrl: data.coverUrl || null,
      videoUrl: data.videoUrl || null,
      price: data.price || "0.00",
      isFree: data.isFree !== undefined ? data.isFree : true,
      isAiGenerated: data.isAiGenerated !== undefined ? data.isAiGenerated : false,
      masteringPreset: data.masteringPreset || null,
      masteringLevel: data.masteringLevel || null,
      playCount: 0,
      likeCount: 0,
      downloadCount: 0,
      status: data.status || "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.tracks.set(id, newTrack);
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(tracks).values(data);
  return result[0].insertId;
}

export async function getTrackById(id: number): Promise<Track | undefined> {
  const db = await getDb();
  if (!db) {
    return memoryStore.tracks.get(id);
  }
  const result = await db.select().from(tracks).where(eq(tracks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserTracks(userId: number): Promise<Track[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.tracks.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(tracks).where(eq(tracks.userId, userId)).orderBy(desc(tracks.createdAt));
}

export async function getPublishedTracks(limit = 20, offset = 0): Promise<Track[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.tracks.values())
      .filter((t) => t.status === "published")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
  return db.select().from(tracks)
    .where(eq(tracks.status, "published"))
    .orderBy(desc(tracks.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getTrendingTracks(limit = 10): Promise<Track[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.tracks.values())
      .filter((t) => t.status === "published")
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }
  return db.select().from(tracks)
    .where(eq(tracks.status, "published"))
    .orderBy(desc(tracks.playCount))
    .limit(limit);
}

export async function searchTracks(query: string, limit = 20): Promise<Track[]> {
  const db = await getDb();
  if (!db) {
    const q = query.toLowerCase();
    return Array.from(memoryStore.tracks.values())
      .filter((t) => 
        t.status === "published" && (
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.genre && t.genre.toLowerCase().includes(q))
        )
      )
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }
  return db.select().from(tracks)
    .where(and(
      eq(tracks.status, "published"),
      or(
        like(tracks.title, `%${query}%`),
        like(tracks.description, `%${query}%`),
        like(tracks.genre, `%${query}%`)
      )
    ))
    .orderBy(desc(tracks.playCount))
    .limit(limit);
}

export async function updateTrack(id: number, data: Partial<InsertTrack>): Promise<void> {
  const db = await getDb();
  if (!db) {
    const track = memoryStore.tracks.get(id);
    if (track) {
      memoryStore.tracks.set(id, { ...track, ...data, updatedAt: new Date() } as Track);
    scheduleSaveStore();
    }
    return;
  }
  await db.update(tracks).set(data).where(eq(tracks.id, id));
}

export async function incrementPlayCount(trackId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    const track = memoryStore.tracks.get(trackId);
    if (track) {
      track.playCount += 1;
      memoryStore.tracks.set(trackId, track);
    scheduleSaveStore();
    }
    return;
  }
  await db.update(tracks).set({ 
    playCount: sql`${tracks.playCount} + 1` 
  }).where(eq(tracks.id, trackId));
}

export async function getTracksByGenre(genre: string, limit = 20): Promise<Track[]> {
  const db = await getDb();
  if (!db) {
    const g = genre.toLowerCase();
    return Array.from(memoryStore.tracks.values())
      .filter((t) => t.status === "published" && t.genre && t.genre.toLowerCase() === g)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  return db.select().from(tracks)
    .where(and(eq(tracks.status, "published"), eq(tracks.genre, genre)))
    .orderBy(desc(tracks.createdAt))
    .limit(limit);
}

// ============ PURCHASE FUNCTIONS ============

export async function createPurchase(data: InsertPurchase): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.purchases++;
    const purchase: Purchase = {
      id,
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      trackId: data.trackId || null,
      albumId: data.albumId || null,
      productId: data.productId || null,
      amount: data.amount,
      platformFee: data.platformFee,
      sellerAmount: data.sellerAmount,
      currency: data.currency || "PGK",
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus || "pending",
      transactionId: data.transactionId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.purchases.set(id, purchase);
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(purchases).values(data);
  return result[0].insertId;
}

export async function getPurchaseById(id: number): Promise<Purchase | undefined> {
  const db = await getDb();
  if (!db) {
    return memoryStore.purchases.get(id);
  }
  const result = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
  return result[0];
}

export async function getUserPurchases(userId: number): Promise<Purchase[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.purchases.values())
      .filter((p) => p.buyerId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(purchases)
    .where(eq(purchases.buyerId, userId))
    .orderBy(desc(purchases.createdAt));
}

export async function getSellerSales(userId: number): Promise<Purchase[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.purchases.values())
      .filter((p) => p.sellerId === userId && p.paymentStatus === "completed")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(purchases)
    .where(and(eq(purchases.sellerId, userId), eq(purchases.paymentStatus, "completed")))
    .orderBy(desc(purchases.createdAt));
}

export async function hasPurchasedTrack(userId: number, trackId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.purchases.values()).some(
      (p) => p.buyerId === userId && p.trackId === trackId && p.paymentStatus === "completed"
    );
  }
  const result = await db.select().from(purchases)
    .where(and(
      eq(purchases.buyerId, userId),
      eq(purchases.trackId, trackId),
      eq(purchases.paymentStatus, "completed")
    ))
    .limit(1);
  return result.length > 0;
}

export async function updatePurchaseStatus(
  id: number, 
  status: "pending" | "completed" | "failed" | "refunded", 
  transactionId?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    const purchase = memoryStore.purchases.get(id);
    if (purchase) {
      purchase.paymentStatus = status;
      if (transactionId) purchase.transactionId = transactionId;
      purchase.updatedAt = new Date();
      memoryStore.purchases.set(id, purchase);
    scheduleSaveStore();
    }
    return;
  }
  const updateData: Partial<InsertPurchase> = { paymentStatus: status };
  if (transactionId) updateData.transactionId = transactionId;
  await db.update(purchases).set(updateData).where(eq(purchases.id, id));
}

// ============ DOWNLOAD FUNCTIONS ============

export async function createDownload(data: InsertDownload): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.downloads++;
    const download: Download = {
      id,
      userId: data.userId,
      trackId: data.trackId || null,
      albumId: data.albumId || null,
      purchaseId: data.purchaseId || null,
      downloadedAt: new Date(),
    };
    memoryStore.downloads.set(id, download);
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(downloads).values(data);
  return result[0].insertId;
}

export async function getUserDownloads(userId: number): Promise<Download[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.downloads.values())
      .filter((d) => d.userId === userId)
      .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime());
  }
  return db.select().from(downloads)
    .where(eq(downloads.userId, userId))
    .orderBy(desc(downloads.downloadedAt));
}

export async function getUserDownloadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.downloads.values()).filter((d) => d.userId === userId).length;
  }
  const result = await db.select({ count: count() }).from(downloads).where(eq(downloads.userId, userId));
  return result[0]?.count ?? 0;
}

// ============ SUBSCRIPTION FUNCTIONS ============

export async function createSubscription(data: InsertSubscription): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.subscriptions++;
    const sub: Subscription = {
      id,
      userId: data.userId,
      tier: data.tier,
      amount: data.amount,
      currency: data.currency || "PGK",
      billingCycle: data.billingCycle,
      paymentMethod: data.paymentMethod,
      status: data.status || "active",
      startDate: new Date(),
      endDate: data.endDate,
      autoRenew: data.autoRenew !== undefined ? data.autoRenew : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.subscriptions.set(id, sub);
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(subscriptions).values(data);
  return result[0].insertId;
}

export async function getActiveSubscription(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.subscriptions.values()).find(
      (s) => s.userId === userId && s.status === "active"
    );
  }
  const result = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscriptionStatus(id: number, status: "active" | "cancelled" | "expired"): Promise<void> {
  const db = await getDb();
  if (!db) {
    const sub = memoryStore.subscriptions.get(id);
    if (sub) {
      sub.status = status;
      sub.updatedAt = new Date();
      memoryStore.subscriptions.set(id, sub);
    scheduleSaveStore();
    }
    return;
  }
  await db.update(subscriptions).set({ status }).where(eq(subscriptions.id, id));
}

// ============ LIKE FUNCTIONS ============

export async function createLike(data: InsertLike): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.likes++;
    const likeItem: Like = {
      id,
      userId: data.userId,
      trackId: data.trackId || null,
      albumId: data.albumId || null,
      createdAt: new Date(),
    };
    memoryStore.likes.set(id, likeItem);
    scheduleSaveStore();
    if (data.trackId) {
      const track = memoryStore.tracks.get(data.trackId);
      if (track) {
        track.likeCount += 1;
        memoryStore.tracks.set(data.trackId, track);
    scheduleSaveStore();
      }
    }
    return id;
  }
  const result = await db.insert(likes).values(data);
  if (data.trackId) {
    await db.update(tracks).set({ 
      likeCount: sql`${tracks.likeCount} + 1` 
    }).where(eq(tracks.id, data.trackId));
  }
  return result[0].insertId;
}

export async function deleteLike(userId: number, trackId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    for (const [id, likeItem] of memoryStore.likes.entries()) {
      if (likeItem.userId === userId && likeItem.trackId === trackId) {
        memoryStore.likes.delete(id);
    scheduleSaveStore();
        break;
      }
    }
    const track = memoryStore.tracks.get(trackId);
    if (track && track.likeCount > 0) {
      track.likeCount -= 1;
      memoryStore.tracks.set(trackId, track);
    scheduleSaveStore();
    }
    return;
  }
  await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)));
  await db.update(tracks).set({ 
    likeCount: sql`${tracks.likeCount} - 1` 
  }).where(eq(tracks.id, trackId));
}

export async function hasLikedTrack(userId: number, trackId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.likes.values()).some(
      (l) => l.userId === userId && l.trackId === trackId
    );
  }
  const result = await db.select().from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)))
    .limit(1);
  return result.length > 0;
}

export async function getUserLikedTracks(userId: number): Promise<Track[]> {
  const db = await getDb();
  if (!db) {
    const trackIds = Array.from(memoryStore.likes.values())
      .filter((l) => l.userId === userId && l.trackId)
      .map((l) => l.trackId!);
    return trackIds
      .map((id) => memoryStore.tracks.get(id))
      .filter((t): t is Track => t !== undefined);
  }
  const userLikes = await db.select().from(likes)
    .where(eq(likes.userId, userId))
    .orderBy(desc(likes.createdAt));
  
  if (userLikes.length === 0) return [];
  const trackIds = userLikes.map(l => l.trackId).filter((id): id is number => id !== null);
  if (trackIds.length === 0) return [];
  
  return db.select().from(tracks).where(or(...trackIds.map(id => eq(tracks.id, id))));
}

// ============ COMMENT FUNCTIONS ============

export async function createComment(data: InsertComment): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.comments++;
    const comment: Comment = {
      id,
      userId: data.userId,
      trackId: data.trackId || null,
      albumId: data.albumId || null,
      content: data.content,
      parentId: data.parentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.comments.set(id, comment);
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(comments).values(data);
  return result[0].insertId;
}

export async function getTrackComments(trackId: number): Promise<Comment[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.comments.values())
      .filter((c) => c.trackId === trackId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(comments)
    .where(eq(comments.trackId, trackId))
    .orderBy(desc(comments.createdAt));
}

export async function deleteComment(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    memoryStore.comments.delete(id);
    scheduleSaveStore();
    return;
  }
  await db.delete(comments).where(eq(comments.id, id));
}

// ============ MESSAGE FUNCTIONS ============

export async function createMessage(data: InsertMessage): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.messages++;
    const msg: Message = {
      id,
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      isRead: false,
      createdAt: new Date(),
    };
    memoryStore.messages.set(id, msg);
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(messages).values(data);
  return result[0].insertId;
}

export async function getUserMessages(userId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.messages.values())
      .filter((m) => m.senderId === userId || m.receiverId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
    .orderBy(desc(messages.createdAt));
}

export async function getConversation(userId1: number, userId2: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.messages.values())
      .filter(
        (m) =>
          (m.senderId === userId1 && m.receiverId === userId2) ||
          (m.senderId === userId2 && m.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  return db.select().from(messages)
    .where(or(
      and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
      and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
    ))
    .orderBy(messages.createdAt);
}

export async function markMessageAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    const msg = memoryStore.messages.get(id);
    if (msg) {
      msg.isRead = true;
      memoryStore.messages.set(id, msg);
    scheduleSaveStore();
    }
    return;
  }
  await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
}

// ============ PRODUCT FUNCTIONS ============

export async function createProduct(data: InsertProduct): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.products++;
    const product: Product = {
      id,
      userId: data.userId,
      title: data.title,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      price: data.price,
      currency: data.currency || "PGK",
      category: data.category || null,
      stock: data.stock !== undefined ? data.stock : 0,
      status: data.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.products.set(id, product);
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

export async function getProducts(limit = 20): Promise<Product[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.products.values())
      .filter((p) => p.status === "active")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  return db.select().from(products)
    .where(eq(products.status, "active"))
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

export async function getUserProducts(userId: number): Promise<Product[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.products.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(products)
    .where(eq(products.userId, userId))
    .orderBy(desc(products.createdAt));
}

// ============ FOLLOW FUNCTIONS ============

export async function createFollow(data: InsertFollow): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.follows++;
    memoryStore.follows.set(id, { id, followerId: data.followerId, followingId: data.followingId, createdAt: new Date() });
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(follows).values(data);
  return result[0].insertId;
}

export async function deleteFollow(followerId: number, followingId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    for (const [id, f] of memoryStore.follows.entries()) {
      if (f.followerId === followerId && f.followingId === followingId) {
        memoryStore.follows.delete(id);
    scheduleSaveStore();
        break;
      }
    }
    return;
  }
  await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.follows.values()).some(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
  }
  const result = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  return result.length > 0;
}

export async function getFollowers(userId: number): Promise<Follow[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.follows.values()).filter((f) => f.followingId === userId);
  }
  return db.select().from(follows).where(eq(follows.followingId, userId));
}

export async function getFollowing(userId: number): Promise<Follow[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.follows.values()).filter((f) => f.followerId === userId);
  }
  return db.select().from(follows).where(eq(follows.followerId, userId));
}

// ============ NOTIFICATION FUNCTIONS ============

export async function createNotification(data: InsertNotification): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.notifications++;
    const notif: Notification = {
      id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      content: data.content || null,
      relatedId: data.relatedId || null,
      isRead: false,
      createdAt: new Date(),
    };
    memoryStore.notifications.set(id, notif);
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function getUserNotifications(userId: number, limit = 50): Promise<Notification[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    const notif = memoryStore.notifications.get(id);
    if (notif) {
      notif.isRead = true;
      memoryStore.notifications.set(id, notif);
    scheduleSaveStore();
    }
    return;
  }
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    for (const [id, notif] of memoryStore.notifications.entries()) {
      if (notif.userId === userId) {
        notif.isRead = true;
        memoryStore.notifications.set(id, notif);
    scheduleSaveStore();
      }
    }
    return;
  }
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ============ WITHDRAWAL FUNCTIONS ============

export async function createWithdrawal(data: InsertWithdrawal): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.withdrawals++;
    const w: Withdrawal = {
      id,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency || "PGK",
      paymentMethod: data.paymentMethod,
      paymentDetails: data.paymentDetails || null,
      status: data.status || "pending",
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.withdrawals.set(id, w);
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(withdrawals).values(data);
  return result[0].insertId;
}

export async function getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.withdrawals.values())
      .filter((w) => w.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(withdrawals)
    .where(eq(withdrawals.userId, userId))
    .orderBy(desc(withdrawals.createdAt));
}

export async function updateWithdrawalStatus(
  id: number, 
  status: "pending" | "processing" | "completed" | "failed"
): Promise<void> {
  const db = await getDb();
  if (!db) {
    const w = memoryStore.withdrawals.get(id);
    if (w) {
      w.status = status;
      if (status === "completed") w.processedAt = new Date();
      w.updatedAt = new Date();
      memoryStore.withdrawals.set(id, w);
    scheduleSaveStore();
    }
    return;
  }
  const updateData: Partial<InsertWithdrawal> = { status };
  if (status === "completed") {
    updateData.processedAt = new Date();
  }
  await db.update(withdrawals).set(updateData).where(eq(withdrawals.id, id));
}

// ============ AI GENERATION FUNCTIONS ============

export async function createAiGeneration(data: InsertAiGeneration): Promise<number> {
  const db = await getDb();
  if (!db) {
    const id = memoryStore.nextId.aiGenerations++;
    const gen: AiGeneration = {
      id,
      userId: data.userId,
      prompt: data.prompt,
      genre: data.genre || null,
      duration: data.duration || null,
      resultUrl: data.resultUrl || null,
      status: data.status || "pending",
      createdAt: new Date(),
    };
    memoryStore.aiGenerations.set(id, gen);
    scheduleSaveStore();
    return id;
  }
  const result = await db.insert(aiGenerations).values(data);
  return result[0].insertId;
}

export async function getUserAiGenerations(userId: number): Promise<AiGeneration[]> {
  const db = await getDb();
  if (!db) {
    return Array.from(memoryStore.aiGenerations.values())
      .filter((g) => g.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(aiGenerations)
    .where(eq(aiGenerations.userId, userId))
    .orderBy(desc(aiGenerations.createdAt));
}

export async function updateAiGeneration(id: number, data: Partial<InsertAiGeneration>): Promise<void> {
  const db = await getDb();
  if (!db) {
    const gen = memoryStore.aiGenerations.get(id);
    if (gen) {
      memoryStore.aiGenerations.set(id, { ...gen, ...data });
    scheduleSaveStore();
    }
    return;
  }
  await db.update(aiGenerations).set(data).where(eq(aiGenerations.id, id));
}

// ============ STATS FUNCTIONS ============

export async function getArtistStats(userId: number): Promise<{
  totalPlays: number;
  totalLikes: number;
  totalSales: number;
  totalEarnings: string;
}> {
  const db = await getDb();
  if (!db) {
    const userTracks = Array.from(memoryStore.tracks.values()).filter((t) => t.userId === userId);
    const totalPlays = userTracks.reduce((acc, t) => acc + t.playCount, 0);
    const totalLikes = userTracks.reduce((acc, t) => acc + t.likeCount, 0);
    const completedSales = Array.from(memoryStore.purchases.values()).filter(
      (p) => p.sellerId === userId && p.paymentStatus === "completed"
    );
    const totalSales = completedSales.length;
    const totalEarnings = completedSales
      .reduce((acc, p) => acc + parseFloat(p.sellerAmount || "0"), 0)
      .toFixed(2);

    return { totalPlays, totalLikes, totalSales, totalEarnings };
  }
  
  const trackStats = await db.select({
    totalPlays: sql<number>`COALESCE(SUM(${tracks.playCount}), 0)`,
    totalLikes: sql<number>`COALESCE(SUM(${tracks.likeCount}), 0)`,
  }).from(tracks).where(eq(tracks.userId, userId));
  
  const salesStats = await db.select({
    totalSales: count(),
    totalEarnings: sql<string>`COALESCE(SUM(${purchases.sellerAmount}), 0)`,
  }).from(purchases).where(and(eq(purchases.sellerId, userId), eq(purchases.paymentStatus, "completed")));
  
  return {
    totalPlays: trackStats[0]?.totalPlays ?? 0,
    totalLikes: trackStats[0]?.totalLikes ?? 0,
    totalSales: salesStats[0]?.totalSales ?? 0,
    totalEarnings: salesStats[0]?.totalEarnings ?? "0.00",
  };
}
