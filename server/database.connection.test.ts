import { describe, expect, it } from "vitest";
import mysql from "mysql2/promise";

describe("TiDB database connection", () => {
  it("connects and answers a lightweight SELECT 1 query", async () => {
    const connectionUrl = process.env.WUSOOL_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!connectionUrl) {
      throw new Error("WUSOOL_DATABASE_URL or DATABASE_URL is required");
    }

    const connection = await mysql.createConnection({
      uri: connectionUrl,
      ssl: { rejectUnauthorized: true },
    });
    try {
      const [rows] = await connection.query("SELECT 1 AS ok");
      expect((rows as Array<{ ok: number }>)[0]?.ok).toBe(1);
    } finally {
      await connection.end();
    }
  }, 30_000);
});
