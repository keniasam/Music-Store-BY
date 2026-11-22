import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "../server/_core/context";

type CookieCall = {
  name: string;
  value?: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userOverride?: AuthenticatedUser | null): { 
  ctx: TrpcContext; 
  clearedCookies: CookieCall[];
  setCookies: CookieCall[];
} {
  const clearedCookies: CookieCall[] = [];
  const setCookies: CookieCall[] = [];
  
  const user: AuthenticatedUser = userOverride !== undefined ? userOverride! : {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "local",
    role: "user",
    avatarUrl: null,
    bio: null,
    location: null,
    whatsapp: null,
    facebook: null,
    subscriptionTier: "free",
    subscriptionExpiresAt: null,
    uploadCount: 0,
    downloadCount: 0,
    totalEarnings: "0.00",
    availableBalance: "0.00",
    paypalEmail: null,
    bspAccountNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      hostname: "localhost",
    } as unknown as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
    } as unknown as TrpcContext["res"],
  };
  
  return { ctx, clearedCookies, setCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});

describe("auth local flows", () => {
  it("registers a new user and sets session cookie", async () => {
    const { ctx, setCookies } = createAuthContext(null);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.register({
      email: "testartist@pngmusic.com",
      password: "password123",
      name: "Test PNG Artist",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("testartist@pngmusic.com");
    expect(result.user.name).toBe("Test PNG Artist");
    expect(result.token).toBeDefined();
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("logs in an existing or new user", async () => {
    const { ctx, setCookies } = createAuthContext(null);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      email: "testartist@pngmusic.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(setCookies).toHaveLength(1);
  });

  it("performs 1-click demo artist login", async () => {
    const { ctx, setCookies } = createAuthContext(null);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.demoLogin({ role: "artist" });

    expect(result.success).toBe(true);
    expect(result.user?.name).toBe("Justin Wellington");
    expect(result.token).toBeDefined();
    expect(setCookies).toHaveLength(1);
  });
});

describe("tracks API fallback store", () => {
  it("returns trending tracks from fallback memory store", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const trending = await caller.tracks.getTrending({ limit: 5 });

    expect(trending.length).toBeGreaterThan(0);
    expect(trending[0]?.title).toBe("Wantok Musik");
    expect(trending[0]?.genre).toBe("Reggae");
  });
});
