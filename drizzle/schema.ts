import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "manager", "teacher", "student", "parent"]).default("user").notNull(),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  teacherName: varchar("teacherName", { length: 180 }),
  color: varchar("color", { length: 24 }).default("teal").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  lessonDate: varchar("lessonDate", { length: 10 }).notNull(),
  page: varchar("page", { length: 80 }),
  notes: text("notes"),
  attachmentUrl: text("attachmentUrl"),
  attachmentName: varchar("attachmentName", { length: 255 }),
  resourceUrl: text("resourceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  dueDate: varchar("dueDate", { length: 10 }).notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentName: varchar("attachmentName", { length: 255 }),
  resourceUrl: text("resourceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const academicItems = mysqlTable("academicItems", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  kind: mysqlEnum("kind", ["exam", "research"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  dueDate: varchar("dueDate", { length: 10 }).notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentName: varchar("attachmentName", { length: 255 }),
  resourceUrl: text("resourceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId").notNull(),
  actorName: varchar("actorName", { length: 180 }).notNull(),
  action: mysqlEnum("action", ["updated", "replaced", "removed"]).notNull(),
  entityType: mysqlEnum("entityType", ["assignment", "lesson", "exam", "research"]).notNull(),
  entityId: int("entityId").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const schedule = mysqlTable("schedule", {
  id: int("id").autoincrement().primaryKey(),
  dayOfWeek: int("dayOfWeek").notNull(),
  period: int("period").notNull(),
  subjectId: int("subjectId").notNull(),
  startTime: varchar("startTime", { length: 10 }).notNull(),
  endTime: varchar("endTime", { length: 10 }).notNull(),
  room: varchar("room", { length: 80 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type AcademicItem = typeof academicItems.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ScheduleItem = typeof schedule.$inferSelect;
