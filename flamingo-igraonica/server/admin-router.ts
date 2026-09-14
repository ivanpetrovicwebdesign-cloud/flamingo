import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { clearAdminSession, createAdminSession, isValidAdminPassword } from "./custom-admin";
import { supabaseAdmin } from "./supabase-admin";
import { flamingoAdminProcedure, publicProcedure, router } from "./_core/trpc";

const fail = (error: { message: string } | null) => { if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message }); };
const packageInput = z.object({ eyebrow: z.string(), title: z.string(), description: z.string(), price: z.string(), color: z.enum(["lilac", "coral", "navy"]), features: z.array(z.string()), is_active: z.boolean(), sort_order: z.number().int() });
const featureInput = z.object({ icon: z.string(), title: z.string(), description: z.string(), is_active: z.boolean(), sort_order: z.number().int() });

export const flamingoAdminRouter = router({
  status: publicProcedure.query(({ ctx }) => ({ authenticated: ctx.adminSession })),
  login: publicProcedure.input(z.object({ password: z.string().min(1) })).mutation(async ({ ctx, input }) => { if (!isValidAdminPassword(input.password)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Lozinka nije ispravna" }); await createAdminSession(ctx.res); return { success: true as const }; }),
  logout: publicProcedure.mutation(({ ctx }) => { clearAdminSession(ctx.res); return { success: true as const }; }),
  publicContent: publicProcedure.query(async () => {
    const [packages, features, gallery] = await Promise.all([
      supabaseAdmin.from("packages").select("*").eq("is_active", true).order("sort_order"),
      supabaseAdmin.from("about_features").select("*").eq("is_active", true).order("sort_order"),
      supabaseAdmin.from("gallery").select("*").eq("is_active", true).order("sort_order"),
    ]);
    fail(packages.error); fail(features.error); fail(gallery.error);
    return { packages: packages.data ?? [], features: features.data ?? [], gallery: gallery.data ?? [] };
  }),
  submitReservation: publicProcedure.input(z.object({ name: z.string().min(1), phone: z.string().min(1), occasion: z.string(), message: z.string() })).mutation(async ({ input }) => { const result = await supabaseAdmin.from("reservations").insert({ ...input, status: "novi" }); fail(result.error); return { success: true as const }; }),
  content: flamingoAdminProcedure.query(async () => {
    const [reservations, packages, features, gallery] = await Promise.all([
      supabaseAdmin.from("reservations").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("packages").select("*").order("sort_order"),
      supabaseAdmin.from("about_features").select("*").order("sort_order"),
      supabaseAdmin.from("gallery").select("*").order("sort_order"),
    ]);
    fail(reservations.error); fail(packages.error); fail(features.error); fail(gallery.error);
    return { reservations: reservations.data ?? [], packages: packages.data ?? [], features: features.data ?? [], gallery: gallery.data ?? [] };
  }),
  reservations: router({
    status: flamingoAdminProcedure.input(z.object({ id: z.string().uuid(), status: z.enum(["novi", "potvrdjen", "odbijen"]) })).mutation(async ({ input }) => { const result = await supabaseAdmin.from("reservations").update({ status: input.status }).eq("id", input.id); fail(result.error); return { success: true as const }; }),
    remove: flamingoAdminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => { const result = await supabaseAdmin.from("reservations").delete().eq("id", input.id); fail(result.error); return { success: true as const }; }),
  }),
  packages: router({
    create: flamingoAdminProcedure.input(packageInput).mutation(async ({ input }) => { const result = await supabaseAdmin.from("packages").insert(input).select().single(); fail(result.error); return result.data; }),
    update: flamingoAdminProcedure.input(packageInput.extend({ id: z.string().uuid() })).mutation(async ({ input }) => { const { id, ...values } = input; const result = await supabaseAdmin.from("packages").update(values).eq("id", id).select().single(); fail(result.error); return result.data; }),
    remove: flamingoAdminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => { const result = await supabaseAdmin.from("packages").delete().eq("id", input.id); fail(result.error); return { success: true as const }; }),
  }),
  aboutFeatures: router({
    create: flamingoAdminProcedure.input(featureInput).mutation(async ({ input }) => { const result = await supabaseAdmin.from("about_features").insert(input).select().single(); fail(result.error); return result.data; }),
    update: flamingoAdminProcedure.input(featureInput.extend({ id: z.string().uuid() })).mutation(async ({ input }) => { const { id, ...values } = input; const result = await supabaseAdmin.from("about_features").update(values).eq("id", id).select().single(); fail(result.error); return result.data; }),
    remove: flamingoAdminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => { const result = await supabaseAdmin.from("about_features").delete().eq("id", input.id); fail(result.error); return { success: true as const }; }),
  }),
  gallery: router({
    upload: flamingoAdminProcedure.input(z.object({ title: z.string(), fileName: z.string(), contentType: z.string(), dataBase64: z.string().max(15_000_000), sort_order: z.number().int() })).mutation(async ({ input }) => { const storagePath = `gallery/${Date.now()}-${randomUUID()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`; const upload = await supabaseAdmin.storage.from("gallery").upload(storagePath, Buffer.from(input.dataBase64, "base64"), { contentType: input.contentType }); fail(upload.error); const image_url = supabaseAdmin.storage.from("gallery").getPublicUrl(storagePath).data.publicUrl; const result = await supabaseAdmin.from("gallery").insert({ title: input.title, image_url, storage_path: storagePath, is_active: true, sort_order: input.sort_order }).select().single(); fail(result.error); return result.data; }),
    remove: flamingoAdminProcedure.input(z.object({ id: z.string().uuid(), storage_path: z.string().nullable() })).mutation(async ({ input }) => { if (input.storage_path) await supabaseAdmin.storage.from("gallery").remove([input.storage_path]); const result = await supabaseAdmin.from("gallery").delete().eq("id", input.id); fail(result.error); return { success: true as const }; }),
  }),
});
