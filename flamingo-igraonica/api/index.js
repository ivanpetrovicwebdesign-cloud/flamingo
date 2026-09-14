// server/app.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  supabaseUrl: process.env.VITE_SUPABASE_URL || "https://vhpxhkgazdnlmizozeud.supabase.co",
  // Public reads and inquiry inserts may use the publishable key. Protected
  // admin CRUD still requires SUPABASE_SERVICE_ROLE_KEY in production.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_B3znLt5SCkyJCLH7rWvVcw_hebfKrTa",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({ transformer: superjson });
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  if (!opts.ctx.user) throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  return opts.next({ ctx: { ...opts.ctx, user: opts.ctx.user } });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(t.middleware(async (opts) => {
  if (!opts.ctx.user || opts.ctx.user.role !== "admin") throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  return opts.next({ ctx: { ...opts.ctx, user: opts.ctx.user } });
}));
var flamingoAdminProcedure = t.procedure.use(t.middleware(async (opts) => {
  if (!opts.ctx.adminSession) throw new TRPCError2({ code: "UNAUTHORIZED", message: "Flamingo admin session required" });
  return opts.next({ ctx: { ...opts.ctx, adminSession: true } });
}));

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/admin-router.ts
import { randomUUID } from "node:crypto";
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/custom-admin.ts
import { timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
var ADMIN_SESSION_COOKIE = "flamingo_admin_session";
var SESSION_SECONDS = 60 * 60 * 8;
var fallbackSecret = "flamingo-local-session-secret";
var secret = () => new TextEncoder().encode(ENV.cookieSecret || fallbackSecret);
function isValidAdminPassword(value) {
  const expected = process.env.FLAMINGO_ADMIN_PASSWORD || "flamingo2026";
  if (!expected || value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
function cookie(request) {
  return (request.headers.cookie ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))?.slice(ADMIN_SESSION_COOKIE.length + 1);
}
async function verifyAdminSession(request) {
  const token = cookie(request);
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(decodeURIComponent(token), secret(), { algorithms: ["HS256"] });
    return payload.role === "flamingo-admin";
  } catch {
    return false;
  }
}
async function createAdminSession(response) {
  const token = await new SignJWT({ role: "flamingo-admin" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_SECONDS}s`).sign(secret());
  response.cookie(ADMIN_SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: ENV.isProduction, maxAge: SESSION_SECONDS * 1e3, path: "/" });
}
function clearAdminSession(response) {
  response.clearCookie(ADMIN_SESSION_COOKIE, { httpOnly: true, sameSite: "lax", secure: ENV.isProduction, path: "/" });
}

// server/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";
var supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

// server/admin-router.ts
var fail = (error) => {
  if (error) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: error.message });
};
var packageInput = z2.object({ eyebrow: z2.string(), title: z2.string(), description: z2.string(), price: z2.string(), color: z2.enum(["lilac", "coral", "navy"]), features: z2.array(z2.string()), is_active: z2.boolean(), sort_order: z2.number().int() });
var featureInput = z2.object({ icon: z2.string(), title: z2.string(), description: z2.string(), is_active: z2.boolean(), sort_order: z2.number().int() });
var flamingoAdminRouter = router({
  status: publicProcedure.query(({ ctx }) => ({ authenticated: ctx.adminSession })),
  login: publicProcedure.input(z2.object({ password: z2.string().min(1) })).mutation(async ({ ctx, input }) => {
    if (!isValidAdminPassword(input.password)) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Lozinka nije ispravna" });
    await createAdminSession(ctx.res);
    return { success: true };
  }),
  logout: publicProcedure.mutation(({ ctx }) => {
    clearAdminSession(ctx.res);
    return { success: true };
  }),
  publicContent: publicProcedure.query(async () => {
    const [packages, features, gallery] = await Promise.all([
      supabaseAdmin.from("packages").select("*").eq("is_active", true).order("sort_order"),
      supabaseAdmin.from("about_features").select("*").eq("is_active", true).order("sort_order"),
      supabaseAdmin.from("gallery").select("*").eq("is_active", true).order("sort_order")
    ]);
    fail(packages.error);
    fail(features.error);
    fail(gallery.error);
    return { packages: packages.data ?? [], features: features.data ?? [], gallery: gallery.data ?? [] };
  }),
  submitReservation: publicProcedure.input(z2.object({ name: z2.string().min(1), phone: z2.string().min(1), occasion: z2.string(), message: z2.string() })).mutation(async ({ input }) => {
    const result = await supabaseAdmin.from("reservations").insert({ ...input, status: "novi" });
    fail(result.error);
    return { success: true };
  }),
  content: flamingoAdminProcedure.query(async () => {
    const [reservations, packages, features, gallery] = await Promise.all([
      supabaseAdmin.from("reservations").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("packages").select("*").order("sort_order"),
      supabaseAdmin.from("about_features").select("*").order("sort_order"),
      supabaseAdmin.from("gallery").select("*").order("sort_order")
    ]);
    fail(reservations.error);
    fail(packages.error);
    fail(features.error);
    fail(gallery.error);
    return { reservations: reservations.data ?? [], packages: packages.data ?? [], features: features.data ?? [], gallery: gallery.data ?? [] };
  }),
  reservations: router({
    status: flamingoAdminProcedure.input(z2.object({ id: z2.string().uuid(), status: z2.enum(["novi", "potvrdjen", "odbijen"]) })).mutation(async ({ input }) => {
      const result = await supabaseAdmin.from("reservations").update({ status: input.status }).eq("id", input.id);
      fail(result.error);
      return { success: true };
    }),
    remove: flamingoAdminProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      const result = await supabaseAdmin.from("reservations").delete().eq("id", input.id);
      fail(result.error);
      return { success: true };
    })
  }),
  packages: router({
    create: flamingoAdminProcedure.input(packageInput).mutation(async ({ input }) => {
      const result = await supabaseAdmin.from("packages").insert(input).select().single();
      fail(result.error);
      return result.data;
    }),
    update: flamingoAdminProcedure.input(packageInput.extend({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      const { id, ...values } = input;
      const result = await supabaseAdmin.from("packages").update(values).eq("id", id).select().single();
      fail(result.error);
      return result.data;
    }),
    remove: flamingoAdminProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      const result = await supabaseAdmin.from("packages").delete().eq("id", input.id);
      fail(result.error);
      return { success: true };
    })
  }),
  aboutFeatures: router({
    create: flamingoAdminProcedure.input(featureInput).mutation(async ({ input }) => {
      const result = await supabaseAdmin.from("about_features").insert(input).select().single();
      fail(result.error);
      return result.data;
    }),
    update: flamingoAdminProcedure.input(featureInput.extend({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      const { id, ...values } = input;
      const result = await supabaseAdmin.from("about_features").update(values).eq("id", id).select().single();
      fail(result.error);
      return result.data;
    }),
    remove: flamingoAdminProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      const result = await supabaseAdmin.from("about_features").delete().eq("id", input.id);
      fail(result.error);
      return { success: true };
    })
  }),
  gallery: router({
    upload: flamingoAdminProcedure.input(z2.object({ title: z2.string(), fileName: z2.string(), contentType: z2.string(), dataBase64: z2.string().max(15e6), sort_order: z2.number().int() })).mutation(async ({ input }) => {
      const storagePath = `gallery/${Date.now()}-${randomUUID()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const upload = await supabaseAdmin.storage.from("gallery").upload(storagePath, Buffer.from(input.dataBase64, "base64"), { contentType: input.contentType });
      fail(upload.error);
      const image_url = supabaseAdmin.storage.from("gallery").getPublicUrl(storagePath).data.publicUrl;
      const result = await supabaseAdmin.from("gallery").insert({ title: input.title, image_url, storage_path: storagePath, is_active: true, sort_order: input.sort_order }).select().single();
      fail(result.error);
      return result.data;
    }),
    remove: flamingoAdminProcedure.input(z2.object({ id: z2.string().uuid(), storage_path: z2.string().nullable() })).mutation(async ({ input }) => {
      if (input.storage_path) await supabaseAdmin.storage.from("gallery").remove([input.storage_path]);
      const result = await supabaseAdmin.from("gallery").delete().eq("id", input.id);
      fail(result.error);
      return { success: true };
    })
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  flamingoAdmin: flamingoAdminRouter
});

// server/_core/context.ts
async function createContext(opts) {
  const adminSession = await verifyAdminSession(opts.req);
  return { req: opts.req, res: opts.res, user: null, adminSession };
}

// server/app.ts
function createApp() {
  const app2 = express();
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  const health = (_req, res) => res.status(200).json({ ok: true, service: "flamingo-api" });
  app2.get("/health", health);
  app2.get("/api/health", health);
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app2;
}
var app = createApp();

// api/index.ts
var index_default = app;
export {
  index_default as default
};
