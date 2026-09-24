import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse } from "cookie";
import { getSchoolUserFromToken, SCHOOL_COOKIE } from "../school-auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const cookies = parse(opts.req.headers.cookie ?? "");

  if (cookies[SCHOOL_COOKIE]) {
    user = await getSchoolUserFromToken(cookies[SCHOOL_COOKIE]);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
