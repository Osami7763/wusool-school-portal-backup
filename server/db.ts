import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { academicItems, assignments, auditLogs, InsertUser, lessons, schedule, subjects, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  const databaseUrl = process.env.WUSOOL_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!_db && databaseUrl) {
    try {
      _db = drizzle({
        connection: {
          uri: databaseUrl,
          ssl: { rejectUnauthorized: true },
        },
      });
    } catch { _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return r[0]; }
export async function getUserById(id: number) { const db = await getDb(); if (!db) return undefined; const r = await db.select().from(users).where(eq(users.id, id)).limit(1); return r[0]; }
export async function getUserByUsername(username: string) { const db = await getDb(); if (!db) return undefined; const r = await db.select().from(users).where(eq(users.username, username)).limit(1); return r[0]; }
export async function updateSchoolUserPassword(id: number, passwordHash: string) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(users).set({ passwordHash }).where(eq(users.id, id)); return { success: true as const }; }

export async function createSchoolUser(input: { username: string; passwordHash: string; name: string; role: "manager" | "teacher" | "student" | "parent" }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const result = await db.insert(users).values({ openId: `school:${input.username}`, username: input.username, passwordHash: input.passwordHash, name: input.name, role: input.role, loginMethod: "school" });
  return getUserById(Number(result[0].insertId));
}
export async function listSchoolUsers() { const db = await getDb(); if (!db) return []; return db.select({ id: users.id, username: users.username, name: users.name, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).where(eq(users.loginMethod, "school")); }
export async function createAuditLog(input: { actorUserId: number; actorName: string; action: "updated" | "replaced" | "removed"; entityType: "assignment" | "lesson" | "exam" | "research"; entityId: number; details: string }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.insert(auditLogs).values(input); return { success: true as const }; }
export async function listAuditLogs() { const db = await getDb(); if (!db) return []; return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt), desc(auditLogs.id)).limit(100); }

const defaultSubjects = ["الرياضيات 1-1", "الكفايات اللغوية 1-1 (اللغة العربية)", "الكيمياء 1", "الأحياء 1", "القرآن الكريم وتفسيره (أو التفسير)", "اللغة الإنجليزية 1 (Mega Goal)", "التقنية الرقمية 1", "التفكير الناقد"];
let defaultSubjectsPromise: Promise<void> | null = null;
 export async function ensureDefaultSubjects() { if (defaultSubjectsPromise) return defaultSubjectsPromise; defaultSubjectsPromise = (async () => { const db = await getDb(); if (!db) return; const existing = await db.select({ id: subjects.id, name: subjects.name }).from(subjects); const oldQuran = existing.find(item => item.name === "القرآن الكريم وتفسيره"); const names = new Set(existing.map(item => item.name)); if (oldQuran) { await db.update(subjects).set({ name: "القرآن الكريم وتفسيره (أو التفسير)" }).where(eq(subjects.id, oldQuran.id)); names.add("القرآن الكريم وتفسيره (أو التفسير)"); } const highest = await db.select({ id: subjects.id }).from(subjects).orderBy(desc(subjects.id)).limit(1); let nextId = (highest[0]?.id ?? 0) + 1; for (let index = 0; index < defaultSubjects.length; index += 1) { const name = defaultSubjects[index]; if (!names.has(name)) { try { await db.insert(subjects).values({ id: nextId++, name, teacherName: null, color: ["teal", "blue", "violet", "amber", "rose"][index % 5], sortOrder: index, createdAt: new Date() }); } catch (error) { console.error("Default subject insert failed", { name, error: String(error) }); const found = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.name, name)).limit(1); if (!found[0]) throw new Error(`تعذر إضافة المادة الافتراضية: ${name}`); } names.add(name); } } })().catch(error => { defaultSubjectsPromise = null; throw error; }); return defaultSubjectsPromise; }

export async function listSchoolContent() {
  const db = await getDb(); if (!db) return { subjects: [], lessons: [], assignments: [], academicItems: [], schedule: [] };
  await ensureDefaultSubjects();
  const [subjectRows, lessonRows, assignmentRows, academicItemRows, scheduleRows] = await Promise.all([
    db.select().from(subjects).orderBy(asc(subjects.sortOrder), asc(subjects.id)),
    db.select().from(lessons).orderBy(desc(lessons.lessonDate), desc(lessons.id)),
    db.select().from(assignments).orderBy(asc(assignments.dueDate), desc(assignments.id)),
    db.select().from(academicItems).orderBy(asc(academicItems.dueDate), desc(academicItems.id)),
    db.select().from(schedule).orderBy(asc(schedule.dayOfWeek), asc(schedule.period)),
  ]);
  return { subjects: subjectRows, lessons: lessonRows, assignments: assignmentRows, academicItems: academicItemRows, schedule: scheduleRows };
}

