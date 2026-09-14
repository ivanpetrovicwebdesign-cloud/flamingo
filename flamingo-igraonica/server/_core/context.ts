import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifyAdminSession } from "../custom-admin";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  adminSession: boolean;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const adminSession = await verifyAdminSession(opts.req);
  return { req: opts.req, res: opts.res, user: null, adminSession };
}
