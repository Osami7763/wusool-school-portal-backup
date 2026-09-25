import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createAcademicItem, createAssignment, createAuditLog, createLesson, createScheduleItem, createSchoolUser, updateSchoolUserPassword, createSubject, deleteAcademicItem, deleteAssignment, deleteLesson, deleteScheduleItem, deleteSubject, getUserById, getUserByUsername, listAuditLogs, listSchoolContent, listSchoolUsers, updateAcademicItem, updateAssignment, updateLesson, updateScheduleItem, updateSubject } from "./db";
import { storagePut } from "./storage";
import { createSchoolToken, hashPassword, SCHOOL_COOKIE, schoolCookieOptions, verifyPassword } from "./school-auth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const schoolManagerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "manager" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "هذه العملية متاحة لمدير المدرسة فقط" });
  return next({ ctx });
});
const schoolLoginInput = z.object({ username: z.string().trim().min(1).max(64), password: z.string().min(1).max(128) });
const createUserInput = z.object({ username: z.string().trim().min(1).max(64).regex(/^[0-9A-Za-z_-]+$/), password: z.string().min(1).max(128), name: z.string().trim().min(2).max(120), role: z.enum(["teacher", "student", "parent"]) });
const changePasswordInput = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(4).max(128), confirmPassword: z.string().min(4).max(128) }).refine(value => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "رمزا المرور الجديدان غير متطابقين" });
const subjectInput = z.object({ name: z.string().trim().min(2).max(120), color: z.string().max(24).default("teal") });
const lessonInput = z.object({ subjectId: z.number().int().positive(), title: z.string().trim().min(2).max(180), lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), page: z.string().max(80).optional(), notes: z.string().max(5000).optional(), attachmentBase64: z.string().max(12_000_000).optional(), attachmentName: z.string().max(255).optional(), attachmentType: z.string().max(120).optional(), resourceUrl: z.string().url().max(2000).optional() });
const assignmentInput = z.object({ subjectId: z.number().int().positive(), title: z.string().trim().min(2).max(180), description: z.string().max(5000).optional(), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), attachmentBase64: z.string().max(12_000_000).optional(), attachmentName: z.string().max(255).optional(), attachmentType: z.string().max(120).optional(), resourceUrl: z.string().url().max(2000).optional() });
const academicItemInput = z.object({ subjectId: z.number().int().positive(), kind: z.enum(["exam", "research"]), title: z.string().trim().min(2).max(180), description: z.string().max(5000).optional(), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), attachmentBase64: z.string().max(12_000_000).optional(), attachmentName: z.string().max(255).optional(), attachmentType: z.string().max(120).optional(), resourceUrl: z.string().url().max(2000).optional() });
const scheduleInput = z.object({ dayOfWeek: z.number().int().min(0).max(6), period: z.number().int().min(1).max(12), subjectId: z.number().int().positive(), startTime: z.string().max(10), endTime: z.string().max(10), room: z.string().max(80).optional() });
const idInput = z.object({ id: z.number().int().positive() });
const resourceUpdateInput = { attachmentBase64: z.string().max(12_000_000).optional(), attachmentName: z.string().max(255).optional(), attachmentType: z.string().max(120).optional(), removeAttachment: z.boolean().optional(), resourceUrl: z.string().url().max(2000).optional().nullable(), removeResourceUrl: z.boolean().optional() };
const updateAssignmentInput = z.object({ id: z.number().int().positive(), title: z.string().trim().min(2).max(180), description: z.string().max(5000).optional(), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), ...resourceUpdateInput });
const updateAcademicItemInput = z.object({ id: z.number().int().positive(), kind: z.enum(["exam", "research"]).optional(), title: z.string().trim().min(2).max(180), description: z.string().max(5000).optional(), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), ...resourceUpdateInput });
const updateLessonInput = z.object({ id: z.number().int().positive(), title: z.string().trim().min(2).max(180), lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), page: z.string().max(80).optional(), notes: z.string().max(5000).optional(), ...resourceUpdateInput });
const updateSubjectInput = z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(120), color: z.string().max(24), sortOrder: z.number().int().min(0).max(999) });
const updateScheduleInput = z.object({ id: z.number().int().positive(), dayOfWeek: z.number().int().min(0).max(6), period: z.number().int().min(1).max(12), subjectId: z.number().int().positive(), startTime: z.string().max(10), endTime: z.string().max(10), room: z.string().max(80).optional() });

