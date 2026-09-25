import mysql from "mysql2/promise";

async function main() {
  const url = process.env.WUSOOL_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Database URL is not configured");
  const connection = await mysql.createConnection({ uri: url, ssl: { rejectUnauthorized: true } });
  try {
    try {
      await connection.query("ALTER TABLE subjects ADD COLUMN teacherName varchar(180) NULL");
      console.log("Added subjects.teacherName");
    } catch (error) {
      const message = String(error);
      if (!message.includes("Duplicate column") && !message.includes("1060")) throw error;
      console.log("subjects.teacherName already exists");
    }
  } finally {
    await connection.end();
  }
}

main().catch(error => { console.error("Schema preparation failed", error); process.exitCode = 1; });
