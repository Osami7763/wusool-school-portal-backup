import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("school management authorization", () => {
  it("rejects content mutations without a manager session", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.school.createSubject({ name: "غير مصرح", color: "teal" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.school.deleteAssignment({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
