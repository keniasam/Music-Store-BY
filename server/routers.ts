import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut, storageGet } from "./storage";

// Constants
const FREE_UPLOAD_LIMIT = 7;
const FREE_DOWNLOAD_LIMIT = 3;
const PLATFORM_FEE_PERCENT = 5;

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ USER ROUTES ============
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserById(ctx.user.id);
    }),
    
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255).optional(),
        bio: z.string().max(1000).optional(),
        location: z.string().max(255).optional(),
        whatsapp: z.string().max(20).optional(),
        facebook: z.string().max(255).optional(),
        avatarUrl: z.string().url().optional(),
        paypalEmail: z.string().email().optional(),
        bspAccountNumber: z.string().max(20).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return db.getArtistStats(ctx.user.id);
    }),
    
    getArtist: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) return null;
        const stats = await db.getArtistStats(input.userId);
        return { ...user, stats };
      }),
    
    canUpload: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) return { canUpload: false, remaining: 0 };
      if (user.subscriptionTier === "premium") {
        return { canUpload: true, remaining: -1 }; // unlimited
      }
      const remaining = FREE_UPLOAD_LIMIT - user.uploadCount;
      return { canUpload: remaining > 0, remaining };
    }),
    
    canDownload: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) return { canDownload: false, remaining: 0 };
      if (user.subscriptionTier === "premium") {
        return { canDownload: true, remaining: -1 }; // unlimited
      }
      const remaining = FREE_DOWNLOAD_LIMIT - user.downloadCount;
      return { canDownload: remaining > 0, remaining };
    }),
  }),

  // ============ TRACK ROUTES ============
  tracks: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        genre: z.string().max(100).optional(),
        duration: z.number().optional(),
        audioUrl: z.string().url(),
        coverUrl: z.string().url().optional(),
        videoUrl: z.string().url().optional(),
        price: z.string().default("0.00"),
        isFree: z.boolean().default(true),
        isAiGenerated: z.boolean().default(false),
        masteringPreset: z.string().optional(),
        masteringLevel: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check upload limit
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");
        if (user.subscriptionTier === "free" && user.uploadCount >= FREE_UPLOAD_LIMIT) {
          throw new Error("Upload limit reached. Please upgrade to premium.");
        }
        
        const trackId = await db.createTrack({
          userId: ctx.user.id,
          ...input,
          status: "draft",
        });
        await db.incrementUserUploadCount(ctx.user.id);
        return { trackId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(2000).optional(),
        genre: z.string().max(100).optional(),
        coverUrl: z.string().url().optional(),
        videoUrl: z.string().url().optional(),
        price: z.string().optional(),
        isFree: z.boolean().optional(),
        masteringPreset: z.string().optional(),
        masteringLevel: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const track = await db.getTrackById(input.id);
        if (!track || track.userId !== ctx.user.id) {
          throw new Error("Track not found or unauthorized");
        }
        const { id, ...updateData } = input;
        await db.updateTrack(id, updateData);
        return { success: true };
      }),
    
    publish: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const track = await db.getTrackById(input.id);
        if (!track || track.userId !== ctx.user.id) {
          throw new Error("Track not found or unauthorized");
        }
        await db.updateTrack(input.id, { status: "published" });
        return { success: true };
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTrackById(input.id);
      }),
    
    getUserTracks: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserTracks(ctx.user.id);
    }),
    
    getFeed: publicProcedure
      .input(z.object({ 
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.getPublishedTracks(input.limit, input.offset);
      }),
    
    getTrending: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return db.getTrendingTracks(input.limit);
      }),
    
    search: publicProcedure
      .input(z.object({ 
        query: z.string().min(1),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        return db.searchTracks(input.query, input.limit);
      }),
    
    getByGenre: publicProcedure
      .input(z.object({ 
        genre: z.string(),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        return db.getTracksByGenre(input.genre, input.limit);
      }),
    
    incrementPlay: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementPlayCount(input.id);
        return { success: true };
      }),
  }),

  // ============ PURCHASE ROUTES ============
  purchases: router({
    create: protectedProcedure
      .input(z.object({
        trackId: z.number().optional(),
        albumId: z.number().optional(),
        productId: z.number().optional(),
        paymentMethod: z.enum(["paypal", "stripe", "phone_banking"]),
      }))
      .mutation(async ({ ctx, input }) => {
        let amount = "0.00";
        let sellerId = 0;
        
        if (input.trackId) {
          const track = await db.getTrackById(input.trackId);
          if (!track) throw new Error("Track not found");
          if (track.isFree) throw new Error("Track is free");
          amount = track.price;
          sellerId = track.userId;
        }
        
        const amountNum = parseFloat(amount);
        const platformFee = (amountNum * PLATFORM_FEE_PERCENT / 100).toFixed(2);
        const sellerAmount = (amountNum - parseFloat(platformFee)).toFixed(2);
        
        const purchaseId = await db.createPurchase({
          buyerId: ctx.user.id,
          sellerId,
          trackId: input.trackId,
          albumId: input.albumId,
          productId: input.productId,
          amount,
          platformFee,
          sellerAmount,
          currency: "PGK",
          paymentMethod: input.paymentMethod,
          paymentStatus: "pending",
        });
        
        return { purchaseId, amount, platformFee, sellerAmount };
      }),
    
    complete: protectedProcedure
      .input(z.object({
        purchaseId: z.number(),
        transactionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updatePurchaseStatus(input.purchaseId, "completed", input.transactionId);
        return { success: true };
      }),
    
    getUserPurchases: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPurchases(ctx.user.id);
    }),
    
    getSales: protectedProcedure.query(async ({ ctx }) => {
      return db.getSellerSales(ctx.user.id);
    }),
    
    hasPurchased: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.hasPurchasedTrack(ctx.user.id, input.trackId);
      }),
  }),

  // ============ DOWNLOAD ROUTES ============
  downloads: router({
    create: protectedProcedure
      .input(z.object({
        trackId: z.number().optional(),
        albumId: z.number().optional(),
        purchaseId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check download limit
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");
        
        if (user.subscriptionTier === "free" && user.downloadCount >= FREE_DOWNLOAD_LIMIT) {
          throw new Error("Download limit reached. Please upgrade to premium.");
        }
        
        // Verify purchase if track is paid
        if (input.trackId) {
          const track = await db.getTrackById(input.trackId);
          if (track && !track.isFree) {
            const hasPurchased = await db.hasPurchasedTrack(ctx.user.id, input.trackId);
            if (!hasPurchased) {
              throw new Error("Please purchase this track first");
            }
          }
        }
        
        const downloadId = await db.createDownload({
          userId: ctx.user.id,
          ...input,
        });
        await db.incrementUserDownloadCount(ctx.user.id);
        
        // Get download URL
        if (input.trackId) {
          const track = await db.getTrackById(input.trackId);
          if (track) {
            await db.updateTrack(input.trackId, { 
              downloadCount: track.downloadCount + 1 
            });
            return { downloadId, url: track.audioUrl };
          }
        }
        
        return { downloadId, url: null };
      }),
    
    getUserDownloads: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserDownloads(ctx.user.id);
    }),
  }),

  // ============ SUBSCRIPTION ROUTES ============
  subscriptions: router({
    create: protectedProcedure
      .input(z.object({
        billingCycle: z.enum(["monthly", "yearly"]),
        paymentMethod: z.enum(["paypal", "stripe", "phone_banking"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const amount = input.billingCycle === "monthly" ? "29.99" : "299.99";
        const endDate = new Date();
        if (input.billingCycle === "monthly") {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        
        const subscriptionId = await db.createSubscription({
          userId: ctx.user.id,
          tier: "premium",
          amount,
          currency: "PGK",
          billingCycle: input.billingCycle,
          paymentMethod: input.paymentMethod,
          status: "active",
          startDate: new Date(),
          endDate,
        });
        
        await db.updateUserSubscription(ctx.user.id, "premium", endDate);
        
        return { subscriptionId, amount, endDate };
      }),
    
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getActiveSubscription(ctx.user.id);
      if (subscription) {
        await db.updateSubscriptionStatus(subscription.id, "cancelled");
      }
      return { success: true };
    }),
    
    getActive: protectedProcedure.query(async ({ ctx }) => {
      return db.getActiveSubscription(ctx.user.id);
    }),
  }),

  // ============ LIKE ROUTES ============
  likes: router({
    toggle: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const hasLiked = await db.hasLikedTrack(ctx.user.id, input.trackId);
        if (hasLiked) {
          await db.deleteLike(ctx.user.id, input.trackId);
          return { liked: false };
        } else {
          await db.createLike({ userId: ctx.user.id, trackId: input.trackId });
          return { liked: true };
        }
      }),
    
    hasLiked: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.hasLikedTrack(ctx.user.id, input.trackId);
      }),
    
    getUserLikes: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserLikedTracks(ctx.user.id);
    }),
  }),

  // ============ COMMENT ROUTES ============
  comments: router({
    create: protectedProcedure
      .input(z.object({
        trackId: z.number(),
        content: z.string().min(1).max(1000),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.createComment({
          userId: ctx.user.id,
          ...input,
        });
        return { commentId };
      }),
    
    getTrackComments: publicProcedure
      .input(z.object({ trackId: z.number() }))
      .query(async ({ input }) => {
        return db.getTrackComments(input.trackId);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteComment(input.id);
        return { success: true };
      }),
  }),

  // ============ MESSAGE ROUTES ============
  messages: router({
    send: protectedProcedure
      .input(z.object({
        receiverId: z.number(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const messageId = await db.createMessage({
          senderId: ctx.user.id,
          ...input,
        });
        return { messageId };
      }),
    
    getConversation: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getConversation(ctx.user.id, input.userId);
      }),
    
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserMessages(ctx.user.id);
    }),
    
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markMessageAsRead(input.id);
        return { success: true };
      }),
  }),

  // ============ PRODUCT ROUTES ============
  products: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        imageUrl: z.string().url().optional(),
        price: z.string(),
        category: z.string().max(100).optional(),
        stock: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const productId = await db.createProduct({
          userId: ctx.user.id,
          ...input,
        });
        return { productId };
      }),
    
    getAll: publicProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return db.getProducts(input.limit);
      }),
    
    getUserProducts: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProducts(ctx.user.id);
    }),
  }),

  // ============ FOLLOW ROUTES ============
  follows: router({
    toggle: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.userId) {
          throw new Error("Cannot follow yourself");
        }
        const isFollowing = await db.isFollowing(ctx.user.id, input.userId);
        if (isFollowing) {
          await db.deleteFollow(ctx.user.id, input.userId);
          return { following: false };
        } else {
          await db.createFollow({ followerId: ctx.user.id, followingId: input.userId });
          return { following: true };
        }
      }),
    
    isFollowing: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.isFollowing(ctx.user.id, input.userId);
      }),
    
    getFollowers: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getFollowers(input.userId);
      }),
    
    getFollowing: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getFollowing(input.userId);
      }),
  }),

  // ============ NOTIFICATION ROUTES ============
  notifications: router({
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return db.getUserNotifications(ctx.user.id, input.limit);
      }),
    
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),
    
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ============ WITHDRAWAL ROUTES ============
  withdrawals: router({
    create: protectedProcedure
      .input(z.object({
        amount: z.string(),
        paymentMethod: z.enum(["paypal", "bsp"]),
        paymentDetails: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");
        
        const amountNum = parseFloat(input.amount);
        const balanceNum = parseFloat(user.availableBalance);
        
        if (amountNum > balanceNum) {
          throw new Error("Insufficient balance");
        }
        if (amountNum < 50) {
          throw new Error("Minimum withdrawal is K 50.00");
        }
        
        const withdrawalId = await db.createWithdrawal({
          userId: ctx.user.id,
          ...input,
        });
        
        // Deduct from balance
        await db.updateUserProfile(ctx.user.id, {
          availableBalance: (balanceNum - amountNum).toFixed(2),
        });
        
        return { withdrawalId };
      }),
    
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserWithdrawals(ctx.user.id);
    }),
  }),

  // ============ STORAGE ROUTES ============
  storage: router({
    getUploadUrl: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        contentType: z.string(),
        folder: z.enum(["audio", "images", "videos"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const key = `${input.folder}/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        return { key, uploadPath: key };
      }),
    
    upload: protectedProcedure
      .input(z.object({
        key: z.string(),
        data: z.string(), // base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.data, "base64");
        const result = await storagePut(input.key, buffer, input.contentType);
        return result;
      }),
    
    getUrl: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const result = await storageGet(input.key);
        return result;
      }),
  }),

  // ============ AI GENERATION ROUTES ============
  ai: router({
    generateMusic: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(500),
        genre: z.string().max(100).optional(),
        duration: z.number().min(10).max(300).default(60),
      }))
      .mutation(async ({ ctx, input }) => {
        const generationId = await db.createAiGeneration({
          userId: ctx.user.id,
          ...input,
          status: "pending",
        });
        
        // Note: Actual AI generation would be handled by a background job
        // For now, we just create the record
        return { generationId, status: "pending" };
      }),
    
    getGenerations: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAiGenerations(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