type SchoolUser = import("../drizzle/schema").User;
function publicSchoolUser(user: SchoolUser) { return { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role }; }
async function storeAttachment(base64: string | undefined, name: string | undefined, type: string | undefined, folder: string) { if (!base64) return undefined; const comma = base64.indexOf(","); const raw = comma >= 0 ? base64.slice(comma + 1) : base64; const buffer = Buffer.from(raw, "base64"); if (buffer.length > 8 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "حجم المرفق يجب ألا يتجاوز 8 ميجابايت" }); return storagePut(`${folder}/${Date.now()}-${name || "attachment"}`, buffer, type || "application/octet-stream"); }
async function recordResourceAudit(ctx: { user: SchoolUser }, input: { action: "updated" | "replaced" | "removed"; entityType: "assignment" | "lesson" | "exam" | "research"; entityId: number; details: string }) { return createAuditLog({ actorUserId: ctx.user.id, actorName: ctx.user.name || ctx.user.username || "مدير المدرسة", ...input }); }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user ? publicSchoolUser(ctx.user) : null),
    schoolLogin: publicProcedure.input(schoolLoginInput).mutation(async ({ input, ctx }) => {
      let user = await getUserByUsername(input.username);
      if (!user || user.loginMethod !== "school" || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "رقم المستخدم أو كلمة المرور غير صحيحة" });
      ctx.res.cookie(SCHOOL_COOKIE, await createSchoolToken(user.id), schoolCookieOptions());
      return publicSchoolUser(user);
    }),
    schoolLogout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(SCHOOL_COOKIE, { ...schoolCookieOptions(), maxAge: 0 }); return { success: true } as const; }),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); ctx.res.clearCookie(SCHOOL_COOKIE, { ...schoolCookieOptions(), maxAge: 0 }); return { success: true } as const; }),
  }),
  school: router({
    content: publicProcedure.query(() => listSchoolContent()),
    users: schoolManagerProcedure.query(() => listSchoolUsers()),
    changePassword: schoolManagerProcedure.input(changePasswordInput).mutation(async ({ input, ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user?.passwordHash || !verifyPassword(input.currentPassword, user.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "الرمز الحالي غير صحيح" });
      await updateSchoolUserPassword(user.id, hashPassword(input.newPassword));
      ctx.res.clearCookie(SCHOOL_COOKIE, { ...schoolCookieOptions(), maxAge: 0 });
      return { success: true as const };
    }),
    auditLogs: schoolManagerProcedure.query(() => listAuditLogs()),
    createUser: schoolManagerProcedure.input(createUserInput).mutation(async ({ input }) => {
      if (await getUserByUsername(input.username)) throw new TRPCError({ code: "CONFLICT", message: "رقم المستخدم مستخدم مسبقًا" });
      const user = await createSchoolUser({ username: input.username, passwordHash: hashPassword(input.password), name: input.name, role: input.role });
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر إنشاء الحساب" });
      return publicSchoolUser(user);
    }),
    createSubject: schoolManagerProcedure.input(subjectInput).mutation(({ input }) => createSubject(input)),
    createLesson: schoolManagerProcedure.input(lessonInput).mutation(async ({ input }) => { const { attachmentBase64, attachmentName, attachmentType, ...lesson } = input; const uploaded = await storeAttachment(attachmentBase64, attachmentName, attachmentType, "lessons"); return createLesson({ ...lesson, attachmentUrl: uploaded?.url, attachmentName }); }),
    createAssignment: schoolManagerProcedure.input(assignmentInput).mutation(async ({ input }) => { const { attachmentBase64, attachmentName, attachmentType, ...assignment } = input; const uploaded = await storeAttachment(attachmentBase64, attachmentName, attachmentType, "assignments"); return createAssignment({ ...assignment, attachmentUrl: uploaded?.url, attachmentName }); }),
    createAcademicItem: schoolManagerProcedure.input(academicItemInput).mutation(async ({ input }) => { const { attachmentBase64, attachmentName, attachmentType, ...item } = input; const uploaded = await storeAttachment(attachmentBase64, attachmentName, attachmentType, "academic-items"); return createAcademicItem({ ...item, attachmentUrl: uploaded?.url, attachmentName }); }),
    createScheduleItem: schoolManagerProcedure.input(scheduleInput).mutation(({ input }) => createScheduleItem(input)),
    deleteAssignment: schoolManagerProcedure.input(idInput).mutation(({ input }) => deleteAssignment(input.id)),
    deleteAcademicItem: schoolManagerProcedure.input(idInput).mutation(({ input }) => deleteAcademicItem(input.id)),
    deleteLesson: schoolManagerProcedure.input(idInput).mutation(({ input }) => deleteLesson(input.id)),
    deleteScheduleItem: schoolManagerProcedure.input(idInput).mutation(({ input }) => deleteScheduleItem(input.id)),
    updateAssignment: schoolManagerProcedure.input(updateAssignmentInput).mutation(async ({ input, ctx }) => { const { id, attachmentBase64, attachmentName, attachmentType, removeAttachment, removeResourceUrl, resourceUrl, ...values } = input; const uploaded = await storeAttachment(attachmentBase64, attachmentName, attachmentType, "assignments"); const result = await updateAssignment(id, { ...values, ...(removeAttachment ? { attachmentUrl: null, attachmentName: null } : uploaded ? { attachmentUrl: uploaded.url, attachmentName } : {}), ...(removeResourceUrl ? { resourceUrl: null } : resourceUrl !== undefined ? { resourceUrl } : {}) }); if (removeAttachment || removeResourceUrl || uploaded || resourceUrl !== undefined) await recordResourceAudit(ctx, { action: removeAttachment || removeResourceUrl ? "removed" : uploaded ? "replaced" : "updated", entityType: "assignment", entityId: id, details: `${removeAttachment ? "حذف المرفق" : uploaded ? `استبدال المرفق بملف ${attachmentName || "جديد"}` : "الإبقاء على المرفق"}، ${removeResourceUrl ? "حذف الرابط" : "تحديث الرابط"}` }); return result; }),
    updateAcademicItem: schoolManagerProcedure.input(updateAcademicItemInput).mutation(async ({ input, ctx }) => { const { id, kind, attachmentBase64, attachmentName, attachmentType, removeAttachment, removeResourceUrl, resourceUrl, ...values } = input; const uploaded = await storeAttachment(attachmentBase64, attachmentName, attachmentType, "academic-items"); const result = await updateAcademicItem(id, { ...values, ...(removeAttachment ? { attachmentUrl: null, attachmentName: null } : uploaded ? { attachmentUrl: uploaded.url, attachmentName } : {}), ...(removeResourceUrl ? { resourceUrl: null } : resourceUrl !== undefined ? { resourceUrl } : {}) }); if (removeAttachment || removeResourceUrl || uploaded || resourceUrl !== undefined) await recordResourceAudit(ctx, { action: removeAttachment || removeResourceUrl ? "removed" : uploaded ? "replaced" : "updated", entityType: kind === "research" ? "research" : "exam", entityId: id, details: `${removeAttachment ? "حذف المرفق" : uploaded ? `استبدال المرفق بملف ${attachmentName || "جديد"}` : "الإبقاء على المرفق"}، ${removeResourceUrl ? "حذف الرابط" : "تحديث الرابط"}` }); return result; }),
    updateLesson: schoolManagerProcedure.input(updateLessonInput).mutation(async ({ input, ctx }) => { const { id, attachmentBase64, attachmentName, attachmentType, removeAttachment, removeResourceUrl, resourceUrl, ...values } = input; const uploaded = await storeAttachment(attachmentBase64, attachmentName, attachmentType, "lessons"); const result = await updateLesson(id, { ...values, ...(removeAttachment ? { attachmentUrl: null, attachmentName: null } : uploaded ? { attachmentUrl: uploaded.url, attachmentName } : {}), ...(removeResourceUrl ? { resourceUrl: null } : resourceUrl !== undefined ? { resourceUrl } : {}) }); if (removeAttachment || removeResourceUrl || uploaded || resourceUrl !== undefined) await recordResourceAudit(ctx, { action: removeAttachment || removeResourceUrl ? "removed" : uploaded ? "replaced" : "updated", entityType: "lesson", entityId: id, details: `${removeAttachment ? "حذف المرفق" : uploaded ? `استبدال المرفق بملف ${attachmentName || "جديد"}` : "الإبقاء على المرفق"}، ${removeResourceUrl ? "حذف الرابط" : "تحديث الرابط"}` }); return result; }),
    updateSubject: schoolManagerProcedure.input(updateSubjectInput).mutation(({ input }) => { const { id, ...values } = input; return updateSubject(id, values); }),
    deleteSubject: schoolManagerProcedure.input(idInput).mutation(({ input }) => deleteSubject(input.id)),
    updateScheduleItem: schoolManagerProcedure.input(updateScheduleInput).mutation(({ input }) => { const { id, ...values } = input; return updateScheduleItem(id, values); }),
  }),
});
export type AppRouter = typeof appRouter;