export async function createSubject(input: { name: string; teacherName?: string; color: string }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const highest = await db.select({ id: subjects.id }).from(subjects).orderBy(desc(subjects.id)).limit(1); const id = (highest[0]?.id ?? 0) + 1; await db.insert(subjects).values({ id, ...input, teacherName: input.teacherName || null, createdAt: new Date() }); return db.select().from(subjects).where(eq(subjects.id, id)).limit(1).then(x => x[0]); }
export async function updateSubject(id: number, input: { name: string; teacherName?: string; color: string; sortOrder?: number }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(subjects).set({ ...input, teacherName: input.teacherName || null }).where(eq(subjects.id, id)); return { success: true as const }; }
export async function deleteSubject(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.transaction(async tx => { await tx.delete(assignments).where(eq(assignments.subjectId, id)); await tx.delete(lessons).where(eq(lessons.subjectId, id)); await tx.delete(academicItems).where(eq(academicItems.subjectId, id)); await tx.delete(schedule).where(eq(schedule.subjectId, id)); await tx.delete(subjects).where(eq(subjects.id, id)); }); return { success: true as const }; }
export async function createLesson(input: { subjectId: number; title: string; lessonDate: string; page?: string; notes?: string; attachmentUrl?: string; attachmentName?: string; resourceUrl?: string }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const r = await db.insert(lessons).values(input); return db.select().from(lessons).where(eq(lessons.id, Number(r[0].insertId))).limit(1).then(x => x[0]); }
export async function createAssignment(input: { subjectId: number; title: string; description?: string; dueDate: string; attachmentUrl?: string; attachmentName?: string; resourceUrl?: string }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const r = await db.insert(assignments).values(input); return db.select().from(assignments).where(eq(assignments.id, Number(r[0].insertId))).limit(1).then(x => x[0]); }
export async function createAcademicItem(input: { subjectId: number; kind: "exam" | "research"; title: string; description?: string; dueDate: string; attachmentUrl?: string; attachmentName?: string; resourceUrl?: string }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const r = await db.insert(academicItems).values(input); return db.select().from(academicItems).where(eq(academicItems.id, Number(r[0].insertId))).limit(1).then(x => x[0]); }
export async function createScheduleItem(input: { dayOfWeek: number; period: number; subjectId: number; startTime: string; endTime: string; room?: string }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const r = await db.insert(schedule).values(input); return db.select().from(schedule).where(eq(schedule.id, Number(r[0].insertId))).limit(1).then(x => x[0]); }
export async function updateScheduleItem(id: number, input: { dayOfWeek: number; period: number; subjectId: number; startTime: string; endTime: string; room?: string }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(schedule).set(input).where(eq(schedule.id, id)); return { success: true as const }; }
export async function deleteAssignment(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.delete(assignments).where(eq(assignments.id, id)); return { success: true as const }; }
export async function deleteAcademicItem(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.delete(academicItems).where(eq(academicItems.id, id)); return { success: true as const }; }
export async function updateAcademicItem(id: number, input: { title: string; description?: string; dueDate: string; attachmentUrl?: string | null; attachmentName?: string | null; resourceUrl?: string | null }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(academicItems).set(input).where(eq(academicItems.id, id)); return { success: true as const }; }
export async function deleteLesson(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.delete(lessons).where(eq(lessons.id, id)); return { success: true as const }; }
export async function deleteScheduleItem(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.delete(schedule).where(eq(schedule.id, id)); return { success: true as const }; }
export async function updateAssignment(id: number, input: { title: string; description?: string; dueDate: string; attachmentUrl?: string | null; attachmentName?: string | null; resourceUrl?: string | null }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(assignments).set(input).where(eq(assignments.id, id)); return { success: true as const }; }
export async function updateLesson(id: number, input: { title: string; lessonDate: string; page?: string; notes?: string; attachmentUrl?: string | null; attachmentName?: string | null; resourceUrl?: string | null }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(lessons).set(input).where(eq(lessons.id, id)); return { success: true as const }; }
