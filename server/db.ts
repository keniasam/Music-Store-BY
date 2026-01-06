import { eq, desc, and, or, like, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  tracks, InsertTrack, Track,
  albums, InsertAlbum,
  purchases, InsertPurchase,
  downloads, InsertDownload,
  subscriptions, InsertSubscription,
  likes, InsertLike,
  comments, InsertComment,
  messages, InsertMessage,
  products, InsertProduct,
  follows, InsertFollow,
  notifications, InsertNotification,
  withdrawals, InsertWithdrawal,
  aiGenerations, InsertAiGeneration
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

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
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

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserSubscription(userId: number, tier: "free" | "premium", expiresAt: Date | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ 
    subscriptionTier: tier, 
    subscriptionExpiresAt: expiresAt 
  }).where(eq(users.id, userId));
}

export async function incrementUserUploadCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ 
    uploadCount: sql`${users.uploadCount} + 1` 
  }).where(eq(users.id, userId));
}

export async function incrementUserDownloadCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ 
    downloadCount: sql`${users.downloadCount} + 1` 
  }).where(eq(users.id, userId));
}

// ============ TRACK FUNCTIONS ============

export async function createTrack(data: InsertTrack) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tracks).values(data);
  return result[0].insertId;
}

export async function getTrackById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tracks).where(eq(tracks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserTracks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tracks).where(eq(tracks.userId, userId)).orderBy(desc(tracks.createdAt));
}

export async function getPublishedTracks(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tracks)
    .where(eq(tracks.status, "published"))
    .orderBy(desc(tracks.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getTrendingTracks(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tracks)
    .where(eq(tracks.status, "published"))
    .orderBy(desc(tracks.playCount))
    .limit(limit);
}

export async function searchTracks(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
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

export async function updateTrack(id: number, data: Partial<InsertTrack>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tracks).set(data).where(eq(tracks.id, id));
}

export async function incrementPlayCount(trackId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tracks).set({ 
    playCount: sql`${tracks.playCount} + 1` 
  }).where(eq(tracks.id, trackId));
}

export async function getTracksByGenre(genre: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tracks)
    .where(and(eq(tracks.status, "published"), eq(tracks.genre, genre)))
    .orderBy(desc(tracks.createdAt))
    .limit(limit);
}

// ============ PURCHASE FUNCTIONS ============

export async function createPurchase(data: InsertPurchase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchases).values(data);
  return result[0].insertId;
}

export async function getUserPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchases)
    .where(eq(purchases.buyerId, userId))
    .orderBy(desc(purchases.createdAt));
}

export async function getSellerSales(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchases)
    .where(and(eq(purchases.sellerId, userId), eq(purchases.paymentStatus, "completed")))
    .orderBy(desc(purchases.createdAt));
}

export async function hasPurchasedTrack(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(purchases)
    .where(and(
      eq(purchases.buyerId, userId),
      eq(purchases.trackId, trackId),
      eq(purchases.paymentStatus, "completed")
    ))
    .limit(1);
  return result.length > 0;
}

export async function updatePurchaseStatus(id: number, status: "pending" | "completed" | "failed" | "refunded", transactionId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Partial<InsertPurchase> = { paymentStatus: status };
  if (transactionId) updateData.transactionId = transactionId;
  await db.update(purchases).set(updateData).where(eq(purchases.id, id));
}

// ============ DOWNLOAD FUNCTIONS ============

export async function createDownload(data: InsertDownload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(downloads).values(data);
  return result[0].insertId;
}

export async function getUserDownloads(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(downloads)
    .where(eq(downloads.userId, userId))
    .orderBy(desc(downloads.downloadedAt));
}

export async function getUserDownloadCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(downloads).where(eq(downloads.userId, userId));
  return result[0]?.count ?? 0;
}

// ============ SUBSCRIPTION FUNCTIONS ============

export async function createSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subscriptions).values(data);
  return result[0].insertId;
}

export async function getActiveSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscriptionStatus(id: number, status: "active" | "cancelled" | "expired") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subscriptions).set({ status }).where(eq(subscriptions.id, id));
}

// ============ LIKE FUNCTIONS ============

export async function createLike(data: InsertLike) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(likes).values(data);
  // Update track like count
  if (data.trackId) {
    await db.update(tracks).set({ 
      likeCount: sql`${tracks.likeCount} + 1` 
    }).where(eq(tracks.id, data.trackId));
  }
  return result[0].insertId;
}

export async function deleteLike(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)));
  // Update track like count
  await db.update(tracks).set({ 
    likeCount: sql`${tracks.likeCount} - 1` 
  }).where(eq(tracks.id, trackId));
}

export async function hasLikedTrack(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.trackId, trackId)))
    .limit(1);
  return result.length > 0;
}

export async function getUserLikedTracks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(likes)
    .where(eq(likes.userId, userId))
    .orderBy(desc(likes.createdAt));
}

// ============ COMMENT FUNCTIONS ============

export async function createComment(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(data);
  return result[0].insertId;
}

export async function getTrackComments(trackId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comments)
    .where(eq(comments.trackId, trackId))
    .orderBy(desc(comments.createdAt));
}

export async function deleteComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(comments).where(eq(comments.id, id));
}

// ============ MESSAGE FUNCTIONS ============

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  return result[0].insertId;
}

export async function getUserMessages(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
    .orderBy(desc(messages.createdAt));
}

export async function getConversation(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages)
    .where(or(
      and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
      and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
    ))
    .orderBy(messages.createdAt);
}

export async function markMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
}

// ============ PRODUCT FUNCTIONS ============

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

export async function getProducts(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(eq(products.status, "active"))
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

export async function getUserProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(eq(products.userId, userId))
    .orderBy(desc(products.createdAt));
}

// ============ FOLLOW FUNCTIONS ============

export async function createFollow(data: InsertFollow) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(follows).values(data);
  return result[0].insertId;
}

export async function deleteFollow(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}

export async function isFollowing(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  return result.length > 0;
}

export async function getFollowers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(follows).where(eq(follows.followingId, userId));
}

export async function getFollowing(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(follows).where(eq(follows.followerId, userId));
}

// ============ NOTIFICATION FUNCTIONS ============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function getUserNotifications(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ============ WITHDRAWAL FUNCTIONS ============

export async function createWithdrawal(data: InsertWithdrawal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(withdrawals).values(data);
  return result[0].insertId;
}

export async function getUserWithdrawals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(withdrawals)
    .where(eq(withdrawals.userId, userId))
    .orderBy(desc(withdrawals.createdAt));
}

export async function updateWithdrawalStatus(id: number, status: "pending" | "processing" | "completed" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Partial<InsertWithdrawal> = { status };
  if (status === "completed") {
    updateData.processedAt = new Date();
  }
  await db.update(withdrawals).set(updateData).where(eq(withdrawals.id, id));
}

// ============ AI GENERATION FUNCTIONS ============

export async function createAiGeneration(data: InsertAiGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiGenerations).values(data);
  return result[0].insertId;
}

export async function getUserAiGenerations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiGenerations)
    .where(eq(aiGenerations.userId, userId))
    .orderBy(desc(aiGenerations.createdAt));
}

export async function updateAiGeneration(id: number, data: Partial<InsertAiGeneration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiGenerations).set(data).where(eq(aiGenerations.id, id));
}

// ============ STATS FUNCTIONS ============

export async function getArtistStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalPlays: 0, totalLikes: 0, totalSales: 0, totalEarnings: "0.00" };
  
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
